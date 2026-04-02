import { useStore } from '../../store';
import { InputGroup, SectionCard, Badge } from '../shared/InputGroup';
import { FullMetrics } from '../../types';
import { fmtCurrency } from '../../utils';

export function LTVTab({ metrics: m }: { metrics: FullMetrics }) {
  const { ltv, setLtv } = useStore();

  const fields: { key: keyof typeof ltv; label: string; tooltip: string; suffix: string; step: number; max?: number; isPercent?: boolean }[] = [
    { key: 'repeatPurchaseRatePercent', label: 'Доля возвращающихся клиентов', tooltip: 'Какой % клиентов делает повторную покупку. Норма для косметики: 25–40%', suffix: '%', step: 1, max: 100, isPercent: true },
    { key: 'avgOrdersPerCustomerPerYear', label: 'Заказов в год на клиента', tooltip: 'Среднее количество заказов одного клиента за год', suffix: 'шт.', step: 0.5, max: 20, isPercent: true },
    { key: 'customerLifetimeMonths', label: 'Срок жизни клиента', tooltip: 'Сколько месяцев клиент остаётся активным', suffix: 'мес.', step: 1, max: 60, isPercent: true },
    { key: 'repeatOrderAvgCheck', label: 'Средний чек повторного заказа', tooltip: 'Сумма повторного заказа (часто ниже первого)', suffix: '₽', step: 100 },
  ];

  const isFilled = ltv.repeatPurchaseRatePercent > 0;

  return (
    <div className="space-y-4">
      <SectionCard title="Повторные продажи и LTV">
        <div className="flex items-center gap-2 mb-4">
          <Badge color={isFilled ? 'green' : 'gray'}>{isFilled ? 'LTV учитывается' : 'Заполните для учёта LTV'}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <InputGroup
              key={f.key}
              label={f.label}
              tooltip={f.tooltip}
              value={ltv[f.key]}
              onChange={(v) => setLtv(f.key, v)}
              suffix={f.suffix}
              step={f.step}
              max={f.max}
              isPercent={f.isPercent}
            />
          ))}
        </div>
      </SectionCard>

      {isFilled && (
        <SectionCard title="Расчёт LTV">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <Stat label="LTV (прибыль за жизнь клиента)" value={fmtCurrency(m.ltv)} highlight />
            <Stat label="CAC" value={fmtCurrency(m.cac)} />
            <Stat label="LTV/CAC" value={m.ltvCacRatio.toFixed(1)} highlight={m.ltvCacRatio >= 3} warn={m.ltvCacRatio < 3} />
            <Stat label="Прибыль 1-го заказа" value={fmtCurrency(m.firstOrderProfit)} warn={m.firstOrderProfit < 0} />
            <Stat label="Повторная выручка/мес" value={fmtCurrency(m.repeatRevenue)} />
            <Stat label="Повторных клиентов/мес" value={String(m.repeatCustomers)} />
          </div>

          {m.firstOrderProfit < 0 && m.ltv > m.cac && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
              Первый заказ убыточен, но CAC окупается за счёт повторных покупок. LTV ({fmtCurrency(m.ltv)}) {'>'} CAC ({fmtCurrency(m.cac)}).
            </div>
          )}

          {m.ltvCacRatio < 3 && m.ltvCacRatio > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              LTV/CAC = {m.ltvCacRatio.toFixed(1)} — ниже нормы (3+). Увеличьте повторные покупки или снизьте CAC.
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

function Stat({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${warn ? 'bg-red-50 dark:bg-red-900/20' : highlight ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`font-semibold ${warn ? 'text-red-600' : highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}
