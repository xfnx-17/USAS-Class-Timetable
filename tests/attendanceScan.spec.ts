import { expect, test } from '@playwright/test';

test('attendance scan modal submits qr and refreshes attendance history', async ({ page }) => {
  let attendanceRequestCount = 0;

  await page.addInitScript(() => {
    const session = {
      user_id: 'AI210042',
      sid_1: 'sid-1',
      sid_2: 'sid-2',
      sid_3: 'sid-3',
      isDemo: false,
    };
    const timetable = {
      success: true,
      days: ['ISNIN'],
      timetable: [
        {
          id: '1',
          day: 'ISNIN',
          course_id: 'CSC2103',
          course_name: 'DATA STRUCTURES AND ALGORITHMS',
          group: 'GRP01',
          group_id: 'GRP01',
          start_time: '08:30 AM',
          end_time: '10:30 AM',
          location: 'DK1',
          lecturer: 'LECTURER TEST',
          kehadiran: '88%',
          catatan: 'Demo',
        },
      ],
      studentName: 'Test Student',
      program: 'Bachelor of Computer Science',
      semester: 'Semester 1',
    };

    sessionStorage.setItem('usas_student_session_cache', JSON.stringify(session));
    sessionStorage.setItem(
      'usas_login_throttle_cache',
      JSON.stringify({
        failedAttempts: 0,
        lockedUntil: 0,
        lastAttemptAt: 0,
      }),
    );
    localStorage.setItem('usas_student_timetable_cache', JSON.stringify(timetable));
  });

  await page.route('**/api/usas/student/*.php', async (route) => {
    const url = new URL(route.request().url());
    const { pathname } = url;

    if (pathname.endsWith('/login_student.php')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          server_response: [
            {
              status: 1,
              message: 'Login Successful',
              sid_1: 'sid-1',
              sid_2: 'sid-2',
              sid_3: 'sid-3',
            },
          ],
        }),
      });
      return;
    }

    if (pathname.endsWith('/get_student_profile.php')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          server_response_profil: [{ label: 'Full Name', content: 'Test Student' }],
          server_response_akademik: [{ label: 'Program', content: 'Bachelor of Computer Science' }],
        }),
      });
      return;
    }

    if (pathname.endsWith('/get_timetable_stud.php')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          server_response_day: ['ISNIN'],
          server_response: [
            {
              id: '1',
              day: 'ISNIN',
              course_id: 'CSC2103',
              course_name: 'DATA STRUCTURES AND ALGORITHMS',
              group: 'GRP01',
              group_id: 'GRP01',
              start_time: '08:30 AM',
              end_time: '10:30 AM',
              location: 'DK1',
              lecturer: 'LECTURER TEST',
              kehadiran: '88%',
              catatan: 'Demo',
            },
          ],
        }),
      });
      return;
    }

    if (pathname.endsWith('/get_kehadiran_kuliah.php')) {
      attendanceRequestCount += 1;
      const isFirstLoad = attendanceRequestCount === 1;
      const history = isFirstLoad
        ? [
            { minggu: 'Minggu 1', tarikh: '10-Oct-2024', status_hadir: 'Present', catatan: 'Before scan' },
          ]
        : [
            { minggu: 'Minggu 1', tarikh: '10-Oct-2024', status_hadir: 'Present', catatan: 'After scan' },
          ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ server_response: history }),
      });
      return;
    }

    if (pathname.endsWith('/get_scan_qr_v2.php')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          server_response: [
            {
              alert: 'QR attendance accepted.',
              status: 1,
            },
          ],
        }),
      });
      return;
    }

    await route.continue();
  });

  await page.goto('/app');

  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByText('DATA STRUCTURES AND ALGORITHMS').first()).toBeVisible();

  await page.getByRole('button', { name: /^log$/i }).first().evaluate((el) => {
    (el as HTMLButtonElement).click();
  });
  await expect.poll(() => attendanceRequestCount, { timeout: 10_000 }).toBeGreaterThanOrEqual(1);

  await page.getByRole('button', { name: /open tools and export/i }).evaluate((el) => {
    (el as HTMLButtonElement).click();
  });
  await page.getByRole('button', { name: /scan attendance qr|imbas qr kehadiran/i }).evaluate((el) => {
    (el as HTMLButtonElement).click();
  });
  await expect(page.getByTestId('attendance-scan-modal')).toBeVisible();

  await expect(page.getByRole('heading', { name: /scan attendance qr|imbas kehadiran qr/i })).toBeVisible();
  await page.getByTestId('attendance-scan-input').fill('UMC-QR-TEST-123');
  await page.getByTestId('attendance-scan-submit').click();

  await expect(page.getByText(/qr attendance accepted|diterima/i)).toBeVisible();
  await expect.poll(() => attendanceRequestCount, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
  await expect(page.getByText('After scan')).toBeVisible();
});
