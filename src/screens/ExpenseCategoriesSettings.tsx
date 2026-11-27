import { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Plus, Check } from 'lucide-react';
import { Header } from '../components/Header';
import { ExpenseCategoryIcon } from '../components/ExpenseCategoryIcon';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import type { ExpenseCategory, ExpenseCategoryIcon as IconName, ExpenseKind } from '../models/expense';
import {
  CATEGORY_COLOR_CHOICES,
  CATEGORY_ICON_CHOICES,
  getCategoryLabel,
  resolveExpenseCategories,
} from '../utils/expenseCategories';
import { newId } from '../utils/ids';
import { parseAmount } from '../utils/money';

export function ExpenseCategoriesSettings() {
  const { ledger, saveExpenseCategories, saveCustomerCategories, saveBudgets } = useLedger();
  const { prefs, addCustomCustomerCategory } = useUiPrefs();
  const { t, language } = useI18n();

  const useMode = ledger.settings.useMode ?? 'both';
  const [sectionTab, setSectionTab] = useState<'expenses' | 'khata'>(
    useMode === 'khata' ? 'khata' : 'expenses'
  );

  const categories = resolveExpenseCategories(ledger.expenseCategories, ledger.expenses);
  const budgets = ledger.budgets ?? [];
  const budgetMap = new Map(budgets.map(b => [b.categoryId, b.limitPaisa]));

  const [newCustomerCat, setNewCustomerCat] = useState('');
  const customerCats = ledger.customerCategories ?? [];
  const allCustomCustomerNames = Array.from(
    new Set([
      ...(prefs.customCustomerCategories ?? []),
      ...customerCats.map(c => c.nameEn),
    ])
  );

  const [showAdd, setShowAdd] = useState(false);
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameUr, setNewNameUr] = useState('');
  const [newKind, setNewKind] = useState<ExpenseKind>('expense');
  const [newIcon, setNewIcon] = useState<IconName>('shopping-bag');
  const [newColor, setNewColor] = useState(CATEGORY_COLOR_CHOICES[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameUr, setEditNameUr] = useState('');
  const [editBudget, setEditBudget] = useState('');

  async function toggleHidden(cat: ExpenseCategory) {
    const next = categories.map(c => (c.id === cat.id ? { ...c, hidden: !c.hidden } : c));
    await saveExpenseCategories(next);
  }

  async function moveCategory(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= categories.length) return;
    const copy = [...categories];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    const reordered = copy.map((c, idx) => ({ ...c, order: idx }));
    await saveExpenseCategories(reordered);
  }

  async function handleAddCustom() {
    const en = newNameEn.trim();
    if (!en) return;
    const ur = newNameUr.trim() || en;
    const next: ExpenseCategory[] = [
      ...categories,
      {
        id: `cat_${newId().slice(0, 8)}`,
        nameEn: en.slice(0, 80),
        nameUr: ur.slice(0, 80),
        kind: newKind,
        icon: newIcon,
        color: newColor,
        order: categories.length,
        isDefault: false,
      },
    ];
    await saveExpenseCategories(next);
    setNewNameEn('');
    setNewNameUr('');
    setShowAdd(false);
  }

  function startEdit(cat: ExpenseCategory) {
    setEditingId(cat.id);
    setEditNameEn(cat.nameEn);
    setEditNameUr(cat.nameUr);
    const b = budgetMap.get(cat.id);
    setEditBudget(b ? String(b / 100) : '');
  }

  async function saveEdit(cat: ExpenseCategory) {
    const en = editNameEn.trim() || cat.nameEn;
    const ur = editNameUr.trim() || cat.nameUr;
    const nextCats = categories.map(c =>
      c.id === cat.id ? { ...c, nameEn: en.slice(0, 80), nameUr: ur.slice(0, 80) } : c
    );
    await saveExpenseCategories(nextCats);

    const parsed = parseAmount(editBudget);
    const nextBudgets = budgets.filter(b => b.categoryId !== cat.id);
    if (parsed && parsed > 0) {
      nextBudgets.push({ categoryId: cat.id, limitPaisa: parsed });
    }
    await saveBudgets(nextBudgets);
    setEditingId(null);
  }

  return (
    <>
      <Header
        title={t('categoriesSection')}
        backTo="/settings"
        actions={
          <button
            type="button"
            className="icon-button"
            aria-label={t('addCustomCategory')}
            title={t('addCustomCategory')}
            onClick={() => setShowAdd(v => !v)}
          >
            <Plus size={20} aria-hidden="true" />
          </button>
        }
      />

      <div className="page-content settings-content">
        {useMode === 'both' && (
          <div className="segmented-control" style={{ marginBottom: '12px' }}>
            <button
              type="button"
              className={`segmented-btn ${sectionTab === 'expenses' ? 'is-active' : ''}`}
              onClick={() => setSectionTab('expenses')}
            >
              {t('expensesSection')}
            </button>
            <button
              type="button"
              className={`segmented-btn ${sectionTab === 'khata' ? 'is-active' : ''}`}
              onClick={() => setSectionTab('khata')}
            >
              {t('khataSection')}
            </button>
          </div>
        )}

        {sectionTab === 'khata' ? (
          <section className="settings-group">
            <h2 className="settings-group-title">{t('khataSection')}</h2>
            <div className="settings-group-card settings-group-card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="custom-chip-inline" style={{ marginTop: 0 }}>
                <input
                  className="form-control-input"
                  value={newCustomerCat}
                  onChange={e => setNewCustomerCat(e.target.value)}
                  maxLength={60}
                  placeholder={t('customCategoryPlaceholder')}
                />
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => {
                    const clean = newCustomerCat.trim();
                    if (!clean) return;
                    addCustomCustomerCategory(clean);
                    void saveCustomerCategories([
                      ...customerCats.filter(c => c.nameEn !== clean),
                      { id: `cc_${clean.toLowerCase().replace(/\W+/g, '_')}`, nameEn: clean, nameUr: clean },
                    ]);
                    setNewCustomerCat('');
                  }}
                >
                  {t('save')}
                </button>
              </div>
              {allCustomCustomerNames.map(name => {
                const cfg = customerCats.find(c => c.nameEn === name);
                const hidden = cfg?.hidden ?? false;
                return (
                  <div key={name} className="setting-row">
                    <span className={hidden ? 'text-muted' : ''}>{name}</span>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={hidden ? t('showCategory') : t('hideCategory')}
                      onClick={() => {
                        const next = [
                          ...customerCats.filter(c => c.nameEn !== name),
                          { id: cfg?.id ?? `cc_${name}`, nameEn: name, nameUr: cfg?.nameUr ?? name, hidden: !hidden },
                        ];
                        void saveCustomerCategories(next);
                      }}
                    >
                      {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <>
        {showAdd && (
          <section className="settings-group">
            <h2 className="settings-group-title">{t('addCustomCategory')}</h2>
            <div className="settings-group-card settings-group-card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="chip-wrap-row">
                <button
                  type="button"
                  className={`choice-chip ${newKind === 'expense' ? 'is-active' : ''}`}
                  onClick={() => setNewKind('expense')}
                >
                  {t('expenseKind')}
                </button>
                <button
                  type="button"
                  className={`choice-chip ${newKind === 'income' ? 'is-active' : ''}`}
                  onClick={() => setNewKind('income')}
                >
                  {t('incomeKind')}
                </button>
              </div>
              <div className="form-field">
                <label htmlFor="cat-en">{t('categoryNameEn')}</label>
                <input
                  id="cat-en"
                  className="form-control-input"
                  value={newNameEn}
                  onChange={e => setNewNameEn(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="form-field">
                <label htmlFor="cat-ur">{t('categoryNameUr')}</label>
                <input
                  id="cat-ur"
                  className="form-control-input"
                  dir="rtl"
                  value={newNameUr}
                  onChange={e => setNewNameUr(e.target.value)}
                  maxLength={80}
                />
              </div>
              <div className="form-field">
                <label>{t('categoryIcon')}</label>
                <div className="chip-wrap-row">
                  {CATEGORY_ICON_CHOICES.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      className={`choice-chip ${newIcon === ic ? 'is-active' : ''}`}
                      aria-label={ic}
                      onClick={() => setNewIcon(ic)}
                    >
                      <ExpenseCategoryIcon name={ic} size={16} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-field">
                <label>{t('categoryColor')}</label>
                <div className="chip-wrap-row">
                  {CATEGORY_COLOR_CHOICES.map(col => (
                    <button
                      key={col}
                      type="button"
                      className={`color-swatch-btn ${newColor === col ? 'is-active' : ''}`}
                      style={{ backgroundColor: col }}
                      aria-label={col}
                      onClick={() => setNewColor(col)}
                    />
                  ))}
                </div>
              </div>
              <button type="button" className="button button-primary" onClick={() => void handleAddCustom()}>
                <Check size={16} aria-hidden="true" />
                <span>{t('save')}</span>
              </button>
            </div>
          </section>
        )}

        <section className="settings-group">
          <div className="settings-group-card">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <button
                    type="button"
                    className="cat-row-title-btn"
                    onClick={() => (editingId === cat.id ? setEditingId(null) : startEdit(cat))}
                  >
                    <span className="cat-icon-badge" style={{ backgroundColor: `${cat.color}18`, color: cat.color }}>
                      <ExpenseCategoryIcon name={cat.icon} size={16} />
                    </span>
                    <span className={cat.hidden ? 'text-muted' : ''} dir="auto">
                      {getCategoryLabel(cat, language)}
                    </span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={t('moveUp')}
                      disabled={idx === 0}
                      onClick={() => void moveCategory(idx, -1)}
                    >
                      <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={t('moveDown')}
                      disabled={idx === categories.length - 1}
                      onClick={() => void moveCategory(idx, 1)}
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={cat.hidden ? t('showCategory') : t('hideCategory')}
                      onClick={() => void toggleHidden(cat)}
                    >
                      {cat.hidden ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                {editingId === cat.id && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '6px' }}>
                    <input
                      className="form-control-input"
                      aria-label={t('categoryNameEn')}
                      value={editNameEn}
                      onChange={e => setEditNameEn(e.target.value)}
                      maxLength={80}
                    />
                    <input
                      className="form-control-input"
                      aria-label={t('categoryNameUr')}
                      dir="rtl"
                      value={editNameUr}
                      onChange={e => setEditNameUr(e.target.value)}
                      maxLength={80}
                    />
                    {cat.kind === 'expense' && (
                      <input
                        className="form-control-input"
                        aria-label={t('budgetLimit')}
                        placeholder={t('budgetLimit')}
                        inputMode="decimal"
                        dir="ltr"
                        value={editBudget}
                        onChange={e => setEditBudget(e.target.value)}
                      />
                    )}
                    <button type="button" className="button button-primary" onClick={() => void saveEdit(cat)}>
                      {t('save')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
          </>
        )}
      </div>
    </>
  );
}
