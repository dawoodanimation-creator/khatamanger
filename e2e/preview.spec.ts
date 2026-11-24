import { test, expect, type Page } from '@playwright/test';
import en from '../src/i18n/en.json' with { type: 'json' };
import ur from '../src/i18n/ur.json' with { type: 'json' };
import { demoRecords } from '../src/utils/demo';

const originKey = 'khata-preview.ledger.v1';
const configurations = [
  { width: 360, height: 800, language: 'en', darkMode: false },
  { width: 360, height: 800, language: 'ur', darkMode: true },
  { width: 390, height: 844, language: 'en', darkMode: false },
  { width: 390, height: 844, language: 'ur', darkMode: true },
  { width: 390, height: 844, language: 'en', darkMode: true },
  { width: 390, height: 844, language: 'ur', darkMode: false },
  { width: 430, height: 932, language: 'en', darkMode: false },
  { width: 430, height: 932, language: 'ur', darkMode: true },
  { width: 1280, height: 1100, language: 'en', darkMode: false },
  { width: 1280, height: 1100, language: 'ur', darkMode: true },
] as const;
async function noOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    window: document.documentElement.clientWidth, document: document.documentElement.scrollWidth,
    main: document.querySelector('main')!.clientWidth, content: document.querySelector('main')!.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.window + 1);
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.main + 1);
}
for (const config of configurations) {
  test.describe(`${config.width}px ${config.language} ${config.darkMode ? 'dark' : 'light'}`, () => {
    test.use({ viewport: { width: config.width, height: config.height }, reducedMotion: 'reduce' });
    test('every screen fits; fonts, controls and theme remain usable', async ({ page }) => {
      const strings = config.language === 'ur' ? ur : en;
      const failures: string[] = [];
      page.on('pageerror', error => failures.push(error.message));
      const records = demoRecords(key => strings[key]);
      records.customers[0].name = config.language === 'ur' ? 'محمد علی خان '.repeat(7).trim() : 'Ali Khan ' + 'A'.repeat(80);
      records.customers[0].note = config.language === 'ur' ? 'یہ ایک نوٹ ہے۔ '.repeat(25) : 'A long note for mobile wrapping. '.repeat(15);
      records.transactions[0].amountPaisa = 999999999999;
      await page.addInitScript(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), {
        key: originKey, data: { schemaVersion: 1, exportedAt: new Date().toISOString(), ...records, settings: { language: config.language, darkMode: config.darkMode } },
      });
      for (const route of ['/', '/customers/demo-ali', '/customers/demo-ali/edit', '/customers/demo-ali/credit', '/customers/demo-ali/payment', '/customers/new', '/settings', '/settings/backup']) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('html')).toHaveAttribute('dir', config.language === 'ur' ? 'rtl' : 'ltr');
        await expect(page.locator('html')).toHaveAttribute('data-theme', config.darkMode ? 'dark' : 'light');
        await noOverflow(page);
        for (const control of await page.locator('.button, .icon-button, .toggle, .language-switch button').all()) {
          if (await control.isVisible()) expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(48);
        }
        if (route === '/customers/new') {
          const font = await page.locator('#customer-name').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
          expect(font).toBeGreaterThanOrEqual(16);
        }
      }
      await page.goto('/customers/demo-ali');
      await expect(page.getByRole('region', { name: strings.remind, exact: true })).toBeVisible();
      await page.getByRole('button', { name: strings.more, exact: true }).click();
      await page.getByRole('button', { name: strings.delete, exact: true }).click();
      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      expect(await modal.evaluate(node => node.scrollWidth)).toBeLessThanOrEqual(await modal.evaluate(node => node.clientWidth));
      await expect(modal.getByRole('button', { name: strings.cancel, exact: true })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
      await expect(page.getByRole('button', { name: strings.more, exact: true })).toBeFocused();
      expect(failures).toEqual([]);
    });
  });
}

test.describe('mobile feature handoff', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  test('real create, credit/payment, download, reset, restore and refresh', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: en.addCustomer, exact: true }).click();
    await page.getByRole('button', { name: en.save, exact: true }).click();
    await expect(page.getByLabel(en.name, { exact: true })).toBeFocused();
    await page.getByLabel(en.name, { exact: true }).fill('Ali Khan');
    await page.getByLabel(en.phone, { exact: true }).fill('03001234567');
    await page.getByRole('button', { name: en.save, exact: true }).click();
    await page.getByRole('link', { name: /Ali Khan/ }).click();
    await page.getByRole('link', { name: en.credit, exact: true }).click();
    await page.getByLabel(en.amount, { exact: true }).fill('۱۲۳.۴۵');
    await page.getByRole('button', { name: en.saveCredit, exact: true }).click();
    await page.getByRole('link', { name: en.payment, exact: true }).click();
    await page.getByLabel(en.amount, { exact: true }).fill('23.45');
    await page.getByRole('button', { name: en.savePayment, exact: true }).click();
    await expect(page.locator('.customer-summary')).toContainText('Rs 100.00');
    const whatsapp = page.getByRole('link', { name: en.whatsapp, exact: true });
    await expect(whatsapp).toHaveAttribute('href', /wa.me\/923001234567/);
    await page.goto('/settings/backup');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: en.export, exact: true }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    let source = ''; for await (const chunk of stream) source += chunk.toString();
    const backup = JSON.parse(source);
    expect(backup.transactions).toHaveLength(2);
    expect(backup.transactions[0].amountPaisa).toBe(12345);
    await page.goto('/settings');
    await page.getByRole('button', { name: en.resetData, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: en.resetData, exact: true }).click();
    await page.goto('/settings/backup');
    await page.getByLabel(en.import, { exact: true }).setInputFiles({ name: 'khata.json', mimeType: 'application/json', buffer: Buffer.from(source) });
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: en.restore, exact: true }).click();
    await expect(page.getByText(en.imported, { exact: true })).toBeVisible();
    await page.goto('/'); await page.reload();
    await expect(page.getByRole('link', { name: /Ali Khan/ })).toBeVisible();
    await expect(page.locator('.outstanding-card')).toContainText('Rs 100.00');
  });
  test('browser zoom and screenshots for handoff', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: en.loadDemo, exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: en.loadDemo, exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('.customer-card')).toHaveCount(3);
    await page.screenshot({ path: 'docs/screenshots/mobile-home-en-light.png', fullPage: true, animations: 'disabled' });
    await page.getByRole('link', { name: /Ali Khan/ }).click();
    await expect(page.locator('.transaction-card')).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/screenshots/mobile-detail-en-light.png', fullPage: true, animations: 'disabled' });
    await page.goto('/settings');
    await page.getByRole('button', { name: en.urdu, exact: true }).click();
    await page.getByRole('switch').click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/screenshots/mobile-settings-ur-dark.png', fullPage: true, animations: 'disabled' });
    await page.goto('/');
    await expect(page.locator('.customer-card')).toHaveCount(3);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/screenshots/mobile-home-ur-dark.png', fullPage: true, animations: 'disabled' });
    await page.addStyleTag({ content: 'html { zoom: 1.25; }' });
    await noOverflow(page);
    await page.goto('/customers/new');
    await page.addStyleTag({ content: 'html { zoom: 1.25; }' });
    await noOverflow(page);
    await page.setViewportSize({ width: 1280, height: 1200 });
    await page.goto('/');
    await expect(page.locator('.customer-card')).toHaveCount(3);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'docs/screenshots/desktop-home-ur-dark.png', fullPage: true, animations: 'disabled' });
  });
});
