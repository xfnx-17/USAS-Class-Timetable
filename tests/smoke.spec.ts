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

test('matrix view positions classes accurately to the minute', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByTitle('Paparan Grid').click();

  const firstHour = page.locator('[data-matrix-time-slot="20:00"]');
  const halfHourClass = page.locator('[data-matrix-course-code="KOM6363"][data-matrix-course-start="08:30 PM"]');
  await expect(firstHour).toBeVisible();
  await expect(halfHourClass).toHaveCount(1);
  await expect(halfHourClass).toHaveAttribute('data-matrix-course-time', '20:30-23:30');
  await expect(halfHourClass.locator('[data-matrix-course-start-label]')).toHaveText('20:30');
  await expect(halfHourClass.locator('[data-matrix-course-end-label]')).toHaveText('23:30');
  const timeLabelPositions = await halfHourClass.evaluate((block) => {
    const start = block.querySelector('[data-matrix-course-start-label]')!.getBoundingClientRect();
    const end = block.querySelector('[data-matrix-course-end-label]')!.getBoundingClientRect();
    return { startTop: start.top, endTop: end.top, rightDelta: Math.abs(start.right - end.right) };
  });
  expect(timeLabelPositions.startTop).toBeLessThan(timeLabelPositions.endTop);
  expect(timeLabelPositions.rightDelta).toBeLessThan(1);

  const geometry = await Promise.all([
    firstHour.boundingBox(),
    halfHourClass.boundingBox(),
  ]);
  const [hourBounds, classBounds] = geometry;
  expect(hourBounds).not.toBeNull();
  expect(classBounds).not.toBeNull();
  expect(classBounds!.x - hourBounds!.x).toBeGreaterThan(hourBounds!.width * 0.4);
  expect(classBounds!.x - hourBounds!.x).toBeLessThan(hourBounds!.width * 0.65);
  expect(classBounds!.width / hourBounds!.width).toBeGreaterThan(2.8);
  expect(classBounds!.width / hourBounds!.width).toBeLessThan(3.1);
});

test('wallpaper controls wrap into two columns at tablet width', async ({ page }) => {
  await page.setViewportSize({ width: 1128, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await page.getByRole('button', { name: /wallpaper lockscreen/i }).click();

  const controls = page.locator('[data-wallpaper-controls]');
  await expect(controls).toBeVisible();
  const layout = await controls.evaluate((element) => ({
    columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
    hasHorizontalOverflow: element.scrollWidth > element.clientWidth,
  }));
  expect(layout.columns).toBe(2);
  expect(layout.hasHorizontalOverflow).toBe(false);
});

test('wallpaper position controls fit inside the export toolbar on laptop', async ({ page }) => {
  await page.setViewportSize({ width: 1917, height: 865 });
  await page.goto('/');
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await page.getByRole('button', { name: /wallpaper lockscreen/i }).click();

  const controls = page.locator('[data-wallpaper-controls]');
  const layout = await controls.evaluate((element) => {
    const container = element.getBoundingClientRect();
    const position = element.lastElementChild!.getBoundingClientRect();
    const firstGroup = element.firstElementChild!.getBoundingClientRect();
    const themeHeight = element.children[2].querySelector('button')!.getBoundingClientRect().height;
    const backgroundHeight = element.children[3].querySelector('button')!.getBoundingClientRect().height;
    const selectorWidths = Array.from(element.children).slice(0, 3).map((group) =>
      group.querySelector('button')!.getBoundingClientRect().width,
    );
    const sliderWidths = Array.from(element.lastElementChild!.querySelectorAll('label'), (slider) =>
      slider.getBoundingClientRect().width,
    );
    return {
      hasHorizontalOverflow: element.scrollWidth > element.clientWidth,
      positionRight: position.right,
      containerRight: container.right,
      positionWidth: position.width,
      firstGroupWidth: firstGroup.width,
      themeHeight,
      backgroundHeight,
      selectorWidths,
      sliderWidths,
    };
  });
  expect(layout.hasHorizontalOverflow).toBe(false);
  expect(layout.positionRight).toBeLessThanOrEqual(layout.containerRight + 1);
  expect(Math.max(...layout.selectorWidths)).toBeLessThanOrEqual(231);
  expect(layout.positionWidth).toBeGreaterThan(layout.firstGroupWidth);
  expect(layout.backgroundHeight).toBe(layout.themeHeight);
  expect(Math.min(...layout.sliderWidths)).toBeGreaterThan(150);
});

test('custom lockscreen background stays sharp outside the blurred glass timetable and exports to PNG', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'filter', {
      configurable: true,
      get: () => 'none',
      set: () => {},
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await page.getByRole('button', { name: /wallpaper lockscreen/i }).click();

  await page.getByLabel(/choose background image|pilih gambar latar/i).setInputFiles('public/usas-logo-light.png');
  const background = page.locator('[data-wallpaper-background-layer]');
  const blurredBackground = page.locator('[data-wallpaper-background-blur]');
  const glassOverlay = page.locator('[data-wallpaper-glass-overlay]');
  await expect(background).toBeVisible();
  await expect(blurredBackground).toBeVisible();
  await expect(blurredBackground).toHaveAttribute('data-wallpaper-native-blur', 'true');
  await expect(glassOverlay).toBeVisible();
  await expect.poll(() => blurredBackground.evaluate((element) => getComputedStyle(element).filter))
    .toBe('blur(16px)');
  await expect.poll(() => background.getAttribute('src')).toMatch(/^blob:/);
  await expect.poll(() => blurredBackground.evaluate((element) => getComputedStyle(element).backgroundImage))
    .toMatch(/^url\("blob:/);
  expect(await background.evaluate((element) => getComputedStyle(element).backgroundImage))
    .not.toBe(await blurredBackground.evaluate((element) => getComputedStyle(element).backgroundImage));
  expect(await glassOverlay.evaluate((element) => getComputedStyle(element).backgroundColor))
    .not.toBe('rgba(0, 0, 0, 0)');
  const sourceSize = await page.evaluate(async () => {
    const response = await fetch('/usas-logo-light.png');
    const image = await createImageBitmap(await response.blob());
    const size = [image.width, image.height];
    image.close();
    return size;
  });
  const backgroundSize = await background.evaluate((element) => {
    const image = element as HTMLImageElement;
    return [image.naturalWidth, image.naturalHeight];
  });
  expect(backgroundSize).toEqual(sourceSize);
  await expect(page.getByRole('button', { name: /usas-logo-light\.png/i })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^download$|^muat turun$/i }).evaluate((button) => (button as HTMLButtonElement).click());
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('.png');
  const stream = await download.createReadStream();
  if (!stream) throw new Error('Could not read exported wallpaper.');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const png = Buffer.concat(chunks);
  expect(png.readUInt32BE(16)).toBeGreaterThan(1700);
  expect(png.readUInt32BE(20)).toBeGreaterThan(3000);
});

test('time format preference persists for the signed-in user', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();

  const timeFormatToggle = page.getByRole('button', { name: /time format 24h/i });
  await timeFormatToggle.click();
  await expect(page.getByRole('button', { name: /time format 12h/i })).toBeVisible();
  expect(await page.evaluate(() => Object.entries(localStorage)
    .filter(([key]) => key.startsWith('usas_time_format_'))
    .map(([, value]) => value))).toEqual(['12h']);

  await page.reload();
  await expect(page.getByRole('button', { name: /time format 12h/i })).toBeVisible();
  await page.getByTitle('Paparan Grid').click();
  const gridPeriods = page.locator('[data-matrix-time-slot]');
  await expect(gridPeriods.first()).toBeVisible();
  expect((await gridPeriods.allTextContents()).join(' ')).not.toMatch(/\b(AM|PM)\b/i);
  const gridCourseTimes = page.locator('[data-matrix-course-start-label], [data-matrix-course-end-label]');
  expect((await gridCourseTimes.allTextContents()).join(' ')).toMatch(/\b(AM|PM)\b/i);
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await page.getByRole('button', { name: /wallpaper lockscreen/i }).click();
  const wallpaperTimes = page.locator('[data-export-time-label], [data-export-course-time]');
  await expect(wallpaperTimes.first()).toBeVisible();
  expect((await wallpaperTimes.allTextContents()).join(' ')).not.toMatch(/\b(AM|PM)\b/i);
  const periodLabels = await page.locator('[data-export-time-label]').allTextContents();
  expect(periodLabels.some((label) => /\d\s-\s\d/.test(label))).toBe(true);
  expect(periodLabels.every((label) => !label.includes(':'))).toBe(true);
  expect(periodLabels.every((label) => !label.includes('-') || /\s-\s/.test(label))).toBe(true);
});

test('class reminder chime does not replay after a page refresh', async ({ page, context }) => {
  const nextWednesday = new Date();
  nextWednesday.setDate(nextWednesday.getDate() + ((3 - nextWednesday.getDay() + 7) % 7));
  nextWednesday.setHours(13, 50, 0, 0);
  await page.clock.install({ time: nextWednesday });
  await context.grantPermissions(['notifications']);
  await page.addInitScript(() => {
    localStorage.setItem('usas_auto_notify', 'true');
    localStorage.setItem('usas_notifications_enabled', 'true');
    (window as Window & { __classChimes?: number }).__classChimes = Number(sessionStorage.getItem('__classChimes') || 0);
    const createOscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const count = ((window as Window & { __classChimes?: number }).__classChimes || 0) + 1;
      (window as Window & { __classChimes?: number }).__classChimes = count;
      sessionStorage.setItem('__classChimes', String(count));
      return createOscillator.call(this);
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect.poll(() => page.evaluate(() => (window as Window & { __classChimes?: number }).__classChimes || 0)).toBeGreaterThan(0);
  const chimesBeforeRefresh = await page.evaluate(() => (window as Window & { __classChimes?: number }).__classChimes || 0);

  await page.reload();
  await expect(page).toHaveURL(/\/app$/);
  await expect.poll(() => page.evaluate(() => (window as Window & { __classChimes?: number }).__classChimes || 0)).toBe(chimesBeforeRefresh);
});

test('png export flow downloads an image file', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await expect(page.locator('[data-export-formal-day-cell]').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');

  await page.getByRole('button', { name: /^PNG$/i }).click();
  await expect(page.getByRole('button', { name: /^PNG$/i })).toHaveAttribute('class', /bg/);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^download$|^muat turun$/i }).click();
  const progress = page.locator('[data-export-progress-value]');
  await expect.poll(async () => Number((await progress.textContent())?.replace('%', '') || 0))
    .toBeGreaterThan(15);
  const download = await downloadPromise;

  expect(download.suggestedFilename().toLowerCase()).toContain('.png');
  const stream = await download.createReadStream();
  if (!stream) throw new Error('PNG download has no stream.');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const image = Buffer.concat(chunks);
  expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(image.readUInt32BE(16)).toBeGreaterThan(1000);
  expect(image.readUInt32BE(20)).toBeGreaterThan(1900);
  expect(image.byteLength).toBeGreaterThan(20_000);
});

test('formal PDF export downloads a valid one-page file', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  const formalBorders = await page.locator('table.border-separate').evaluate((table) => {
    const cells = [...table.querySelectorAll('th, td')];
    return {
      collapsed: getComputedStyle(table).borderCollapse,
      widths: [...new Set(cells.flatMap((cell) => {
        const style = getComputedStyle(cell);
        return [style.borderRightWidth, style.borderBottomWidth];
      }))],
    };
  });
  expect(formalBorders.collapsed).toBe('separate');
  expect(formalBorders.widths).toEqual(['1px']);
  const formalRowShading = await page.locator('table.border-separate tbody tr').evaluateAll((rows) => rows.map((row) => ({
    rowBackground: getComputedStyle(row).backgroundColor,
    cells: [...row.querySelectorAll('td')].map((cell) => getComputedStyle(cell).backgroundColor),
  })));
  expect(formalRowShading.every(({ rowBackground }) => rowBackground === 'rgba(0, 0, 0, 0)')).toBe(true);
  expect(formalRowShading[0].cells[0]).toBe('rgb(255, 255, 255)');
  expect(formalRowShading.slice(0, 4).every(({ cells }) => cells.every((color) => color !== 'rgba(0, 0, 0, 0)'))).toBe(true);

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /^download$|^muat turun$/i }).click();
  const progress = page.locator('[data-export-progress-value]');
  await expect.poll(async () => Number((await progress.textContent())?.replace('%', '') || 0))
    .toBeGreaterThan(15);
  const download = await downloadPromise;
  expect(download.suggestedFilename().toLowerCase()).toContain('.pdf');
  const stream = await download.createReadStream();
  if (!stream) throw new Error('PDF download has no stream.');
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Buffer.concat(chunks).subarray(0, 5).toString()).toBe('%PDF-');
});

test('wallpaper export converts OKLab gradient colors for PNG rendering', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'userAgent', {
      configurable: true,
      value: 'Mozilla/5.0 (Linux; Android 13; Mi 11 Lite) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
  });
  await page.goto('/');

  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await page.getByRole('button', { name: /wallpaper lockscreen/i }).click();
  await expect(page.locator('[data-wallpaper-grid]')).toHaveCSS('border-top-left-radius', '12px');
  const courseColors = await page.locator('[data-export-course-color-code]').evaluateAll((blocks) => blocks.map((block) => ({
    course: block.getAttribute('data-export-course-color-code')!,
    color: getComputedStyle(block).backgroundColor,
  })));
  const courseColorSets = new Map<string, Set<string>>();
  for (const { course, color } of courseColors) {
    const colors = courseColorSets.get(course) ?? new Set<string>();
    colors.add(color);
    courseColorSets.set(course, colors);
  }
  expect(courseColorSets.size, JSON.stringify([...courseColorSets.keys()])).toBe(5);
  expect([...courseColorSets.values()].every((colors) => colors.size === 1)).toBe(true);
  expect(new Set([...courseColorSets.values()].map((colors) => [...colors][0])).size).toBe(courseColorSets.size);
  const headerColumns = await page.locator('[data-export-time-label]').evaluateAll((labels) => labels.map((label) => {
    const header = label.closest('th')!;
    return {
      label: label.textContent,
      width: header.getBoundingClientRect().width,
      duration: Number(header.getAttribute('data-export-time-duration')),
      availableWidth: label.parentElement!.clientWidth,
      labelWidth: label.scrollWidth,
    };
  }));
  expect(headerColumns.length).toBeGreaterThan(0);
  expect(headerColumns.length).toBe(7);
  expect(headerColumns.reduce((total, { duration }) => total + duration, 0)).toBe(10 * 60);
  expect(headerColumns.some(({ duration }) => duration < 120)).toBe(true);
  expect(headerColumns.at(-1)?.label).toContain('24');
  const headerWidths = headerColumns.map(({ width }) => width);
  expect(Math.max(...headerWidths) - Math.min(...headerWidths)).toBeLessThan(1);
  expect(headerColumns.every(({ availableWidth, labelWidth }) => availableWidth >= labelWidth), JSON.stringify(headerColumns)).toBe(true);
  const gridPosition = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>('[data-export-root="wallpaper-export-root"]')!;
    const grid = document.querySelector<HTMLElement>('[data-wallpaper-grid]')!;
    const rootRect = root.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    return { x: gridRect.left - rootRect.left, y: gridRect.top - rootRect.top, rootWidth: rootRect.width };
  });

  await page.locator('[data-export-root="wallpaper-export-root"]').evaluate((root) => {
    const testStyle = document.createElement('style');
    testStyle.textContent = '.unrelated-color-class { color: oklch(0.6 0.15 200); }';
    document.head.appendChild(testStyle);
    const testColor = document.createElement('span');
    testColor.className = 'unrelated-color-class';
    testColor.textContent = 'color check';
    root.appendChild(testColor);

    root.style.setProperty('--tw-gradient-from', 'oklab(0.35 0.08 -0.12)');
    root.style.setProperty('--tw-gradient-to', 'oklab(0.7 0.12 0.08)');
    root.style.setProperty('--tw-gradient-stops', 'var(--tw-gradient-from), var(--tw-gradient-to)');
    root.style.backgroundImage = 'linear-gradient(90deg, var(--tw-gradient-stops))';
  });
  const previewPng = await page.locator('[data-export-root="wallpaper-export-root"]').screenshot();
  const textBounds = await page.locator('[data-export-root="wallpaper-export-root"]').evaluate((root) => {
    const rootRect = root.getBoundingClientRect();
    const bounds = (selector: string) => {
      const rect = root.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return { x: rect.left - rootRect.left, y: rect.top - rootRect.top, width: rect.width, height: rect.height };
    };
    const contents = [...root.querySelectorAll<HTMLElement>('[data-export-course-content]')];
    const content = contents[0];
    const blockRect = content.parentElement!.getBoundingClientRect();
    const centerDeltaRatios = contents.map((courseContent) => {
      const courseBlock = courseContent.parentElement!.getBoundingClientRect();
      const centerItems = ['[data-export-course-duration]', '[data-export-course-code]', '[data-export-course-location]']
        .map((selector) => courseContent.querySelector<HTMLElement>(selector)?.getBoundingClientRect())
        .filter((rect): rect is DOMRect => Boolean(rect));
      const groupTop = Math.min(...centerItems.map((rect) => rect.top));
      const groupBottom = Math.max(...centerItems.map((rect) => rect.bottom));
      return Math.abs((groupTop + groupBottom) / 2 - (courseBlock.top + courseBlock.height / 2)) / courseBlock.height;
    });
    return {
      rootWidth: (root as HTMLElement).offsetWidth,
      rootHeight: (root as HTMLElement).offsetHeight,
      previewWidth: rootRect.width,
      previewHeight: rootRect.height,
      time: bounds('[data-export-time-label]'),
      block: { x: blockRect.left - rootRect.left, y: blockRect.top - rootRect.top, width: blockRect.width, height: blockRect.height },
      maxCenterDeltaRatio: Math.max(...centerDeltaRatios),
      start: bounds('[data-export-course-time="start"]'),
      end: bounds('[data-export-course-time="end"]'),
      duration: bounds('[data-export-course-duration]'),
      course: bounds('[data-export-course-code]'),
    };
  });
  expect(textBounds.start.x).toBeGreaterThan(textBounds.block.x + 1);
  expect(textBounds.start.y).toBeGreaterThan(textBounds.block.y + 1);
  expect(textBounds.end.x + textBounds.end.width).toBeLessThan(textBounds.block.x + textBounds.block.width);
  expect(textBounds.end.y + textBounds.end.height).toBeLessThan(textBounds.block.y + textBounds.block.height);
  expect(textBounds.duration.y + textBounds.duration.height).toBeLessThanOrEqual(textBounds.course.y);
  expect(textBounds.maxCenterDeltaRatio).toBeLessThan(0.2);
  await expect(page.locator('[data-export-course-time="start"]').first()).toBeVisible();
  await expect(page.locator('[data-export-course-time="end"]').first()).toBeVisible();
  await expect(page.locator('[data-export-course-duration]').first()).toBeVisible();
  await page.locator('[role="status"]').evaluateAll((elements) => elements.forEach((element) => {
    (element as HTMLElement).style.pointerEvents = 'none';
  }));

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

  const alignment = await page.evaluate(async ({ png, preview, bounds }) => {
    const loadImage = async (source: string) => {
      const image = new Image();
      image.src = `data:image/png;base64,${source}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d', { willReadFrequently: true })!;
      context.drawImage(image, 0, 0);
      return { canvas, context };
    };
    const [previewImage, exportImage] = await Promise.all([loadImage(preview), loadImage(png)]);
    const centerY = (context: CanvasRenderingContext2D, box: { x: number; y: number; width: number; height: number }, sx: number, sy: number) => {
      const x = Math.max(0, Math.floor(box.x * sx));
      const y = Math.max(0, Math.floor(box.y * sy));
      const width = Math.min(context.canvas.width - x, Math.ceil(box.width * sx));
      const height = Math.min(context.canvas.height - y, Math.ceil(box.height * sy));
      const pixels = context.getImageData(x, y, width, height).data;
      const pixelView = new DataView(pixels.buffer, pixels.byteOffset, pixels.byteLength);
      let total = 0;
      let weightedY = 0;
      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const offset = (row * width + col) * 4;
          const red = pixelView.getUint8(offset);
          const green = pixelView.getUint8(offset + 1);
          const blue = pixelView.getUint8(offset + 2);
          if (Math.min(red, green, blue) < 150 || Math.max(red, green, blue) - Math.min(red, green, blue) > 80) continue;
          total++;
          weightedY += row / sy;
        }
      }
      if (!total) throw new Error('Could not locate wallpaper text in rendered image.');
      return weightedY / total;
    };
    const previewScaleX = previewImage.canvas.width / bounds.previewWidth;
    const previewScaleY = previewImage.canvas.height / bounds.previewHeight;
    const exportScaleX = exportImage.canvas.width / (bounds.rootWidth + 2);
    const exportScaleY = exportImage.canvas.height / (bounds.rootHeight + 2);
    return ['time', 'course', 'start', 'end'].map((key) => {
      const box = bounds[key as 'time' | 'course' | 'start' | 'end'];
      const previewCenter = centerY(previewImage.context, box, previewScaleX, previewScaleY);
      const exportCenter = centerY(exportImage.context, box, exportScaleX, exportScaleY);
      return { key, delta: exportCenter - previewCenter };
    });
  }, { png: image.toString('base64'), preview: previewPng.toString('base64'), bounds: textBounds });
  for (const item of alignment) expect(Math.abs(item.delta), `${item.key} vertical alignment: ${item.delta.toFixed(2)}px`).toBeLessThanOrEqual(2.5);

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
  const topSlider = page.getByRole('slider', { name: /adjust timetable top space|laraskan ruang atas/i });
  const bottomSlider = page.getByRole('slider', { name: /adjust timetable bottom space|laraskan ruang bawah/i });
  const getGridPosition = () => grid.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const rootRect = element.closest('[data-export-root]')!.getBoundingClientRect();
    return { top: rect.top - rootRect.top, bottom: rect.bottom - rootRect.top };
  });
  const originalGrid = await getGridPosition();

  await bottomSlider.focus();
  await bottomSlider.press('End');
  await expect(bottomSlider).toHaveValue('138');
  const lowerGrid = await getGridPosition();
  expect(lowerGrid.bottom).toBeLessThan(originalGrid.bottom - 80);

  await topSlider.focus();
  await topSlider.press('Home');
  await expect(topSlider).toHaveValue('12');
  const adjustedGrid = await getGridPosition();
  expect(adjustedGrid.top).toBeLessThan(lowerGrid.top - 80);
  expect(adjustedGrid.bottom).toBeCloseTo(lowerGrid.bottom, 0);
});

test('wallpaper class blocks stay centered at maximum position', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: /log in|log masuk/i }).first().click();
  await page.getByRole('button', { name: /log masuk tanpa akaun|demo/i }).click();
  await page.getByRole('button', { name: /open tools and export/i }).click();
  await page.getByRole('button', { name: /eksport pdf & wallpaper|export pdf & wallpaper/i }).click();
  await page.getByRole('button', { name: /wallpaper lockscreen/i }).click();
  await page.getByRole('slider', { name: /adjust timetable top space|laraskan ruang atas/i }).press('End');
  await page.getByRole('slider', { name: /adjust timetable bottom space|laraskan ruang bawah/i }).press('End');
  await expect(page.getByRole('slider', { name: /adjust timetable top space|laraskan ruang atas/i })).toHaveValue('216');
  await expect(page.getByRole('slider', { name: /adjust timetable bottom space|laraskan ruang bawah/i })).toHaveValue('138');
  const layout = await page.locator('[data-wallpaper-grid]').evaluate((grid) => {
    const rows = [...grid.querySelectorAll('tbody tr')].map((row) => row.getBoundingClientRect().height);
    const lastRow = grid.querySelector('tbody tr:last-child')!.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const contents = [...grid.querySelectorAll<HTMLElement>('[data-export-course-content]')];
    const blockHeights = contents.map((content) => content.parentElement!.getBoundingClientRect().height);
    const blockRowHeightDeltas = contents.map((content) => {
      const block = content.parentElement!;
      const row = block.parentElement!.parentElement!;
      return Math.abs(block.getBoundingClientRect().height - row.getBoundingClientRect().height);
    });
    const blockSeamInsets = contents.map((content) => {
      const block = content.parentElement!.getBoundingClientRect();
      const row = content.parentElement!.parentElement!.parentElement!.getBoundingClientRect();
      return { top: block.top - row.top, bottom: row.bottom - block.bottom };
    });
    const centerDeltaRatios = contents.map((content) => {
      const block = content.parentElement!.getBoundingClientRect();
      const items = ['[data-export-course-duration]', '[data-export-course-code]', '[data-export-course-location]']
        .map((selector) => content.querySelector<HTMLElement>(selector)?.getBoundingClientRect())
        .filter((rect): rect is DOMRect => Boolean(rect));
      const top = Math.min(...items.map((rect) => rect.top));
      const bottom = Math.max(...items.map((rect) => rect.bottom));
      return Math.abs((top + bottom) / 2 - (block.top + block.height / 2)) / block.height;
    });
    const endInsets = contents.map((content) => {
      const block = content.parentElement!.getBoundingClientRect();
      const end = content.querySelector<HTMLElement>('[data-export-course-time="end"]')!;
      return block.bottom - end.getBoundingClientRect().bottom;
    });
    return {
      rows,
      lastRowBottomOverflow: lastRow.bottom - gridRect.bottom,
      blockHeights,
      blockRowHeightDeltas,
      blockSeamInsets,
      centerDeltaRatios,
      minEndInset: Math.min(...endInsets),
      maxEndInset: Math.max(...endInsets),
    };
  });

  expect(Math.max(...layout.rows) - Math.min(...layout.rows)).toBeLessThan(1);
  expect(layout.lastRowBottomOverflow).toBeLessThanOrEqual(1);
  expect(Math.max(...layout.blockHeights) - Math.min(...layout.blockHeights)).toBeLessThan(1);
  expect(Math.max(...layout.blockRowHeightDeltas)).toBeLessThanOrEqual(1);
  expect(Math.max(...layout.blockSeamInsets.map(({ top }) => top))).toBeLessThanOrEqual(0.6);
  expect(Math.max(...layout.blockSeamInsets.map(({ bottom }) => bottom))).toBeLessThanOrEqual(0.6);
  expect(Math.max(...layout.centerDeltaRatios)).toBeLessThan(0.2);
  expect(layout.minEndInset).toBeGreaterThan(0);
  expect(layout.maxEndInset).toBeLessThan(3);
});

test('unknown route shows branded 404 screen', async ({ page }) => {
  await page.goto('/does-not-exist');

  await expect(page.getByText(/page not found|halaman tidak dijumpai/i)).toBeVisible();
  await expect(page.getByText(/usas class timetable/i)).toBeVisible();
});
