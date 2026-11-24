import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n';

interface BottomSheetProps {
  title: string;
  children: ReactNode;
  onDismiss: () => void;
  actions?: ReactNode;
}

export function BottomSheet({ title, children, onDismiss, actions }: BottomSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const node = dialog.current!;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    node.showModal();
    closeBtn.current?.focus({ preventScroll: true });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
      }
    }
    node.addEventListener('keydown', handleKeyDown);

    return () => {
      node.removeEventListener('keydown', handleKeyDown);
      node.close();
      document.documentElement.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [onDismiss]);

  return (
    <dialog
      ref={dialog}
      className="modal bottom-sheet-dialog"
      aria-modal="true"
      aria-labelledby={heading}
      onClick={e => {
        if (e.target === dialog.current) onDismiss();
      }}
      onCancel={event => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <div className="bottom-sheet-content">
        <div className="bottom-sheet-header">
          <h2 id={heading} className="bottom-sheet-title">{title}</h2>
          <button
            ref={closeBtn}
            type="button"
            className="icon-button bottom-sheet-close"
            onClick={onDismiss}
            aria-label={t('cancel')}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="bottom-sheet-body">
          {children}
        </div>
        {actions && (
          <div className="bottom-sheet-actions">
            {actions}
          </div>
        )}
      </div>
    </dialog>
  );
}
