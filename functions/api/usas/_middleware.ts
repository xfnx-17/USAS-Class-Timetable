import { getUsasProxyPath, isAllowedUsasMethod } from '../../../src/shared/lib/usasProxy';

const API_ORIGIN = 'https://mobile.usas.edu.my/umc_v2';
const LOGIN_PATH = '/student/login_student.php';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 60;

type RateLimitKV = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

type PagesContext = {
  request: Request;
  env?: {
    TURNSTILE_SECRET_KEY?: string;
    RATE_LIMIT_KV?: RateLimitKV;
  };
};

function buildUpstreamUrl(request: Request): string | null {
  const url = new URL(request.url);
  const cleanPath = getUsasProxyPath(url.pathname);
  if (!cleanPath) return null;
  return `${API_ORIGIN}${cleanPath}${url.search}`;
}

function jsonResponse(body: unknown, status: number, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}

// Fixed-window counter backed by a KV namespace. Reads/writes are best-effort:
// if the namespace is not bound (e.g. local dev) or fails, requests are allowed.
async function isRateLimited(kv: RateLimitKV, key: string): Promise<boolean> {
  const bucket = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const counterKey = `rl:${key}:${bucket}`;
  try {
    const current = Number(await kv.get(counterKey)) || 0;
    if (current >= RATE_LIMIT_MAX_REQUESTS) return true;
    await kv.put(counterKey, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS * 2 });
    return false;
  } catch {
    return false;
  }
}

async function verifyTurnstileToken(token: string, secret: string, ip?: string): Promise<boolean> {
  if (!token) return false;
  try {
    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);
    if (ip) form.append('remoteip', ip);

    const res = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body: form });
    if (!res.ok) return false;

    const data = (await res.json()) as { success?: boolean };
    return data?.success === true;
  } catch {
    return false;
  }
}

async function buildErrorPage(request: Request, status: 500 | 502 | 503 | 504): Promise<Response> {
  const pageUrl = new URL(`/${status}.html`, request.url);
  const pageResponse = await fetch(pageUrl);
  const html = await pageResponse.text();
  return new Response(html, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer',
    },
  });
}

function wantsHtml(request: Request): boolean {
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

export async function onRequest(context: PagesContext) {
  if (!isAllowedUsasMethod(context.request.method)) {
    return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);
  }

  const url = new URL(context.request.url);
  const cleanPath = getUsasProxyPath(url.pathname);
  if (!cleanPath) {
    return jsonResponse({ success: false, error: 'Not found.' }, 404);
  }

  const ip = context.request.headers.get('cf-connecting-ip') || 'unknown';

  // Best-effort per-IP rate limiting when the KV namespace is bound.
  const limiter = context.env?.RATE_LIMIT_KV;
  if (limiter && (await isRateLimited(limiter, ip))) {
    console.warn('usas-proxy rate limited', { ip, path: cleanPath });
    return jsonResponse(
      { success: false, error: 'Terlalu banyak permintaan. Sila cuba sebentar lagi.' },
      429,
      { 'retry-after': String(RATE_LIMIT_WINDOW_SECONDS) },
    );
  }

  // Verify the Cloudflare Turnstile token on login before proxying upstream.
  // Skipped only when the secret is not configured (e.g. local dev).
  if (cleanPath === LOGIN_PATH) {
    const secret = context.env?.TURNSTILE_SECRET_KEY;
    if (secret) {
      const token = context.request.headers.get('x-turnstile-token') || '';
      const verified = await verifyTurnstileToken(token, secret, ip === 'unknown' ? undefined : ip);
      if (!verified) {
        console.warn('usas-proxy captcha rejected', { ip, path: cleanPath });
        return jsonResponse(
          { success: false, error: 'Pengesahan captcha gagal. Sila cuba lagi.' },
          403,
        );
      }
    }
  }

  const upstreamUrl = buildUpstreamUrl(context.request);
  if (!upstreamUrl) {
    return jsonResponse({ success: false, error: 'Not found.' }, 404);
  }

  // Never forward the one-time captcha token to the upstream USAS server.
  const upstreamRequest = new Request(upstreamUrl, context.request);
  upstreamRequest.headers.delete('x-turnstile-token');

  try {
    const upstreamResponse = await fetch(upstreamRequest);
    if (upstreamResponse.ok || !wantsHtml(context.request)) {
      if (upstreamResponse.status >= 500) {
        console.warn('usas-proxy upstream error', { path: cleanPath, status: upstreamResponse.status });
      }
      const response = new Response(upstreamResponse.body, upstreamResponse);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'no-referrer');
      return response;
    }

    if (upstreamResponse.status === 502 || upstreamResponse.status === 504) {
      console.warn('usas-proxy upstream gateway error', { path: cleanPath, status: upstreamResponse.status });
      return buildErrorPage(context.request, upstreamResponse.status);
    }

    if (upstreamResponse.status >= 500) {
      console.warn('usas-proxy upstream server error', { path: cleanPath, status: upstreamResponse.status });
      return buildErrorPage(context.request, 500);
    }

    return buildErrorPage(context.request, 503);
  } catch {
    console.warn('usas-proxy upstream unavailable', { path: cleanPath });
    if (wantsHtml(context.request)) {
      return buildErrorPage(context.request, 503);
    }

    return jsonResponse({ success: false, error: 'Upstream service unavailable.' }, 503);
  }
}
