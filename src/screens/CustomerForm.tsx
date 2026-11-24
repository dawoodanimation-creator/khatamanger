import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Check, UserRound, BookUser, AlertTriangle, ExternalLink } from 'lucide-react';
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
import { getInitials, getAvatarColorIndex } from '../utils/avatar';

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

  async function pickContact() {
    setError('');
    const nav = navigator as unknown as {
      contacts?: {
        select: (
          props: string[],
          opts?: { multiple?: boolean }
        ) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
      };
    };

    if (!nav.contacts?.select) {
      setError(t('contactNotSupported'));
      return;
    }

    try {
      const selected = await nav.contacts.select(['name', 'tel'], { multiple: false });
      if (selected && selected.length > 0) {
        const contact = selected[0];
        if (contact.name?.[0]) setName(contact.name[0]);
        if (contact.tel?.[0]) setPhone(contact.tel[0]);
      }
    } catch {
      // User cancelled
    }
  }

  if (customerId && !existing) return <MissingCustomer />;
  const backTo = existing ? customerPath(existing.id) : '/';

  async function submit(event?: FormEvent, reviewedIds?: string[]) {
    event?.preventDefault();
    if (saving.current) return;

    const found = validateCustomer({ name, phone, note });
    setErrors(found);
    setError('');

    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`customer-${first}`)?.focus();
      return;
    }

    const duplicateIds = likelyDuplicates(ledger.customers, {
      id: existing?.id ?? '',
      name,
      phone
    }).map(c => c.id);

    if (
      duplicateIds.length &&
      JSON.stringify(duplicateIds.sort()) !== JSON.stringify(reviewedIds?.sort())
    ) {
      setDuplicateReview(duplicateIds);
      return;
    }

    saving.current = true;
    setBusy(true);

    try {
      newCustomerId.current ??= newId();
      const saved = await saveCustomer(
        { id: existing?.id ?? newCustomerId.current, name, phone, note },
        initialCustomer.current,
        reviewedIds
      );
      if (saved) navigate(backTo, { replace: true });
      else {
        setDuplicateReview(null);
        setError(t(writeError()));
      }
    } catch {
      setError(t('error'));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  const initials = existing ? getInitials(existing.name) : '';
  const colorIndex = existing ? getAvatarColorIndex(existing.name) : 0;

  return (
    <>
      <Header title={t(existing ? 'editCustomer' : 'addCustomer')} backTo={backTo} />

      <form
        noValidate
        onSubmit={event => void submit(event)}
        className="page-content form-content customer-form-page"
      >
        {/* Top Header Row with Avatar / Icon and Import Contacts */}
        <div className="customer-form-top-bar">
          <div className="form-avatar-box">
            {existing ? (
              <div
                className={`customer-avatar avatar-color-${colorIndex}`}
                aria-hidden="true"
              >
                {initials}
              </div>
            ) : (
              <div className="form-symbol" aria-hidden="true">
                <UserRound size={22} />
              </div>
            )}
            <div className="form-intro-text">
              <h3>{existing ? existing.name : t('addCustomer')}</h3>
              <p className="text-xs text-muted">
                {existing ? t('editCustomer') : t('emptyCustomersBody')}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="import-contact-btn"
            onClick={pickContact}
            title={t('importContact')}
          >
            <BookUser size={16} aria-hidden="true" />
            <span>{t('importContact')}</span>
          </button>
        </div>

        {/* Duplicate Customer Inline Notice */}
        {duplicateReview && duplicateReview.length > 0 && (
          <div className="duplicate-inline-notice" role="alert">
            <div className="notice-header">
              <AlertTriangle size={18} className="text-owed" aria-hidden="true" />
              <strong>{t('duplicateTitle')}</strong>
            </div>
            <p className="notice-body">{t('duplicateHelp')}</p>
            <div className="duplicate-links">
              {ledger.customers
                .filter(c => duplicateReview.includes(c.id))
                .map(c => (
                  <Link
                    key={c.id}
                    to={customerPath(c.id)}
                    className="duplicate-view-link"
                    target="_blank"
                    rel="noopener"
                  >
                    <span>{c.name} ({c.phone})</span>
                    <ExternalLink size={13} aria-hidden="true" />
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Name Field */}
        <div className="form-field">
          <label htmlFor="customer-name">{t('name')}</label>
          <input
            id="customer-name"
            data-entry-focus
            className="form-control-input"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
            }}
            maxLength={100}
            autoComplete="name"
            autoCapitalize="words"
            autoFocus={!existing}
            placeholder={t('name')}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            disabled={busy}
          />
          {errors.name && (
            <p id="name-error" className="field-error" role="alert">
              {t(errors.name)}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div className="form-field">
          <label htmlFor="customer-phone">{t('phone')}</label>
          <input
            id="customer-phone"
            className="form-control-input"
            value={phone}
            onChange={e => {
              setPhone(e.target.value);
              if (errors.phone) setErrors(prev => ({ ...prev, phone: undefined }));
            }}
            maxLength={30}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder="03XX-XXXXXXX"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? 'phone-error' : undefined}
            disabled={busy}
          />
          {errors.phone && (
            <p id="phone-error" className="field-error" role="alert">
              {t(errors.phone)}
            </p>
          )}
        </div>

        {/* Note Field */}
        <div className="form-field">
          <label htmlFor="customer-note">{t('note')}</label>
          <textarea
            id="customer-note"
            className="form-control-textarea"
            value={note}
            onChange={e => {
              setNote(e.target.value);
              if (errors.note) setErrors(prev => ({ ...prev, note: undefined }));
            }}
            rows={3}
            maxLength={500}
            placeholder={t('note')}
            aria-invalid={!!errors.note}
            aria-describedby={errors.note ? 'customer-note-error' : undefined}
            disabled={busy}
          />
          {errors.note && (
            <p id="customer-note-error" className="field-error" role="alert">
              {t(errors.note)}
            </p>
          )}
        </div>

        {error && (
          <p className="field-error form-global-error" role="alert">
            {error}
          </p>
        )}

        {/* Sticky Save Bar */}
        <div className="customer-form-sticky-bar">
          <div className="form-actions sticky-actions">
            <button className="button button-primary" type="submit" disabled={busy}>
              <Check size={18} aria-hidden="true" />
              <span>{t('save')}</span>
            </button>
            <Link className="button button-secondary" to={backTo}>
              {t('cancel')}
            </Link>
          </div>
        </div>
      </form>

      {/* Duplicate Review Modal */}
      {duplicateReview && (
        <Modal
          title={t('duplicateTitle')}
          onDismiss={() => setDuplicateReview(null)}
          actions={
            <button
              className="button button-primary"
              type="button"
              disabled={busy}
              onClick={() => void submit(undefined, duplicateReview)}
            >
              {t('createSeparate')}
            </button>
          }
        >
          <p>{t('duplicateHelp')}</p>
          {ledger.customers
            .filter(c => duplicateReview.includes(c.id))
            .map(c => (
              <div className="duplicate-account" key={c.id}>
                <CustomerContext customer={c} />
                <Link className="button button-secondary" to={customerPath(c.id)}>
                  {t('reviewExisting')}
                </Link>
              </div>
            ))}
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
