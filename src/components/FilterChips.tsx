import { useI18n } from '../i18n';

export type CustomerFilter = 'all' | 'receive' | 'pay' | 'settled' | 'overdue';

interface FilterChipsProps {
  current: CustomerFilter;
  onChange: (filter: CustomerFilter) => void;
  counts: {
    all: number;
    receive: number;
    pay: number;
    settled: number;
    overdue?: number;
  };
}

export function FilterChips({ current, onChange, counts }: FilterChipsProps) {
  const { t } = useI18n();

  const chips: Array<{ id: CustomerFilter; label: string; count: number }> = [
    { id: 'all', label: t('filterAll'), count: counts.all },
    { id: 'receive', label: t('filterReceive'), count: counts.receive },
    { id: 'pay', label: t('filterPay'), count: counts.pay },
    ...(typeof counts.overdue === 'number'
      ? [{ id: 'overdue' as const, label: t('filterOverdue'), count: counts.overdue }]
      : []),
    { id: 'settled', label: t('filterSettled'), count: counts.settled },
  ];

  return (
    <div className="v3-filter-scroll" role="radiogroup" aria-label="Customer filters">
      {chips.map(chip => {
        const isActive = current === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={`v3-pill-btn ${isActive ? 'is-active v3-pill-bounce' : ''}`}
            onClick={() => onChange(chip.id)}
          >
            <span>{chip.label}</span>
            <span className="v3-pill-count">{chip.count}</span>
          </button>
        );
      })}
    </div>
  );
}
