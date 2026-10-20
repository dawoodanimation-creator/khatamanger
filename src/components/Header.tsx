import type { ReactNode } from 'react';
import { ArrowLeft, BookOpen, Settings } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../i18n';
export function Header({ title, backTo, home = false, actions }: { title: string; backTo?: string; home?: boolean; actions?: ReactNode }) {
  const { t } = useI18n();
  return <header className="app-header flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-3">
      {backTo ? <Link to={backTo} className="icon-button back-icon" aria-label={t('back')}><ArrowLeft /></Link>
        : <span className="brand-mark"><BookOpen strokeWidth={1.7} /></span>}
      <h1 className="min-w-0 break-words">{title}</h1>
    </div>
    {actions && <div className="header-actions">{actions}</div>}
    {home && <Link to="/settings" className="icon-button shrink-0" aria-label={t('settings')}><Settings strokeWidth={1.7} /></Link>}
  </header>;
}
