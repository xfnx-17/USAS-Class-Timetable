import { getUsasProxyPath, isAllowedUsasMethod } from '../../../src/shared/lib/usasProxy';

const API_ORIGIN = 'https://mobile.usas.edu.my/umc_v2';
const LOGIN_PATH = '/student/login_student.php';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function buildUpstreamUrl(request: Request): string | null {
  const url = new URL(request.url);
  const cleanPath = getUsasProxyPath(url.pathname);
  if (!cleanPath) return null;
  return `${API_ORIGIN}${cleanPath}${url.search}`;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
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

export async function onRequest(context: any) {
  if (!isAllowedUsasMethod(context.request.method)) {
    return jsonResponse({ success: false, error: 'Method not allowed.' }, 405);
  }

  const url = new URL(context.request.url);
  const cleanPath = getUsasProxyPath(url.pathname);
  if (!cleanPath) {
    return jsonResponse({ success: false, error: 'Not found.' }, 404);
  }

  // Verify the Cloudflare Turnstile token on login before proxying upstream.
  // Skipped only when the secret is not configured (e.g. local dev).
  if (cleanPath === LOGIN_PATH) {
    const secret = context.env?.TURNSTILE_SECRET_KEY;
    if (secret) {
      const token = context.request.headers.get('x-turnstile-token') || '';
      const ip = context.request.headers.get('cf-connecting-ip') || undefined;
      const verified = await verifyTurnstileToken(token, secret, ip);
      if (!verified) {
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
      const response = new Response(upstreamResponse.body, upstreamResponse);
      response.headers.set('Cache-Control', 'no-store');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Referrer-Policy', 'no-referrer');
      return response;
    }

    if (upstreamResponse.status === 502 || upstreamResponse.status === 504) {
      return buildErrorPage(context.request, upstreamResponse.status);
    }

    if (upstreamResponse.status >= 500) {
      return buildErrorPage(context.request, 500);
    }

    return buildErrorPage(context.request, 503);
  } catch {
    if (wantsHtml(context.request)) {
      return buildErrorPage(context.request, 503);
    }

    return jsonResponse({ success: false, error: 'Upstream service unavailable.' }, 503);
  }
}
