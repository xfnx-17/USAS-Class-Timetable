import { test, expect } from '@playwright/test';

test('demo login opens timetable and export modal', async ({ page }) => {
  await page.goto('/');

  const brandLogo = page.getByRole('img', { name: 'USAS Emblem' });
  await expect(brandLogo).toHaveAttribute('src', '/usas-logo-dark.png');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(brandLogo).toHaveAttribute('src', '/usas-logo-light.png');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(brandLogo).toHaveAttribute('src', '/usas-logo-dark.png');

  await expect(page.getByText(/Portal Jadual Waktu Kuliah|Student Class Timetable Portal/i)).toBeVisible();
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await expect(page).toHaveURL(/\/login$/);

  await expect(page.getByRole('button', { name: /log masuk tanpa akaun|demo/i })).toBeVisible();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await expect(page).toHaveURL(/\/app$/);

  await expect(page.getByRole('button', { name: /open tools and export/i })).toBeVisible();
  await expect(page.getByText('USAS Class Timetable').first()).toBeVisible();

  await page.getByRole('button', { name: /open tools and export/i }).click();
  await expect(page.getByText(/eksport pdf & wallpaper|export pdf & wallpaper/i)).toBeVisible();

  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await expect(page.getByText(/muat turun jadual|download timetable/i)).toBeVisible();

  await expect(page.getByRole('button', { name: /^PDF$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^PNG$/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /^download$|^muat turun$/i })).toBeVisible();
});

test('png export flow downloads an image file', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();

  await page.getByRole('button', { name: /^PNG$/i }).click();
  await expect(page.getByRole('button', { name: /^PNG$/i })).toHaveAttribute('class', /bg/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^download$|^muat turun$/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename().toLowerCase()).toContain('.png');
  const stream = await download.createReadStream();
  if (!stream) throw new Error('PNG download has no stream.');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const image = Buffer.concat(chunks);
  expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(image.readUInt32BE(16)).toBeGreaterThan(500);
  expect(image.readUInt32BE(20)).toBeGreaterThan(500);
  expect(image.byteLength).toBeGreaterThan(20_000);
});

test('wallpaper export converts OKLab gradient colors for PNG rendering', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await page.getByRole('button', { name: /wallpaper lockscreen/i }).click();
  await expect(page.locator('[data-wallpaper-grid]')).toHaveCSS('border-top-left-radius', '12px');
  const gridPosition = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-export-root="wallpaper-export-root"]')!;
    const grid = document.querySelector<HTMLElement>('[data-wallpaper-grid]')!;
    const rootRect = root.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    return { x: gridRect.left - rootRect.left, y: gridRect.top - rootRect.top, rootWidth: rootRect.width };
  });

  await page.locator('[data-export-root="wallpaper-export-root"]').evaluate((root) => {
    root.style.setProperty('--tw-gradient-from', 'oklab(0.35 0.08 -0.12)');
    root.style.setProperty('--tw-gradient-to', 'oklab(0.7 0.12 0.08)');
    root.style.setProperty('--tw-gradient-stops', 'var(--tw-gradient-from), var(--tw-gradient-to)');
    root.style.backgroundImage = 'linear-gradient(90deg, var(--tw-gradient-stops))';
  });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^download$|^muat turun$/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename().toLowerCase()).toContain('lockscreen');
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Wallpaper download has no stream.');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const image = Buffer.concat(chunks);
  expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(image.readUInt32BE(16)).toBeGreaterThan(500);
  expect(image.readUInt32BE(20)).toBeGreaterThan(500);

  const [cornerPixel, backgroundPixel] = await page.evaluate(async ({ png, x, y, rootWidth }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const scale = image.naturalWidth / (rootWidth + 2);
    const sample = (sampleX: number, sampleY: number) => Array.from(context.getImageData(
      Math.round(sampleX * scale), Math.round(sampleY * scale), 1, 1,
    ).data);
    return [sample(x + 2, y + 2), sample(x + 2, y - 3)];
  }, { png: image.toString('base64'), ...gridPosition });
  expect(cornerPixel).toEqual(backgroundPixel);

  const grid = page.locator('[data-wallpaper-grid]');
  const topSlider = page.getByRole('slider', { name: 'Laraskan ruang atas jadual pada lockscreen' });
  const bottomSlider = page.getByRole('slider', { name: 'Laraskan ruang bawah jadual pada lockscreen' });
  const originalGrid = await grid.evaluate((element) => element.getBoundingClientRect().toJSON());

  await bottomSlider.focus();
  await bottomSlider.press('End');
  await expect(bottomSlider).toHaveValue('138');
  const lowerGrid = await grid.evaluate((element) => element.getBoundingClientRect().toJSON());
  expect(lowerGrid.bottom).toBeLessThan(originalGrid.bottom - 80);

  await topSlider.focus();
  await topSlider.press('Home');
  await expect(topSlider).toHaveValue('12');
  const adjustedGrid = await grid.evaluate((element) => element.getBoundingClientRect().toJSON());
  expect(adjustedGrid.top).toBeLessThan(lowerGrid.top - 80);
  expect(adjustedGrid.bottom).toBeCloseTo(lowerGrid.bottom, 0);
});

test('unknown route shows branded 404 screen', async ({ page }) => {
  await page.goto('/does-not-exist');

  await expect(page.getByText(/page not found|halaman tidak dijumpai/i)).toBeVisible();
  await expect(page.getByText(/usas class timetable/i)).toBeVisible();
});
