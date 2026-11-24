import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import en from '../src/i18n/en.json' with { type: 'json' };
import ur from '../src/i18n/ur.json' with { type: 'json' };
const key = 'khata-preview.ledger.v1';
const configurations = [360, 412].flatMap(width => ['en', 'ur'].flatMap(language => [false, true].map(darkMode => ({ width, height: width === 360 ? 640 : 915, language, darkMode }))));
for (const config of configurations) {
  const id = `${config.width}-${config.language}-${config.darkMode ? 'dark' : 'light'}`;
  test.describe(id, () => {
    test.use({ viewport: { width: config.width, height: config.height }, reducedMotion: 'reduce' });
    test('top journeys, RTL/overflow, actual downloads, restore and axe including dialogs', async ({ page }) => {
      test.setTimeout(120000);
      const t = config.language === 'ur' ? ur : en;
      const name = config.language === 'ur' ? 'محمد علی خان' : 'Ali Khan';
      const scans: unknown[] = [];
      const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
      mkdirSync('docs/verification-evidence/screenshots', { recursive: true });
      async function check(screen: string, screenshot = true) {
        await page.evaluate(() => document.fonts.ready);
        const bounds = await page.evaluate(() => ({ document: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, main: document.querySelector('main')!.scrollWidth <= document.querySelector('main')!.clientWidth + 1 }));
        expect(bounds, screen).toEqual({ document: true, main: true });
        const targets = await page.locator('.button, .icon-button, .toggle, .language-switch button').all();
        for (const target of targets) if (await target.isVisible()) expect((await target.boundingBox())!.height, screen).toBeGreaterThanOrEqual(48);
        await expect(page.locator('html')).toHaveAttribute('dir', config.language === 'ur' ? 'rtl' : 'ltr');
        const result = await new AxeBuilder({ page }).analyze();
        scans.push({ screen, violations: result.violations.map(v => ({ id:v.id, impact:v.impact, nodes:v.nodes.map(n => ({ target:n.target, summary:n.failureSummary })) })), incomplete:result.incomplete.map(v => ({ id:v.id,impact:v.impact,nodes:v.nodes.length })) });
        // Save evidence before asserting so a failure remains inspectable.
        writeFileSync(`docs/verification-evidence/axe-${id}.json`, JSON.stringify({ configuration:config,axeVersion:result.testEngine.version,scans },null,2));
        expect(result.violations.filter(v => v.impact === 'serious' || v.impact === 'critical'), `${screen} serious/critical axe`).toEqual([]);
        if (screenshot) await page.screenshot({ path:`docs/verification-evidence/screenshots/${id}-${screen}.png`, fullPage:true, animations:'disabled' });
      }
      await page.goto('/'); await page.evaluate(({key,config}) => localStorage.setItem(key, JSON.stringify({ schemaVersion:1,customers:[],transactions:[],settings:{language:config.language,darkMode:config.darkMode} })),{key,config}); await page.reload();
      await check('home-empty');
      await page.getByRole('link', { name:t.addCustomer,exact:true }).click(); await expect(page.getByLabel(t.name,{exact:true})).toBeFocused(); await check('customer-new');
      await page.getByLabel(t.name,{exact:true}).fill(name); await page.getByLabel(t.phone,{exact:true}).fill('۰۳۰۰۱۲۳۴۵۶۷'); await page.getByRole('button',{name:t.save,exact:true}).click();
      await page.getByRole('link',{name:new RegExp(name)}).click(); const customerURL=page.url();
      await page.getByRole('link',{name:t.credit,exact:true}).click(); await page.getByLabel(t.amount,{exact:true}).fill('۱۰۰.۱۰'); await check('credit');
      await page.getByRole('button',{name:t.saveCredit,exact:true}).click(); await expect(page.locator('.customer-summary')).toContainText('Rs 100.10');
      await page.getByRole('link',{name:t.payment,exact:true}).click(); await page.getByLabel(t.amount,{exact:true}).fill('۳۰.۱۰'); await check('payment');
      await page.getByRole('button',{name:t.savePayment,exact:true}).click(); await expect(page.locator('.customer-summary .balance-amount')).toHaveText('Rs 70.00'); await check('detail');
      await expect(page.getByRole('link',{name:t.whatsapp,exact:true})).toHaveAttribute('href',/wa.me\/923001234567\?text=/);
      await expect(page.getByRole('link',{name:t.sms,exact:true})).toHaveAttribute('href',/sms:03001234567\?body=/);
      await page.getByRole('button',{name:t.more,exact:true}).click(); await page.getByRole('button',{name:t.delete,exact:true}).click(); await check('delete-dialog',false);
      const dialog=page.getByRole('dialog'); await expect(dialog).toContainText(name); await expect(dialog).toContainText('۰۳۰۰۱۲۳۴۵۶۷'); await expect(dialog.getByRole('button',{name:t.cancel,exact:true})).toBeFocused(); await page.keyboard.press('Escape');
      await page.getByRole('button',{name:t.more,exact:true}).click(); await page.getByRole('link',{name:t.edit,exact:true}).click(); await check('customer-edit'); await page.getByLabel(t.note,{exact:true}).fill('Shop review'); await page.getByRole('button',{name:t.save,exact:true}).click(); await expect(page.locator('.customer-note')).toHaveText('Shop review');
      await page.goto('/'); await page.getByRole('searchbox').fill('00923001234567'); await expect(page.getByRole('link',{name:new RegExp(name)})).toBeVisible(); await page.getByRole('searchbox').fill(''); await check('home');
      await page.goto('/settings'); await check('settings');
      const downloadPromise=page.waitForEvent('download'); await page.getByRole('button',{name:t.export,exact:true}).click(); const download=await downloadPromise; const stream=await download.createReadStream(); let source=''; for await(const chunk of stream) source+=chunk.toString(); const backup=JSON.parse(source); expect(backup.transactions.map((v:{amountPaisa:number})=>v.amountPaisa)).toEqual([10010,3010]);
      await page.getByRole('button',{name:t.resetData,exact:true}).click(); await check('reset-dialog',false); await page.getByRole('dialog').getByRole('button',{name:t.resetData,exact:true}).click(); await expect.poll(async()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).customers.length,key)).toBe(0);
      await page.goto('/settings/backup'); await check('backup'); const input=page.getByLabel(t.import,{exact:true});
      expect(await input.getAttribute('tabindex')).toBe('-1');
      await input.setInputFiles({name:'khata.json',mimeType:'application/json',buffer:Buffer.from(source)}); await check('restore-dialog',false); await page.getByRole('dialog').getByRole('button',{name:t.restore,exact:true}).click(); await expect(page.getByText(t.imported,{exact:true})).toBeVisible();
      await page.goto(customerURL); await page.reload(); await expect(page.locator('.customer-summary .balance-amount')).toHaveText('Rs 70.00'); expect(errors).toEqual([]);
    });
  });
}
