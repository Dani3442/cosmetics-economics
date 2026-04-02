import { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface Props {
  label: string;
  tooltip?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  placeholder?: string;
  step?: number;
  max?: number;
  isPercent?: boolean;
  showSlider?: boolean;
}

export function InputGroup({
  label, tooltip, value, onChange, suffix = '₽',
  placeholder, step = 1, max, isPercent, showSlider = true,
}: Props) {
  const [showTip, setShowTip] = useState(false);

  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num >= 0) onChange(num);
    else if (cleaned === '' || cleaned === '0') onChange(0);
  };

  const displayValue = isPercent ? value.toString() : value.toLocaleString('ru-RU');

  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {tooltip && (
          <span
            className="relative cursor-help"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
          >
            <HelpCircle size={13} className="text-gray-400" />
            {showTip && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs bg-gray-900 text-white rounded-lg shadow-lg z-50 w-[240px]">
                {tooltip}
              </span>
            )}
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode={isPercent ? 'decimal' : 'numeric'}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={(e) => { e.target.value = value.toString(); e.target.select(); }}
          onBlur={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="input-field pr-10"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
          {suffix}
        </span>
      </div>
      {showSlider && (
        <input
          type="range"
          min={0}
          max={max ?? (isPercent ? 10 : 5000000)}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider"
        />
      )}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">{children}</h2>;
}

export function SectionCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="card mb-4">
      {title && <SectionTitle>{title}</SectionTitle>}
      {children}
    </div>
  );
}

export function Badge({ children, color = 'gray' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}
