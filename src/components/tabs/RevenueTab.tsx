import { useStore } from '../../store';
import { InputGroup, SectionCard, Badge } from '../shared/InputGroup';

export function RevenueTab() {
  const { revenue, setRevenue } = useStore();

  const fields: { key: keyof typeof revenue; label: string; tooltip: string; suffix: string; step: number; max?: number; isPercent?: boolean }[] = [
    { key: 'skuCount', label: 'Количество SKU', tooltip: 'Сколько товарных позиций в каталоге', suffix: 'шт.', step: 10, max: 10000 },
    { key: 'avgProductPrice', label: 'Средняя цена товара', tooltip: 'Средняя цена одного товара (не путать со средним чеком)', suffix: '₽', step: 100 },
    { key: 'avgItemsPerOrder', label: 'Товаров в заказе', tooltip: 'Среднее количество товаров в одном заказе', suffix: 'шт.', step: 0.5, max: 20, isPercent: true },
    { key: 'discountSharePercent', label: 'Доля заказов со скидкой', tooltip: 'Какой % заказов содержит скидку', suffix: '%', step: 1, max: 100, isPercent: true },
    { key: 'avgDiscountPercent', label: 'Средний размер скидки', tooltip: 'Средний процент скидки на заказ', suffix: '%', step: 1, max: 100, isPercent: true },
    { key: 'cancelRatePercent', label: 'Процент отмен', tooltip: 'Доля заказов, которые отменяются до отправки', suffix: '%', step: 0.5, max: 50, isPercent: true },
    { key: 'returnRatePercent', label: 'Процент возвратов', tooltip: 'Доля заказов, которые возвращают клиенты. Норма для косметики: 3–8%', suffix: '%', step: 0.5, max: 50, isPercent: true },
  ];

  const isFilled = Object.values(revenue).some(v => v > 0);

  return (
    <div className="space-y-4">
      <SectionCard title="Выручка — расширенные параметры">
        <div className="flex items-center gap-2 mb-4">
          <Badge color={isFilled ? 'green' : 'gray'}>{isFilled ? 'Данные заполнены' : 'Необязательные поля'}</Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">Если не заполнены — расчёт по базовой модели</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <InputGroup
              key={f.key}
              label={f.label}
              tooltip={f.tooltip}
              value={revenue[f.key]}
              onChange={(v) => setRevenue(f.key, v)}
              suffix={f.suffix}
              step={f.step}
              max={f.max}
              isPercent={f.isPercent}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
