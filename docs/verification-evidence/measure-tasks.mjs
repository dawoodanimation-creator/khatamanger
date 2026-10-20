import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try {
for (const task of ['add','credit','payment','reminder-handoff','find','backup-download']) {
  const samples=[];
  for(let run=0;run<3;run++) {
    const context=await browser.newContext({viewport:{width:360,height:640},reducedMotion:'reduce'});const page=await context.newPage();const cdp=await context.newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
    await page.goto('http://localhost:4173/');await page.evaluate(()=>localStorage.setItem('khata-preview.ledger.v1',JSON.stringify({schemaVersion:1,customers:[{id:'ali',name:'Ali Khan',phone:'03001234567',note:''}],transactions:[{id:'t',customerId:'ali',kind:'credit',amountPaisa:10000,date:'2020-01-01T00:00:00.000',createdAt:'2020-01-01T00:00:00.000Z',note:''}],settings:{language:'en',darkMode:false}})));await page.reload();await page.locator('.customer-card').waitFor();
    await page.evaluate(()=>{window.__taps=0;document.addEventListener('pointerup',()=>window.__taps++);});
    const start=performance.now();
    if(task==='add') {await page.getByRole('link',{name:'Add customer',exact:true}).click();await page.getByLabel('Name',{exact:true}).fill('Sana');await page.getByLabel('Phone',{exact:true}).click();await page.getByLabel('Phone',{exact:true}).fill('03011234567');await page.getByRole('button',{name:'Save',exact:true}).click();await page.waitForURL('http://localhost:4173/');await page.getByRole('link',{name:/Sana/}).waitFor();}
    if(task==='credit'||task==='payment'){await page.getByRole('link',{name:/Ali Khan/}).click();await page.getByRole('link',{name:task==='credit'?'Udhaar Diya':'Payment Mili',exact:true}).click();await page.getByLabel('Amount (Rs)',{exact:true}).fill('10');await page.getByRole('button',{name:task==='credit'?'Save udhaar':'Save payment',exact:true}).click();await page.waitForURL('**/customer/ali');}
    if(task==='reminder-handoff'){await context.route('https://wa.me/**',route=>route.fulfill({status:200,body:'Intercepted; no external message sent'}));await page.getByRole('link',{name:/Ali Khan/}).click();const popup=context.waitForEvent('page');await page.getByRole('link',{name:'WhatsApp',exact:true}).click();await popup;}
    if(task==='find'){await page.getByRole('searchbox').click();await page.getByRole('searchbox').fill('03001234567');await page.getByRole('link',{name:/Ali Khan/}).click();await page.waitForURL('**/customer/ali');}
    if(task==='backup-download'){await page.getByRole('link',{name:'Settings',exact:true}).click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save backup file',exact:true}).click();const file=await download;const stream=await file.createReadStream();let raw='';for await(const chunk of stream)raw+=chunk.toString();if(JSON.parse(raw).customers.length!==1)throw new Error('Wrong backup');}
    samples.push({taps:await page.evaluate(()=>window.__taps),ms:Math.round(performance.now()-start)});await context.close();
  }
  const times=samples.map(s=>s.ms).sort((a,b)=>a-b);results.push({task,samples,medianMs:times[1]});
}
const report={cpuThrottle:4,viewport:'360x640',samples:results,limits:'Automation excludes human typing/comprehension/IME and swipe counts. Reminder ends at intercepted link handoff, not OS Send; backup ends at parsed browser download, not phone Files confirmation. Human <=10s NOT VERIFIED.'};
writeFileSync('docs/verification-evidence/tasks.json',JSON.stringify(report,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
