import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
const context = await browser.newContext({ viewport: { width: 360, height: 640 }, reducedMotion: 'reduce' });
const page = await context.newPage(); const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const customers = Array.from({ length: 500 }, (_, i) => ({ id: `c${i}`, name: `Customer ${String(i).padStart(3, '0')}`, phone: `0300${String(i).padStart(7, '0')}`, note: '' }));
const transactions = Array.from({ length: 5000 }, (_, i) => ({ id: `t${i}`, customerId: `c${i % 500}`, kind: i % 3 === 0 ? 'payment' : 'credit', amountPaisa: 10000 + i, date: '2020-01-01T00:00:00.000', createdAt: '2020-01-01T00:00:00.000Z', note: '' }));
const data = { schemaVersion: 1, exportedAt: new Date().toISOString(), customers, transactions, settings: { language: 'en', darkMode: false } };
await page.goto('http://localhost:4173/'); await page.evaluate(data => localStorage.setItem('khata-preview.ledger.v1', JSON.stringify(data)), data);
const home = [];
for (let i = 0; i < 3; i++) { const start = performance.now(); await page.reload(); await page.locator('.customer-card').first().waitFor(); await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); home.push(Math.round(performance.now() - start)); }
const search = [], clear = [];
async function input(value) {
  return page.evaluate(value => new Promise(resolve => {
    const element = document.querySelector('input[type=search]'); const start = performance.now();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event('input', { bubbles: true }));
    requestAnimationFrame(() => requestAnimationFrame(() => resolve(Math.round(performance.now() - start))));
  }), value);
}
for (let i = 0; i < 8; i++) { search.push(await input(`Customer ${String(i).padStart(3, '0')}`)); clear.push(await input('')); }
const add = await page.getByRole('link', { name: 'Add customer', exact: true }).boundingBox();
await page.goto('http://localhost:4173/customer/c0/credit'); await page.getByLabel('Amount (Rs)', { exact: true }).fill('10');
const saveStart = performance.now(); await page.getByRole('button', { name: 'Save udhaar', exact: true }).click(); await page.waitForURL('**/customer/c0'); const save = Math.round(performance.now() - saveStart);
const summary = values => { const sorted = [...values].sort((a,b) => a-b); return { median: sorted[Math.floor(sorted.length / 2)], p95: sorted[Math.ceil(sorted.length * 0.95) - 1], min: sorted[0], max: sorted.at(-1) }; };
const result = { browser: browser.version(), cpuThrottle: 4, viewport: '360x640', dataset: { customers:500, transactions:5000, bytes:Buffer.byteLength(JSON.stringify(data)) }, homeReadyMs:home, searchMs:search, clearSearchMs:clear, saveMs:save, addButton:add, summary:{home:summary(home),search:summary(search),clear:summary(clear)}, limits:'Synthetic Linux Chromium production build; no hardware, network/IME, sunlight or human typing measurement. Save n=1.' };
writeFileSync('docs/verification-evidence/performance.json',JSON.stringify(result,null,2)); console.log(JSON.stringify(result.summary)); console.log(JSON.stringify({saveMs:save,add}));
} finally { await browser.close(); }
