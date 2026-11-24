import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { MoreVertical } from 'lucide-react';

export interface MoreMenuItem {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick?: () => void;
  to?: string;
}

export interface MoreMenuProps {
  items: MoreMenuItem[];
  ariaLabel?: string;
}

export function MoreMenu({ items, ariaLabel = 'More options' }: MoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="more-menu-container" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button more-menu-trigger"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <MoreVertical size={20} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="more-menu-dropdown open">
          {items.map((item, idx) => {
            const className = `more-menu-item ${item.danger ? 'more-menu-item-danger' : ''}`;
            if (item.to) {
              return (
                <Link
                  key={idx}
                  to={item.to}
                  className={className}
                  onClick={() => {
                    setIsOpen(false);
                    triggerRef.current?.focus();
                  }}
                >
                  {item.icon && <span className="more-menu-item-icon" aria-hidden="true">{item.icon}</span>}
                  <span>{item.label}</span>
                </Link>
              );
            }
            return (
              <button
                key={idx}
                type="button"
                className={className}
                onClick={() => {
                  setIsOpen(false);
                  triggerRef.current?.focus();
                  item.onClick?.();
                }}
              >
                {item.icon && <span className="more-menu-item-icon" aria-hidden="true">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
