import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Check, UserRound } from 'lucide-react';
import { Modal } from '../components/Modal';
import { CustomerContext } from '../components/CustomerContext';
import { likelyDuplicates } from '../utils/customerIdentity';
import { Header } from '../components/Header';
import { MissingCustomer } from '../components/MissingCustomer';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { newId } from '../utils/ids';
import { customerPath } from '../utils/routes';
import { validateCustomer, type CustomerErrors } from '../utils/validation';
export function CustomerForm() {
  const { customerId } = useParams();
  const { ledger, saveCustomer, writeError } = useLedger();
  const existing = ledger.customers.find(c => c.id === customerId);
  const { t } = useI18n();
  const navigate = useNavigate();
  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const initialCustomer = useRef(existing);
  const [duplicateReview, setDuplicateReview] = useState<string[] | null>(null);
  const saving = useRef(false);
  const newCustomerId = useRef<string | null>(null);
  if (customerId && !existing) return <MissingCustomer/>;
  const backTo = existing ? customerPath(existing.id) : '/';
  async function submit(event?: FormEvent, reviewedIds?: string[]) {
    event?.preventDefault();
    if (saving.current) return;
    const found = validateCustomer({ name, phone, note }); setErrors(found); setError('');
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`customer-${first}`)?.focus(); return;
    }
    const duplicateIds = likelyDuplicates(ledger.customers, { id: existing?.id ?? '', name, phone }).map(c => c.id);
    if (duplicateIds.length && JSON.stringify(duplicateIds.sort()) !== JSON.stringify(reviewedIds?.sort())) { setDuplicateReview(duplicateIds); return; }
    saving.current = true; setBusy(true);
    try {
      newCustomerId.current ??= newId();
      const saved = await saveCustomer({ id: existing?.id ?? newCustomerId.current, name, phone, note }, initialCustomer.current, reviewedIds);
      if (saved) navigate(backTo, { replace: true });
      else { setDuplicateReview(null); setError(t(writeError())); }
    } catch { setError(t('error')); }
    finally { saving.current = false; setBusy(false); }
  }
  return <><Header title={t(existing ? 'editCustomer' : 'addCustomer')} backTo={backTo}/>
    <form noValidate onSubmit={event => void submit(event)} className="page-content form-content">
      <div className="form-symbol" aria-hidden="true"><UserRound/></div>
      <div className="form-field"><label htmlFor="customer-name">{t('name')}</label>
        <input id="customer-name" data-entry-focus value={name} onChange={e => setName(e.target.value)} maxLength={100} autoComplete="name" autoCapitalize="words" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} disabled={busy}/>
        {errors.name && <p id="name-error" className="field-error" role="alert">{t(errors.name)}</p>}
      </div>
      <div className="form-field"><label htmlFor="customer-phone">{t('phone')}</label>
        <input id="customer-phone" value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} type="tel" autoComplete="tel" dir="ltr" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? 'phone-error' : undefined} disabled={busy}/>
        {errors.phone && <p id="phone-error" className="field-error" role="alert">{t(errors.phone)}</p>}
      </div>
      <div className="form-field"><label htmlFor="customer-note">{t('note')}</label>
        <textarea id="customer-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500} aria-invalid={!!errors.note} aria-describedby={errors.note ? 'customer-note-error' : undefined} disabled={busy}/>
        {errors.note && <p id="customer-note-error" className="field-error" role="alert">{t(errors.note)}</p>}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      <div className="form-actions"><button className="button button-primary" type="submit" disabled={busy}><Check/>{t('save')}</button><Link className="button button-secondary" to={backTo}>{t('cancel')}</Link></div>
    </form>
    {duplicateReview && <Modal title={t('duplicateTitle')} onDismiss={() => setDuplicateReview(null)} actions={<button className="button button-primary" type="button" disabled={busy} onClick={() => void submit(undefined, duplicateReview)}>{t('createSeparate')}</button>}>
      <p>{t('duplicateHelp')}</p>{ledger.customers.filter(c => duplicateReview.includes(c.id)).map(c => <div className="duplicate-account" key={c.id}><CustomerContext customer={c}/><Link className="button button-secondary" to={customerPath(c.id)}>{t('reviewExisting')}</Link></div>)}
      {error && <p className="field-error" role="alert">{error}</p>}
    </Modal>}
    </>;
}
