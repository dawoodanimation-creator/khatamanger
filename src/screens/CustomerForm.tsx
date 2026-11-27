import { useState, useRef, useEffect, useMemo, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Check, BookUser, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Header } from '../components/Header';
import { Modal } from '../components/Modal';
import { CustomerContext } from '../components/CustomerContext';
import { MissingCustomer } from '../components/MissingCustomer';
import { useI18n, type TranslationKey } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import type { Customer } from '../models/customer';
import { newId } from '../utils/ids';
import { customerPath } from '../utils/routes';
import { validateCustomer, type CustomerErrors } from '../utils/validation';
import { likelyDuplicates } from '../utils/customerIdentity';
import { formatPakistaniPhoneInput } from '../utils/phone';
import { getInitials } from '../utils/avatar';
import { parseAmount } from '../utils/money';
import { todayISO, validEntryDate } from '../utils/dates';

const BUILTIN_CUSTOMER_CATEGORIES: Array<{ value: string; labelKey: TranslationKey }> = [
  { value: 'Regular', labelKey: 'catRegular' },
  { value: 'Wholesale', labelKey: 'catWholesale' },
  { value: 'Family', labelKey: 'catFamily' },
  { value: 'Friend/Neighbour', labelKey: 'catFriend' },
  { value: 'Staff', labelKey: 'catStaff' },
  { value: 'Supplier', labelKey: 'catSupplier' },
];

export function CustomerForm() {
  const { customerId } = useParams();
  const { ledger, saveCustomer, addTransaction, writeError } = useLedger();
  const { prefs, addCustomCustomerCategory } = useUiPrefs();
  const existing = customerId ? ledger.customers.find(c => c.id === customerId) : undefined;
  const { t } = useI18n();
  const navigate = useNavigate();

  const [name, setName] = useState(existing?.name ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [category, setCategory] = useState(existing?.category ?? '');
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');

  const [openingType, setOpeningType] = useState<'none' | 'they_owe' | 'i_owe'>('none');
  const [openingAmount, setOpeningAmount] = useState('');
  const [openingDate, setOpeningDate] = useState(todayISO());
  const [openingError, setOpeningError] = useState<TranslationKey | undefined>(undefined);

  const [showMore, setShowMore] = useState(
    Boolean(
      existing?.address ||
        existing?.whatsappPhone ||
        existing?.creditLimitPaisa ||
        existing?.defaultDueDays ||
        existing?.note
    )
  );
  const [address, setAddress] = useState(existing?.address ?? '');
  const [whatsappPhone, setWhatsappPhone] = useState(existing?.whatsappPhone ?? '');
  const [creditLimitInput, setCreditLimitInput] = useState(
    existing?.creditLimitPaisa ? (existing.creditLimitPaisa / 100).toString() : ''
  );
  const [defaultDueDaysInput, setDefaultDueDaysInput] = useState(
    existing?.defaultDueDays ? String(existing.defaultDueDays) : ''
  );
  const [note, setNote] = useState(existing?.note ?? '');

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const initialCustomer = useRef(existing);
  const [duplicateReview, setDuplicateReview] = useState<string[] | null>(null);
  const saving = useRef(false);
  const newCustomerId = useRef<string | null>(null);
  const [viewportBottom, setViewportBottom] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    function handleResize() {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = window.innerHeight - (vv.height + vv.offsetTop);
      setViewportBottom(Math.max(0, offset));
    }
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  const liveDuplicates = useMemo(() => {
    if (existing) return [];
    const digits = phone.replace(/\D/g, '');
    if (name.trim().length < 2 && digits.length < 7) return [];
    return likelyDuplicates(ledger.customers, { id: '', name, phone });
  }, [existing, ledger.customers, name, phone]);

  if (customerId && !existing) return <MissingCustomer />;
  const backTo = existing ? customerPath(existing.id) : '/';

  function parsedCreditLimit(): number | undefined {
    const trimmed = creditLimitInput.trim();
    if (!trimmed) return undefined;
    const paisa = parseAmount(trimmed);
    return paisa ?? -1;
  }

  function parsedDefaultDueDays(): number | undefined {
    const trimmed = defaultDueDaysInput.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : -1;
  }

  function buildErrors(overrides?: {
    name?: string;
    phone?: string;
    note?: string;
    address?: string;
    whatsappPhone?: string;
    creditLimitInput?: string;
    defaultDueDaysInput?: string;
    category?: string;
  }): CustomerErrors {
    const n = overrides?.name ?? name;
    const p = overrides?.phone ?? phone;
    const nt = overrides?.note ?? note;
    const addr = overrides?.address ?? address;
    const wa = overrides?.whatsappPhone ?? whatsappPhone;
    const cat = overrides?.category ?? category;
    const clRaw = (overrides?.creditLimitInput ?? creditLimitInput).trim();
    const ddRaw = (overrides?.defaultDueDaysInput ?? defaultDueDaysInput).trim();

    const clPaisa = clRaw ? (parseAmount(clRaw) ?? -1) : undefined;
    const ddNum = ddRaw ? (Number.isFinite(Number(ddRaw)) ? Number(ddRaw) : -1) : undefined;

    return validateCustomer({
      name: n,
      phone: p,
      note: nt,
      category: cat || undefined,
      address: addr || undefined,
      whatsappPhone: wa || undefined,
      creditLimitPaisa: clPaisa,
      defaultDueDays: ddNum,
    });
  }

  function markTouchedAndValidate(
    field: keyof CustomerErrors,
    overrides?: Parameters<typeof buildErrors>[0]
  ) {
    setTouched(prev => ({ ...prev, [field]: true }));
    const next = buildErrors(overrides);
    setErrors(prev => ({ ...prev, [field]: next[field] }));
  }

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
        if (contact.tel?.[0]) setPhone(formatPakistaniPhoneInput(contact.tel[0]));
      }
    } catch {
      // User cancelled
    }
  }

  function handleEnterNext(e: KeyboardEvent<HTMLInputElement>, nextId: string) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById(nextId)?.focus();
    }
  }

  function handleAddCustomCategory() {
    const clean = customCatInput.trim().slice(0, 60);
    if (!clean) return;
    addCustomCustomerCategory(clean);
    setCategory(clean);
    setCustomCatInput('');
    setShowCustomCat(false);
  }

  async function submit(event?: FormEvent, reviewedIds?: string[], goToUdhaar = false) {
    event?.preventDefault();
    if (saving.current) return;

    const found = buildErrors();
    setErrors(found);
    setError('');

    let openErr: TranslationKey | undefined;
    let openingPaisa: number | null = null;
    if (!existing && openingType !== 'none') {
      openingPaisa = parseAmount(openingAmount);
      if (openingPaisa === null) openErr = 'amountInvalid';
      else if (!validEntryDate(openingDate)) openErr = 'dateInvalid';
    }
    setOpeningError(openErr);

    if (Object.keys(found).length || openErr) {
      if (found.address || found.whatsappPhone || found.creditLimit || found.defaultDueDays || found.note) {
        setShowMore(true);
      }
      const first = Object.keys(found)[0];
      if (first) document.getElementById(`customer-${first}`)?.focus();
      else if (openErr) document.getElementById('opening-amount')?.focus();
      return;
    }

    const duplicateIds = likelyDuplicates(ledger.customers, {
      id: existing?.id ?? '',
      name,
      phone,
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
      const targetId = existing?.id ?? newCustomerId.current;
      const cl = parsedCreditLimit();
      const dd = parsedDefaultDueDays();

      const customerPayload: Customer = {
        id: targetId,
        name: name.trim(),
        phone: phone.trim(),
        note: note.trim(),
        ...(category.trim() ? { category: category.trim() } : {}),
        ...(address.trim() ? { address: address.trim() } : {}),
        ...(whatsappPhone.trim() ? { whatsappPhone: whatsappPhone.trim() } : {}),
        ...(cl !== undefined && cl > 0 ? { creditLimitPaisa: cl } : {}),
        ...(dd !== undefined && dd > 0 ? { defaultDueDays: Math.round(dd) } : {}),
      };

      const saved = await saveCustomer(customerPayload, initialCustomer.current, reviewedIds);
      if (!saved) {
        setDuplicateReview(null);
        setError(t(writeError()));
        return;
      }

      if (!existing && openingType !== 'none' && openingPaisa !== null) {
        await addTransaction(
          {
            id: newId(),
            customerId: targetId,
            kind: openingType === 'they_owe' ? 'credit' : 'payment',
            amountPaisa: openingPaisa,
            date: openingDate,
            note: t('openingBalanceNote'),
            createdAt: new Date().toISOString(),
          },
          customerPayload
        );
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // Ignore vibrate errors
        }
      }

      const destination = goToUdhaar ? `${customerPath(targetId)}/credit` : backTo;
      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      if (reducedMotion) {
        navigate(destination, { replace: true });
      } else {
        setShowSuccess(true);
        window.setTimeout(() => {
          navigate(destination, { replace: true });
        }, 200);
      }
    } catch {
      setError(t('error'));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  const allCategories = [
    ...BUILTIN_CUSTOMER_CATEGORIES.map(c => ({ value: c.value, label: t(c.labelKey) })),
    ...(prefs.customCustomerCategories ?? [])
      .filter(c => !BUILTIN_CUSTOMER_CATEGORIES.some(b => b.value.toLowerCase() === c.toLowerCase()))
      .map(c => ({ value: c, label: c })),
  ];

  const previewInitials = getInitials(name.trim() || t('addCustomer'));

  return (
    <>
      <Header
        title={existing ? t('editCustomer') : t('addCustomer')}
        backTo={backTo}
        actions={
          !existing ? (
            <button
              type="button"
              className="icon-button"
              onClick={pickContact}
              aria-label={t('importContact')}
              title={t('importContact')}
            >
              <BookUser size={20} aria-hidden="true" />
            </button>
          ) : undefined
        }
      />

      <form className="page-content customer-form-page" onSubmit={e => void submit(e)} noValidate>
        {/* Live Avatar Preview */}
        <div className="avatar-preview-wrap">
          <div className="avatar-preview-circle" aria-hidden="true">
            {name.trim() ? previewInitials : <User size={24} />}
          </div>
          <div className="avatar-preview-meta">
            {name.trim() && <div className="avatar-preview-name">{name.trim()}</div>}
            <div className="avatar-preview-sub">
              <bdi dir="ltr">{phone.trim() || '03XX-XXXXXXX'}</bdi>
              {category ? ` • ${allCategories.find(c => c.value === category)?.label ?? category}` : ''}
            </div>
          </div>
        </div>

        {/* Non-blocking Live Duplicate Check */}
        {!existing && !showSuccess && liveDuplicates.length > 0 && (
          <div className="duplicate-inline-notice" role="status">
            <div className="notice-header">
              <span>{t('duplicateTitle')}</span>
            </div>
            <div className="duplicate-links">
              {liveDuplicates.map(c => (
                <Link key={c.id} to={customerPath(c.id)} className="duplicate-view-link">
                  <span>
                    {c.name} ({c.phone}) — {t('openExistingCustomer')}
                  </span>
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
              const val = e.target.value;
              setName(val);
              if (touched.name || errors.name) {
                const next = buildErrors({ name: val });
                setErrors(prev => ({ ...prev, name: next.name }));
              }
            }}
            onBlur={() => markTouchedAndValidate('name')}
            onKeyDown={e => handleEnterNext(e, 'customer-phone')}
            maxLength={100}
            autoComplete="name"
            autoCapitalize="words"
            autoFocus={!existing}
            dir="auto"
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
              const formatted = formatPakistaniPhoneInput(e.target.value);
              setPhone(formatted);
              if (touched.phone || errors.phone) {
                const next = buildErrors({ phone: formatted });
                setErrors(prev => ({ ...prev, phone: next.phone }));
              }
            }}
            onBlur={() => markTouchedAndValidate('phone')}
            onKeyDown={e => {
              if (!existing && openingType !== 'none') handleEnterNext(e, 'opening-amount');
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

        {/* Category Chips */}
        <div className="form-field">
          <label>{t('category')}</label>
          <div className="chip-wrap-row" role="group" aria-label={t('category')}>
            {allCategories.map(cat => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  className={`choice-chip ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setCategory(active ? '' : cat.value)}
                  disabled={busy}
                >
                  {cat.label}
                </button>
              );
            })}
            <button
              type="button"
              className="choice-chip choice-chip-add"
              onClick={() => setShowCustomCat(v => !v)}
              disabled={busy}
            >
              <span>{t('customCategory')}</span>
            </button>
          </div>
          {showCustomCat && (
            <div className="custom-chip-inline">
              <input
                type="text"
                className="form-control-input"
                value={customCatInput}
                onChange={e => setCustomCatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomCategory();
                  }
                }}
                maxLength={60}
                placeholder={t('customCategoryPlaceholder')}
              />
              <button
                type="button"
                className="button button-secondary"
                onClick={handleAddCustomCategory}
              >
                {t('save')}
              </button>
            </div>
          )}
          {category === 'Supplier' && <p className="field-hint">{t('supplierHint')}</p>}
        </div>

        {/* Opening Balance (Add Customer Only) */}
        {!existing && (
          <div className="form-field">
            <label>{t('openingBalance')}</label>
            <div className="chip-wrap-row" role="group" aria-label={t('openingBalance')}>
              {(
                [
                  { id: 'none', key: 'openingNone' },
                  { id: 'they_owe', key: 'openingTheyOwe' },
                  { id: 'i_owe', key: 'openingIOwe' },
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  className={`choice-chip ${openingType === opt.id ? 'is-active' : ''}`}
                  aria-pressed={openingType === opt.id}
                  onClick={() => {
                    setOpeningType(opt.id);
                    setOpeningError(undefined);
                  }}
                  disabled={busy}
                >
                  {t(opt.key)}
                </button>
              ))}
            </div>
            {openingType !== 'none' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                <div>
                  <label htmlFor="opening-amount">{t('amount')}</label>
                  <input
                    id="opening-amount"
                    className="form-control-input"
                    value={openingAmount}
                    onChange={e => {
                      setOpeningAmount(e.target.value);
                      setOpeningError(undefined);
                    }}
                    inputMode="decimal"
                    dir="ltr"
                    placeholder="0.00"
                    disabled={busy}
                  />
                </div>
                <div>
                  <label htmlFor="opening-date">{t('date')}</label>
                  <input
                    id="opening-date"
                    type="date"
                    className="form-control-input"
                    value={openingDate}
                    onChange={e => {
                      setOpeningDate(e.target.value);
                      setOpeningError(undefined);
                    }}
                    disabled={busy}
                  />
                </div>
              </div>
            )}
            {openingError && (
              <p className="field-error" role="alert">
                {t(openingError)}
              </p>
            )}
          </div>
        )}

        {/* Collapsed More Details */}
        <div>
          <button
            type="button"
            className="more-details-toggle"
            aria-expanded={showMore}
            onClick={() => setShowMore(v => !v)}
          >
            <span>{t('moreDetails')}</span>
            {showMore ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          </button>

          {showMore && (
            <div className="more-details-panel">
              <div className="form-field">
                <label htmlFor="customer-address">{t('address')}</label>
                <input
                  id="customer-address"
                  className="form-control-input"
                  value={address}
                  onChange={e => {
                    const val = e.target.value;
                    setAddress(val);
                    if (touched.address) {
                      const next = buildErrors({ address: val });
                      setErrors(prev => ({ ...prev, address: next.address }));
                    }
                  }}
                  onBlur={() => markTouchedAndValidate('address')}
                  onKeyDown={e => handleEnterNext(e, 'customer-whatsappPhone')}
                  maxLength={200}
                  dir="auto"
                  placeholder={t('addressPlaceholder')}
                  disabled={busy}
                />
                {errors.address && (
                  <p className="field-error" role="alert">
                    {t(errors.address)}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="customer-whatsappPhone">{t('whatsappNumber')}</label>
                <input
                  id="customer-whatsappPhone"
                  className="form-control-input"
                  value={whatsappPhone}
                  onChange={e => {
                    const formatted = formatPakistaniPhoneInput(e.target.value);
                    setWhatsappPhone(formatted);
                    if (touched.whatsappPhone) {
                      const next = buildErrors({ whatsappPhone: formatted });
                      setErrors(prev => ({ ...prev, whatsappPhone: next.whatsappPhone }));
                    }
                  }}
                  onBlur={() => markTouchedAndValidate('whatsappPhone')}
                  onKeyDown={e => handleEnterNext(e, 'customer-creditLimit')}
                  maxLength={30}
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder={t('sameAsPhone')}
                  disabled={busy}
                />
                {errors.whatsappPhone && (
                  <p className="field-error" role="alert">
                    {t(errors.whatsappPhone)}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="customer-creditLimit">{t('creditLimit')}</label>
                <input
                  id="customer-creditLimit"
                  className="form-control-input"
                  value={creditLimitInput}
                  onChange={e => {
                    const val = e.target.value;
                    setCreditLimitInput(val);
                    if (touched.creditLimit) {
                      const next = buildErrors({ creditLimitInput: val });
                      setErrors(prev => ({ ...prev, creditLimit: next.creditLimit }));
                    }
                  }}
                  onBlur={() => markTouchedAndValidate('creditLimit')}
                  onKeyDown={e => handleEnterNext(e, 'customer-defaultDueDays')}
                  inputMode="decimal"
                  dir="ltr"
                  placeholder="0"
                  disabled={busy}
                />
                {errors.creditLimit && (
                  <p className="field-error" role="alert">
                    {t(errors.creditLimit)}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="customer-defaultDueDays">{t('defaultDueDays')}</label>
                <div className="chip-wrap-row" style={{ marginBottom: '8px' }}>
                  {['7', '15', '30'].map(d => (
                    <button
                      key={d}
                      type="button"
                      className={`choice-chip ${defaultDueDaysInput === d ? 'is-active' : ''}`}
                      onClick={() => {
                        setDefaultDueDaysInput(defaultDueDaysInput === d ? '' : d);
                        setErrors(prev => ({ ...prev, defaultDueDays: undefined }));
                      }}
                      disabled={busy}
                    >
                      {d} {t('dueDaysUnit')}
                    </button>
                  ))}
                </div>
                <input
                  id="customer-defaultDueDays"
                  className="form-control-input"
                  value={defaultDueDaysInput}
                  onChange={e => {
                    const val = e.target.value;
                    setDefaultDueDaysInput(val);
                    if (touched.defaultDueDays) {
                      const next = buildErrors({ defaultDueDaysInput: val });
                      setErrors(prev => ({ ...prev, defaultDueDays: next.defaultDueDays }));
                    }
                  }}
                  onBlur={() => markTouchedAndValidate('defaultDueDays')}
                  inputMode="numeric"
                  dir="ltr"
                  placeholder={t('dueDaysUnit')}
                  disabled={busy}
                />
                {errors.defaultDueDays && (
                  <p className="field-error" role="alert">
                    {t(errors.defaultDueDays)}
                  </p>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="customer-note">{t('note')}</label>
                <textarea
                  id="customer-note"
                  className="form-control-textarea"
                  value={note}
                  onChange={e => {
                    const val = e.target.value;
                    setNote(val);
                    if (touched.note || errors.note) {
                      const next = buildErrors({ note: val });
                      setErrors(prev => ({ ...prev, note: next.note }));
                    }
                  }}
                  onBlur={() => markTouchedAndValidate('note')}
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
            </div>
          )}
        </div>

        {error && (
          <p className="field-error form-global-error" role="alert">
            {error}
          </p>
        )}

        {/* Sticky Save Bar */}
        <div
          className="customer-form-sticky-bar"
          style={{ bottom: viewportBottom ? `${viewportBottom}px` : undefined }}
        >
          <div className="form-actions sticky-actions">
            <button className="button button-primary" type="submit" disabled={busy}>
              <Check size={18} aria-hidden="true" />
              <span>{t('save')}</span>
            </button>
            {!existing && (
              <button
                className="button button-secondary"
                type="button"
                disabled={busy}
                onClick={() => void submit(undefined, undefined, true)}
              >
                <span>{t('saveAndAddUdhaar')}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Success Checkmark Overlay */}
      {showSuccess && (
        <div className="save-success-overlay" aria-live="polite">
          <div className="save-success-card">
            <svg className="checkmark-svg" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path
                className="checkmark-path"
                d="M14 25l7 7 13-14"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}

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
