// Monitors the official USAS UMC API response shape so schema changes or
// outages are detected before they break the client.
//
// Always validates the login endpoint (works with a dummy matric number).
// When USAS_MONITOR_USER / USAS_MONITOR_PASS are provided (repository secrets),
// it additionally logs in and validates the timetable and course-list schemas.

const API_ORIGIN = 'https://mobile.usas.edu.my/umc_v2';
const UMC_VERSION = '2.0.3';

function fail(message) {
  console.error(`SCHEMA CHECK FAILED: ${message}`);
  process.exit(1);
}

async function post(path, body) {
  let res;
  try {
    res = await fetch(`${API_ORIGIN}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    fail(`${path}: request error (${err.message})`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    fail(`${path}: response is not JSON (status ${res.status})`);
  }
}

function expectArray(value, label) {
  if (!Array.isArray(value)) fail(`${label}: expected an array, got ${typeof value}`);
}

const user = process.env.USAS_MONITOR_USER;
const pass = process.env.USAS_MONITOR_PASS;

// 1. Login endpoint shape (dummy credentials still return a server_response array).
const login = await post('/student/login_student.php', {
  request_type: 'login',
  user_id: user || 'SCHEMA-CHECK',
  password: pass || 'schema-check',
  umc_version: UMC_VERSION,
  platform: 'Android',
});

if (!login || typeof login !== 'object') fail('login: response is not an object');
expectArray(login.server_response, 'login.server_response');
const session = login.server_response[0];
if (!session || !('status' in session)) fail('login.server_response[0].status is missing');
console.log('login schema OK');

const authenticated = (session.status === 1 || session.status === '1') && user && pass;

if (!authenticated) {
  console.log('Authenticated schema checks skipped (no USAS_MONITOR_USER/PASS secret set).');
  console.log('SCHEMA CHECK OK');
  process.exit(0);
}

const base = {
  apiKey: '123',
  user_id: user,
  token: 'dummytoken',
  sid_1: session.sid_1,
  sid_2: session.sid_2,
  sid_3: session.sid_3,
  umc_platform: 'Android',
  umc_version: UMC_VERSION,
};

// 2. Timetable schema.
const timetable = await post('/student/get_timetable_stud.php', {
  ...base,
  request_type: 'jadual_kuliah',
});
expectArray(timetable.server_response, 'timetable.server_response');
if (timetable.server_response.length > 0) {
  const sample = timetable.server_response.slice(0, 3);
  if (sample.some((row) => !row || typeof row !== 'object')) fail('timetable rows are not objects');
  const knownKeys = ['day', 'start_time', 'end_time', 'course_id', 'course_name', 'lecturer'];
  const missing = knownKeys.filter((key) => !sample.some((row) => key in row));
  if (missing.length) fail(`timetable rows missing expected keys: ${missing.join(', ')}`);
}

// 3. Enrolled course list schema.
const courses = await post('/student/get_kehadiran_kuliah.php', {
  ...base,
  request_type: 'senarai_kursus',
});
expectArray(courses.server_response, 'senarai_kursus.server_response');
if (courses.server_response.length > 0) {
  const sample = courses.server_response.slice(0, 3);
  if (sample.some((row) => !row || typeof row !== 'object')) fail('senarai_kursus rows are not objects');
  const knownKeys = ['kod_kursus', 'kursus', 'pensyarah', 'group_id'];
  const missing = knownKeys.filter((key) => !sample.some((row) => key in row));
  if (missing.length) fail(`senarai_kursus rows missing expected keys: ${missing.join(', ')}`);
}

console.log('timetable + course list schemas OK');
console.log('SCHEMA CHECK OK');
