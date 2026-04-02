import { SectionCard, Badge } from '../shared/InputGroup';
import { FullMetrics } from '../../types';
import { fmtCurrency, fmtPercent } from '../../utils';
import { useStore } from '../../store';

export function UnitEconomicsTab({ metrics: m }: { metrics: FullMetrics }) {
  const { params } = useStore();

  const rows = [
    { label: 'Выручка на заказ', value: params.averageCheck, fmt: fmtCurrency },
    { label: 'Себестоимость товара', value: -params.costPerOrder, fmt: fmtCurrency },
    { label: 'Переменные расходы', value: -params.variableCostPerOrder, fmt: fmtCurrency },
    ...(m.hasWarehouseDetail ? [
      { label: 'Фулфилмент (сборка+упаковка+доставка)', value: -m.fulfillmentCostPerOrder, fmt: fmtCurrency },
    ] : []),
    { label: 'Маркетинг на заказ (CAC)', value: -m.cac, fmt: fmtCurrency },
    ...(m.returnCost > 0 ? [
      { label: 'Возвраты на заказ', value: -(m.returnCost / Math.max(m.effectiveOrders, 1)), fmt: fmtCurrency },
    ] : []),
  ];

  const totalPerOrder = rows.reduce((s, r) => s + r.value, 0);
  const fixedPerOrder = m.effectiveOrders > 0
    ? (m.hasDetailedExpenses ? m.detailedMonthlyCosts + m.totalTeamCost : params.fixedCosts) / m.effectiveOrders
    : 0;

  return (
    <div className="space-y-4">
      <SectionCard title="Юнит-экономика — водопад по заказу">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 text-gray-600 dark:text-gray-400 font-medium">Показатель</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-400 font-medium">На заказ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-700 dark:text-gray-300">{r.label}</td>
                  <td className={`py-2 text-right font-medium ${r.value < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {fmtCurrency(r.value)}
                  </td>
                </tr>
              ))}
              <tr className="border-b-2 border-gray-300 dark:border-gray-500 font-bold">
                <td className="py-2">Contribution Margin</td>
                <td className={`py-2 text-right ${totalPerOrder >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmtCurrency(totalPerOrder)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <td className="py-2 text-gray-700 dark:text-gray-300">Постоянные расходы на заказ</td>
                <td className="py-2 text-right font-medium text-red-600">{fmtCurrency(-fixedPerOrder)}</td>
              </tr>
              <tr className="font-bold text-base">
                <td className="py-3">Прибыль на заказ</td>
                <td className={`py-3 text-right ${m.profitPerOrder >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmtCurrency(m.profitPerOrder)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {m.profitPerOrder < 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
            Каждый заказ приносит убыток {fmtCurrency(Math.abs(m.profitPerOrder))}. Модель не может масштабироваться.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Ключевые метрики">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricBlock label="Contribution Margin" value={fmtCurrency(m.contributionMargin)} sub={fmtPercent(m.contributionMarginPercent)} warn={m.contributionMargin < 0} />
          <MetricBlock label="Валовая маржа" value={fmtPercent(m.grossMarginPercent)} warn={m.grossMarginPercent < 30} />
          <MetricBlock label="CAC" value={fmtCurrency(m.cac)} />
          <MetricBlock label="ROMI" value={fmtPercent(m.romi, 0)} warn={m.romi < 0} />
          {m.hasLTVData && (
            <>
              <MetricBlock label="LTV" value={fmtCurrency(m.ltv)} />
              <MetricBlock label="LTV/CAC" value={m.ltvCacRatio.toFixed(1)} warn={m.ltvCacRatio < 3} />
              <MetricBlock label="Прибыль 1-го заказа" value={fmtCurrency(m.firstOrderProfit)} warn={m.firstOrderProfit < 0} />
            </>
          )}
        </div>
      </SectionCard>

      {m.requiredAvgCheck !== null && m.requiredConversion !== null && (
        <SectionCard title="Для выхода в безубыточность нужно">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricBlock label="Заказов" value={m.breakEvenOrders !== null ? String(m.breakEvenOrders) : '—'} />
            <MetricBlock label="Трафик" value={m.breakEvenTraffic !== null ? String(m.breakEvenTraffic) : '—'} />
            <MetricBlock label="Конверсия" value={m.requiredConversion !== null ? fmtPercent(m.requiredConversion) : '—'} />
            <MetricBlock label="Средний чек" value={m.requiredAvgCheck !== null ? fmtCurrency(m.requiredAvgCheck) : '—'} />
            <MetricBlock label="Выручка" value={m.breakEvenRevenue !== null ? fmtCurrency(m.breakEvenRevenue) : '—'} />
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function MetricBlock({ label, value, sub, warn }: { label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${warn ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`font-semibold ${warn ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}
