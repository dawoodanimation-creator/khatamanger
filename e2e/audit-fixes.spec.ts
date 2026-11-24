import { test, expect, type Page } from '@playwright/test';
import en from '../src/i18n/en.json' with { type: 'json' };
const key = 'khata-preview.ledger.v1';
const ali = { id: 'new', name: 'Ali Khan', phone: '+92 (300) 123-4567', note: '' };
function fixture() { return { schemaVersion: 1, exportedAt: '2020-01-01T00:00:00.000Z', customers: [ali], transactions: [{ id: 'first', customerId: 'new', kind: 'credit', amountPaisa: 10000, note: '', date: '2020-01-01T00:00:00.000', createdAt: '2020-01-01T00:00:00.000Z' }], settings: { language: 'en', darkMode: false } }; }
async function seed(page: Page) { await page.goto('/'); await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key, data: fixture() }); }
async function stored(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key); }
async function credit(page: Page, amount: string) { await page.goto('/customer/new/credit'); await page.getByLabel(en.amount, { exact: true }).fill(amount); }
test.use({ viewport: { width: 360, height: 640 }, reducedMotion: 'reduce' });
test('A-01 concurrent tab additions preserve both entries; settings patch preserves other tab changes', async ({ page, context }) => {
  await seed(page); const other = await context.newPage();
  await credit(page, '10'); await credit(other, '20');
  await Promise.all([page.getByRole('button', { name: en.saveCredit, exact: true }).click(), other.getByRole('button', { name: en.saveCredit, exact: true }).click()]);
  await expect.poll(async () => (await stored(page)).transactions.length).toBeGreaterThanOrEqual(2);
  // A concurrent balance change must not commit a result different from the inline review.
  for (const tab of [page, other]) {
    if (await tab.locator('#transaction-amount').count()) {
      await expect(tab.locator('form')).toContainText(en.conflictError);
      await tab.getByRole('button', { name: en.saveCredit, exact: true }).click();
    }
  }
  await expect.poll(async () => (await stored(page)).transactions.length).toBe(3);
  expect((await stored(page)).transactions.map((t: { amountPaisa: number }) => t.amountPaisa).sort((a: number, b: number) => a - b)).toEqual([1000, 2000, 10000]);
  await page.goto('/settings'); await other.goto('/settings');
  await Promise.all([page.getByRole('button', { name: en.urdu, exact: true }).click(), other.getByRole('switch').click()]);
  await expect.poll(async () => (await stored(page)).settings).toEqual({ language: 'ur', darkMode: true });
});
test('A-01 stale delete and stale restore refuse replacement, preserving newer credit', async ({ page, context }) => {
  await seed(page); const other = await context.newPage();
  await page.goto('/customer/new'); await page.getByRole('button', { name: en.more, exact: true }).click(); await page.getByRole('button', { name: en.delete, exact: true }).click();
  await credit(other, '10'); await other.getByRole('button', { name: en.saveCredit, exact: true }).click();
  await expect.poll(async () => (await stored(other)).transactions.length).toBe(2);
  await page.getByRole('dialog').getByRole('button', { name: en.delete, exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(en.conflictError); expect((await stored(page)).transactions).toHaveLength(2);
  await page.keyboard.press('Escape'); await page.goto('/settings/backup');
  await page.getByLabel(en.import, { exact: true }).setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture())) });
  await expect(page.getByRole('dialog')).toBeVisible();
  await credit(other, '20'); await other.getByRole('button', { name: en.saveCredit, exact: true }).click();
  await expect.poll(async () => (await stored(other)).transactions.length).toBe(3);
  await page.getByRole('dialog').getByRole('button', { name: en.restore, exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText(en.conflictError); expect((await stored(page)).transactions).toHaveLength(3);
});
test('A-01 sequential writeQueue fallback succeeds when navigator.locks unavailable; quota failure fails closed', async ({ page }) => {
  await seed(page); await credit(page, '15');
  await page.evaluate(() => Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }));
  await page.getByRole('button', { name: en.saveCredit, exact: true }).click();
  await expect.poll(async () => (await stored(page)).transactions.length).toBe(2);
  await credit(page, '25');
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); }; });
  await page.getByRole('button', { name: en.saveCredit, exact: true }).click();
  await expect(page.locator('form')).toContainText(en.storageError);
});
test('A-02 corrupt startup reaches validated recovery, rejects bad file and quarantines original on confirmation', async ({ page }) => {
  await page.goto('/'); await page.evaluate(key => localStorage.setItem(key, '{broken json'), key); await page.reload();
  await page.getByRole('link', { name: en.import, exact: true }).click();
  const picker = page.getByLabel(en.import, { exact: true });
  await picker.setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('bad') });
  await expect(page.getByText(en.badBackup)).toBeVisible(); expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{broken json');
  await picker.setInputFiles({ name: 'good.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture())) });
  await page.getByRole('dialog').getByRole('button', { name: en.cancel, exact: true }).click();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{broken json');
  await picker.setInputFiles({ name: 'good.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(fixture())) });
  await page.getByRole('dialog').getByRole('button', { name: en.restore, exact: true }).click();
  await expect(page.getByText(en.imported, { exact: true })).toBeVisible(); expect((await stored(page)).customers).toEqual([ali]);
  expect(await page.evaluate(key => Object.keys(localStorage).filter(k => k.startsWith(key + '.corrupt.')).map(k => localStorage.getItem(k)), key)).toEqual(['{broken json']);
});
test('A-05/06/08/09/10/11/14 canonical reserved ID, normalized search, identity, exact preview and duplicate review', async ({ page }) => {
  await seed(page); await page.goto('/'); await page.getByRole('searchbox').fill('۰۳۰۰۱۲۳۴۵۶۷');
  await page.getByRole('link', { name: /Ali Khan/ }).click(); await expect(page).toHaveURL(/\/customer\/new$/);
  await expect(page.locator('.customer-summary .balance svg')).toHaveCount(1);
  await page.getByRole('link', { name: en.credit, exact: true }).click(); await expect(page.getByLabel(en.amount, { exact: true })).toBeFocused();
  await expect(page.locator('.transaction-help')).toContainText(ali.phone);
  await page.getByLabel(en.amount, { exact: true }).fill('1000'); await expect(page.locator('.money-review')).toContainText('Rs 1,000.00'); await expect(page.locator('.money-review')).toContainText('Rs 1,100.00');
  await page.getByRole('button', { name: en.saveCredit, exact: true }).dblclick(); await expect.poll(async () => (await stored(page)).transactions.length).toBe(2);
  await page.goto('/customers/new'); await expect(page.getByLabel(en.name, { exact: true })).toBeFocused();
  await page.getByLabel(en.name, { exact: true }).fill(ali.name); await page.getByLabel(en.phone, { exact: true }).fill('۰۳۰۰۱۲۳۴۵۶۷');
  await page.getByRole('button', { name: en.save, exact: true }).click(); await expect(page.getByRole('dialog', { name: en.duplicateTitle })).toBeVisible();
  expect((await stored(page)).customers).toHaveLength(1);
  await page.getByRole('dialog').getByRole('button', { name: en.cancel, exact: true }).click(); expect((await stored(page)).customers).toHaveLength(1);
  await page.getByRole('button', { name: en.save, exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: en.createSeparate, exact: true }).click();
  await expect.poll(async () => (await stored(page)).customers.length).toBe(2);
});
