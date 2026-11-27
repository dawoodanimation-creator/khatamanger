import type { ReactNode } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from '../i18n';

export function Header({
  title,
  caption,
  backTo,
  home = false,
  actions,
}: {
  title?: string;
  caption?: string;
  backTo?: string;
  home?: boolean;
  actions?: ReactNode;
}) {
  const { t } = useI18n();

  return (
    <header className="app-header v3-header flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3 flex-1">
        {backTo && (
          <Link to={backTo} className="icon-button back-icon" aria-label={t('back')}>
            <ArrowLeft size={20} strokeWidth={2} />
          </Link>
        )}
        {(caption || title) && (
          <div className="v3-header-titles min-w-0">
            {caption && <span className="v3-header-caption">{caption}</span>}
            {title && (
              <h1 className="header-title min-w-0 truncate" title={title}>
                {title}
              </h1>
            )}
          </div>
        )}
      </div>

      {actions && <div className="header-actions">{actions}</div>}

      {home && (
        <Link
          to="/settings"
          className="icon-button v3-header-circle-btn shrink-0"
          aria-label={t('settings')}
        >
          <Settings size={20} strokeWidth={1.8} />
        </Link>
      )}
    </header>
  );
}
