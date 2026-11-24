import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useI18n } from '../i18n';
interface ModalProps { title: string; children: ReactNode; onDismiss: () => void; actions?: ReactNode }
export function Modal({ title, children, onDismiss, actions }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const cancel = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();
  useEffect(() => {
    const node = dialog.current!;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    node.showModal();
    cancel.current?.focus({ preventScroll: true });
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
  return <dialog ref={dialog} className="modal" aria-modal="true" aria-labelledby={heading} onCancel={event => { event.preventDefault(); onDismiss(); }}>
    <div className="modal-body"><h2 id={heading}>{title}</h2>{children}
      <div className="modal-actions"><button ref={cancel} className="button button-secondary" type="button" onClick={onDismiss}>{t('cancel')}</button>{actions}</div>
    </div>
  </dialog>;
}
