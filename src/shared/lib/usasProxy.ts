const ALLOWED_USAS_ENDPOINTS = new Set([
  '/student/login_student.php',
  '/student/get_student_profile.php',
  '/student/get_timetable_stud.php',
  '/student/get_kehadiran_kuliah.php',
  '/student/get_scan_qr_v2.php',
  '/student/get_directory_staff_v2.php',
]);

export function getUsasProxyPath(pathname: string): string | null {
  if (!pathname.startsWith('/api/usas')) return null;

  const upstreamPath = pathname.replace(/^\/api\/usas/, '') || '/';
  const cleanPath = upstreamPath.startsWith('/') ? upstreamPath : `/${upstreamPath}`;

  return ALLOWED_USAS_ENDPOINTS.has(cleanPath) ? cleanPath : null;
}

export function isAllowedUsasMethod(method: string): boolean {
  return method.toUpperCase() === 'POST';
}
