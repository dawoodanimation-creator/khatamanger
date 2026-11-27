import { Link, useLocation } from 'react-router';
import { BookOpen, ReceiptText, Settings } from 'lucide-react';
import { useI18n } from '../i18n';

export function BottomNav() {
  const { t } = useI18n();
  const { pathname } = useLocation();

  const isKhata = pathname === '/' || pathname === '/summary';
  const isExpenses = pathname === '/expenses' || pathname === '/expenses/reports';
  const isSettings = pathname === '/settings';

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <Link
        to="/"
        className={`bottom-nav-item ${isKhata ? 'is-active' : ''}`}
        aria-current={isKhata ? 'page' : undefined}
      >
        <BookOpen size={20} aria-hidden="true" />
        <span>{t('navKhata')}</span>
      </Link>
      <Link
        to="/expenses"
        className={`bottom-nav-item ${isExpenses ? 'is-active' : ''}`}
        aria-current={isExpenses ? 'page' : undefined}
      >
        <ReceiptText size={20} aria-hidden="true" />
        <span>{t('navExpenses')}</span>
      </Link>
      <Link
        to="/settings"
        className={`bottom-nav-item ${isSettings ? 'is-active' : ''}`}
        aria-current={isSettings ? 'page' : undefined}
      >
        <Settings size={20} aria-hidden="true" />
        <span>{t('navSettings')}</span>
      </Link>
    </nav>
  );
}
