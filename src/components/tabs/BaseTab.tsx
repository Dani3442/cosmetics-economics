import { useStore } from '../../store';
import { baseInputFields } from '../../defaults';
import { InputGroup, SectionCard } from '../shared/InputGroup';

export function BaseTab() {
  const { params, setParam } = useStore();

  return (
    <SectionCard title="Базовые параметры">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Основные параметры модели. Эти данные обязательны для расчёта.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {baseInputFields.map((f) => (
          <InputGroup
            key={f.key}
            label={f.label}
            tooltip={f.tooltip}
            value={params[f.key]}
            onChange={(v) => setParam(f.key, v)}
            suffix={f.suffix}
            placeholder={f.placeholder}
            step={f.step}
            isPercent={f.isPercent}
          />
        ))}
      </div>
    </SectionCard>
  );
}
