import { Link, useLocation } from 'react-router';
import { BookOpen, ReceiptText, Settings } from 'lucide-react';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';

export function BottomNav() {
  const { t } = useI18n();
  const { ledger } = useLedger();
  const { pathname } = useLocation();

  const useMode = ledger.settings.useMode ?? 'both';
  const showKhata = useMode !== 'expenses';
  const showExpenses = useMode !== 'khata';

  const isKhata = pathname === '/' || pathname === '/summary';
  const isExpenses = pathname === '/expenses' || pathname === '/expenses/reports';
  const isSettings = pathname === '/settings';

  const cols = showKhata && showExpenses ? 3 : 2;

  return (
    <nav
      className="bottom-nav v3-bottom-nav"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      aria-label="Main navigation"
    >
      {showKhata && (
        <Link
          to="/"
          className={`bottom-nav-item ${isKhata ? 'is-active' : ''}`}
          aria-current={isKhata ? 'page' : undefined}
        >
          <span className="v3-nav-pill">
            <BookOpen size={20} aria-hidden="true" />
          </span>
          <span>{t('navKhata')}</span>
        </Link>
      )}
      {showExpenses && (
        <Link
          to="/expenses"
          className={`bottom-nav-item ${isExpenses ? 'is-active' : ''}`}
          aria-current={isExpenses ? 'page' : undefined}
        >
          <span className="v3-nav-pill">
            <ReceiptText size={20} aria-hidden="true" />
          </span>
          <span>{t('navExpenses')}</span>
        </Link>
      )}
      <Link
        to="/settings"
        className={`bottom-nav-item ${isSettings ? 'is-active' : ''}`}
        aria-current={isSettings ? 'page' : undefined}
      >
        <span className="v3-nav-pill">
          <Settings size={20} aria-hidden="true" />
        </span>
        <span>{t('navSettings')}</span>
      </Link>
    </nav>
  );
}
