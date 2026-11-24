// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import { LedgerProvider } from './state/LedgerContext';
import { emptyLedger, type Ledger } from './models/ledger';
import { encodeLedger } from './utils/backup';
import { STORAGE_KEY, readLedger } from './state/storage';

const storageMap = new Map<string, string>();
Storage.prototype.getItem = function (key: string) { return storageMap.get(key) ?? null; };
Storage.prototype.setItem = function (key: string, value: string) { storageMap.set(key, String(value)); };
Storage.prototype.removeItem = function (key: string) { storageMap.delete(key); };
Storage.prototype.clear = function () { storageMap.clear(); };
Storage.prototype.key = function (index: number) { return Array.from(storageMap.keys())[index] ?? null; };
Object.defineProperty(Storage.prototype, 'length', { get: function () { return storageMap.size; }, configurable: true });

const localStorageMock = Object.create(Storage.prototype);
try {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: localStorageMock,
  });
} catch {}
if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });
  } catch {}
}

const ali = { id: 'ali', name: 'Ali', phone: '03001234567', note: '' };
function seeded(): Ledger {
  return { ...emptyLedger(), customers: [ali], transactions: [{ id: 't', customerId: 'ali', kind: 'credit', amountPaisa: 10010,
    date: '2020-01-01T00:00:00.000', createdAt: '2020-01-01T00:00:00.000Z', note: '' }] };
}
function open(route = '/', data?: Ledger) {
  if (data) localStorage.setItem(STORAGE_KEY, encodeLedger(data));
  return render(<MemoryRouter initialEntries={[route]}><LedgerProvider><App/></LedgerProvider></MemoryRouter>);
}
beforeAll(() => {
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: localStorageMock,
    });
  } catch {}
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request: async (_name: string, _options: unknown, callback: () => unknown) => callback() } });
  // jsdom has no top layer; native browser dialog still owns focus/escape at runtime.
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  URL.createObjectURL = vi.fn(() => 'blob:preview-test');
  URL.revokeObjectURL = vi.fn();
});
beforeEach(() => {
  localStorageMock.clear();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('complete customer flow', () => {
  test('validates, saves, records credit/payment and persists after remount', async () => {
    const user = userEvent.setup(); const app = open();
    await user.click(screen.getByRole('link', { name: 'Add customer' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Enter a name (up to 100 characters).')).toBeTruthy();
    await user.type(screen.getByLabelText('Name'), 'Ali');
    await user.type(screen.getByLabelText('Phone'), '03001234567');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(await screen.findByRole('link', { name: /Ali/ }));
    await user.click(screen.getByRole('link', { name: 'Udhaar Diya' }));
    await user.type(screen.getByLabelText('Amount (Rs)'), '100.10');
    await user.click(screen.getByRole('button', { name: 'Save udhaar' }));
    await waitFor(() => expect(within(document.querySelector('.customer-summary')!).getByText('Rs 100.10')).toBeTruthy());
    await user.click(screen.getByRole('link', { name: 'Payment Mili' }));
    await user.type(screen.getByLabelText('Amount (Rs)'), '150.10');
    await user.click(screen.getByRole('button', { name: 'Save payment' }));
    await waitFor(() => expect(within(document.querySelector('.customer-summary')!).getByText('You owe')).toBeTruthy());
    expect(screen.queryByRole('region', { name: 'Send balance reminder' })).toBeNull();
    const stored = readLedger(localStorage);
    expect(stored.transactions.map(t => t.amountPaisa)).toEqual([10010, 15010]);
    app.unmount(); open();
    expect(within(document.querySelector('.customer-card')!).getByText('Rs 50.00')).toBeTruthy();
    expect(screen.getByText('Customers owe you').parentElement?.parentElement?.textContent).toContain('Rs 0.00');
  });
  test('edit keeps transactions and deletion requires confirmation', async () => {
    const user = userEvent.setup(); open('/customers/ali', seeded());
    await user.click(screen.getByRole('link', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Name')); await user.type(screen.getByLabelText('Name'), 'Ali Khan');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('heading', { name: 'Ali Khan' })).toBeTruthy();
    expect(readLedger(localStorage).transactions).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
    expect(readLedger(localStorage).customers).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(readLedger(localStorage).customers).toEqual([]));
    expect(readLedger(localStorage).transactions).toEqual([]);
    expect(await screen.findByText('Your khata starts here')).toBeTruthy();
  });
});

test('backdated entries show newest first with chronological running balances', () => {
  const data = seeded(); data.transactions.push({ ...data.transactions[0], id: 'later', kind: 'payment', amountPaisa: 5010, date: '2020-01-03T00:00:00.000' });
  data.transactions.push({ ...data.transactions[0], id: 'backdated', amountPaisa: 1000, date: '2020-01-02T00:00:00.000' });
  open('/customers/ali', data);
  const cards = document.querySelectorAll('.transaction-card');
  expect(cards).toHaveLength(3);
  expect(cards[0].textContent).toContain('− Rs 50.10');
  expect(cards[0].textContent).toContain('Rs 60.00');
  expect(cards[1].textContent).toContain('Rs 110.10');
});

test('reminder dialog contains the exact message and functional share URLs', async () => {
  open('/customers/ali', seeded());
  const modal = screen.getByRole('region', { name: 'Send balance reminder' });
  expect(within(modal).getByText('Assalam o Alaikum Ali, aap ka Rs 100.10 baqaya hai. Meherbani farma kar ada kar dein. Shukriya.')).toBeTruthy();
  expect(within(modal).getByRole('link', { name: 'WhatsApp' }).getAttribute('href')).toContain('https://wa.me/923001234567?text=');
  expect(within(modal).getByRole('link', { name: 'SMS' }).getAttribute('href')).toContain('sms:03001234567?body=');
});

test('demo load and reset ask before replacing records and preserve settings', async () => {
  const user = userEvent.setup(); open('/settings');
  await user.click(screen.getByRole('switch', { name: 'Dark mode' }));
  await user.click(screen.getByRole('button', { name: 'Load demo data' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
  expect(readLedger(localStorage).customers).toEqual([]);
  await user.click(screen.getByRole('button', { name: 'Load demo data' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Load demo data' }));
  expect(readLedger(localStorage).customers).toHaveLength(3);
  await user.click(screen.getByRole('button', { name: 'Reset data' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset data' }));
  expect(readLedger(localStorage).customers).toEqual([]);
  expect(readLedger(localStorage).settings.darkMode).toBe(true);
});

test('backup upload validates first; cancellation keeps data; confirmation replaces settings too', async () => {
  const user = userEvent.setup(); open('/settings/backup', seeded());
  const replacement = { ...emptyLedger(), settings: { language: 'ur' as const, darkMode: true } };
  const file = new File([encodeLedger(replacement)], 'khata.json', { type: 'application/json' });
  const upload = screen.getByLabelText('Restore from backup file');
  await user.upload(upload, file);
  await screen.findByRole('dialog', { name: 'Replace current data?' });
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));
  expect(readLedger(localStorage).customers).toHaveLength(1);
  await user.upload(upload, file);
  await screen.findByRole('dialog');
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Replace data' }));
  expect(await screen.findByText('بیک اپ بحال ہو گیا۔')).toBeTruthy();
  expect(readLedger(localStorage)).toEqual(replacement);
  expect(document.documentElement.dir).toBe('rtl');
});

test('corrupt backup cannot replace the current ledger', async () => {
  const user = userEvent.setup(); open('/settings/backup', seeded());
  await user.upload(screen.getByLabelText('Restore from backup file'), new File(['bad JSON'], 'bad.json', { type: 'application/json' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(readLedger(localStorage).customers).toHaveLength(1);
});

test('export uses a JSON Blob and a named download', async () => {
  const user = userEvent.setup(); open('/settings/backup', seeded());
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  await user.click(screen.getByRole('button', { name: 'Save backup file' }));
  expect(click).toHaveBeenCalledOnce();
  const anchor = click.mock.contexts[0] as HTMLAnchorElement;
  expect(anchor.download).toMatch(/^khata-backup-.*\.json$/);
  expect(anchor.href).toBe('blob:preview-test');
  expect(screen.getByText('Backup download started.')).toBeTruthy();
});

test('blocked localStorage keeps the unsaved form and existing ledger', async () => {
  const user = userEvent.setup(); open('/customers/new');
  await user.type(screen.getByLabelText('Name'), 'Ali'); await user.type(screen.getByLabelText('Phone'), '03001234567');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  await user.click(screen.getByRole('button', { name: 'Save' }));
  expect(screen.getByLabelText('Name')).toBeTruthy();
  await waitFor(() => expect(screen.getAllByText('Your browser could not save this change. Check that local storage is enabled and try again.').length).toBeGreaterThan(0));
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
});


test('Urdu settings persist and apply RTL to customer forms', async () => {
  const user = userEvent.setup(); open('/settings');
  await user.click(screen.getByRole('button', { name: 'اردو' }));
  expect(document.documentElement.dir).toBe('rtl');
  expect(screen.getByRole('heading', { name: 'ترتیبات' })).toBeTruthy();
  await user.click(screen.getByRole('link', { name: 'واپس' }));
  await user.click(screen.getByRole('link', { name: 'گاہک شامل کریں' }));
  expect(screen.getByLabelText('نام')).toBeTruthy();
  expect(screen.getByLabelText('فون نمبر').getAttribute('dir')).toBe('ltr');
  expect(readLedger(localStorage).settings.language).toBe('ur');
});

test('home search matches name/phone and excludes nonmatches', async () => {
  const user = userEvent.setup(); const data = seeded();
  data.customers.push({ id: 'sana', name: 'Sana', phone: '03011234567', note: '' });
  open('/', data);
  const search = screen.getByRole('searchbox');
  await user.type(search, 'sAnA');
  expect(screen.getByRole('link', { name: /Sana/ })).toBeTruthy();
  expect(screen.queryByRole('link', { name: /Ali/ })).toBeNull();
  await user.clear(search); await user.type(search, '0300123');
  expect(screen.getByRole('link', { name: /Ali/ })).toBeTruthy();
  await user.clear(search); await user.type(search, 'absent');
  expect(screen.getByText('No customers found. Try another name or phone.')).toBeTruthy();
});


test('a huge accepted balance shows an entry-specific range warning and blocks an unsafe projected save', async () => {
  const data = seeded();
  data.transactions = Array.from({ length: 9008 }, (_, i) => ({ ...data.transactions[0], id: String(i), amountPaisa: i === 9007 ? 199254749998 : 999999999999 }));
  const user = userEvent.setup(); open('/customer/ali/credit', data);
  await user.type(screen.getByLabelText('Amount (Rs)'), '0.01');
  expect(screen.getByText('This amount would put the balance beyond this preview’s exact number range. No change has been saved.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Save udhaar' }).hasAttribute('disabled')).toBe(true);
  expect(readLedger(localStorage).transactions).toHaveLength(9008);
});
