import { useI18n } from '../i18n';

export type CustomerFilter = 'all' | 'receive' | 'pay' | 'settled';

interface FilterChipsProps {
  current: CustomerFilter;
  onChange: (filter: CustomerFilter) => void;
  counts: {
    all: number;
    receive: number;
    pay: number;
    settled: number;
  };
}

export function FilterChips({ current, onChange, counts }: FilterChipsProps) {
  const { t } = useI18n();

  const chips: Array<{ id: CustomerFilter; label: string; count: number }> = [
    { id: 'all', label: t('filterAll'), count: counts.all },
    { id: 'receive', label: t('filterReceive'), count: counts.receive },
    { id: 'pay', label: t('filterPay'), count: counts.pay },
    { id: 'settled', label: t('filterSettled'), count: counts.settled },
  ];

  return (
    <div className="filter-chips-container" role="radiogroup" aria-label="Customer filters">
      <div className="filter-tabs-row">
        {chips.map(chip => {
          const isActive = current === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              className={`filter-tab-btn ${isActive ? 'filter-tab-active' : ''}`}
              onClick={() => onChange(chip.id)}
            >
              <span className="filter-tab-label">{chip.label}</span>
              <span className="filter-tab-count">{chip.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
