import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { SectionCard } from '../shared/InputGroup';
import { useStore } from '../../store';
import { calculateScenario } from '../../calculations';
import { scenarios } from '../../defaults';
import { fmtCurrency, fmtPercent, fmtShort, fmt } from '../../utils';

export function ScenariosTab() {
  const store = useStore();
  const data = useMemo(() => scenarios.map((s) => ({ ...s, m: calculateScenario(store.params, s.multipliers, store.revenue, store.marketing, store.ltv, store.warehouse, store.oneTimeExpenses, store.monthlyExpenses, store.teamMembers, store.projection) })), [store]);
  const chartData = data.map((s) => ({ name: s.label, 'Выручка': s.m.revenue, 'Расходы': s.m.totalCosts, 'Чистая прибыль': s.m.netProfit }));
  return (
    <div className="space-y-4">
      <SectionCard title="Сравнение сценариев">
        <ResponsiveContainer width="100%" height={300}><BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tickFormatter={(v) => fmtShort(v)} tick={{ fontSize: 10 }} /><Tooltip formatter={(v: number) => fmtCurrency(v)} /><Legend wrapperStyle={{ fontSize: 11 }} /><Bar dataKey="Выручка" fill="#6366f1" radius={[4, 4, 0, 0]} /><Bar dataKey="Расходы" fill="#f97316" radius={[4, 4, 0, 0]} /><Bar dataKey="Чистая прибыль" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
      </SectionCard>
      <SectionCard title="Детализация сценариев">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"><th className="text-left py-2 px-3 font-medium">Показатель</th>{data.map((s) => <th key={s.name} className="text-right py-2 px-3 font-medium">{s.label}</th>)}</tr></thead><tbody>
          <TRow label="Трафик" values={data.map((s) => fmt(Math.round(store.params.traffic * (s.multipliers.traffic ?? 1))))} />
          <TRow label="Конверсия" values={data.map((s) => fmtPercent(store.params.conversionPercent * (s.multipliers.conversionPercent ?? 1)))} />
          <TRow label="Средний чек" values={data.map((s) => fmtCurrency(store.params.averageCheck * (s.multipliers.averageCheck ?? 1)))} />
          <TRow label="Заказы" values={data.map((s) => fmt(s.m.effectiveOrders))} />
          <TRow label="Выручка" values={data.map((s) => fmtCurrency(s.m.revenue))} />
          <TRow label="Маркетинг" values={data.map((s) => fmtCurrency(s.m.effectiveMarketingBudget))} />
          <TRow label="Расходы всего" values={data.map((s) => fmtCurrency(s.m.totalCosts))} />
          <TRow label="Валовая маржа" values={data.map((s) => fmtPercent(s.m.grossMarginPercent))} />
          <TRow label="Операц. прибыль" values={data.map((s) => fmtCurrency(s.m.operatingProfit))} colors={data.map((s) => s.m.operatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600')} />
          <TRow label="Чистая прибыль" values={data.map((s) => fmtCurrency(s.m.netProfit))} colors={data.map((s) => s.m.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600')} bold />
          <TRow label="Прибыль/заказ" values={data.map((s) => fmtCurrency(s.m.profitPerOrder))} colors={data.map((s) => s.m.profitPerOrder >= 0 ? 'text-emerald-600' : 'text-red-600')} />
          <TRow label="CAC" values={data.map((s) => fmtCurrency(s.m.cac))} />
          <TRow label="ROMI" values={data.map((s) => fmtPercent(s.m.romi, 0))} />
          <TRow label="БУ заказы" values={data.map((s) => s.m.breakEvenOrders !== null ? fmt(s.m.breakEvenOrders) : '—')} />
          <TRow label="Окупаемость" values={data.map((s) => s.m.paybackMonths !== null ? `${s.m.paybackMonths} мес.` : '—')} />
        </tbody></table></div>
      </SectionCard>
      <SectionCard title="Параметры сценариев"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{data.map((s) => <div key={s.name} className={`p-3 rounded-lg border ${s.name === 'pessimistic' ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : s.name === 'optimistic' ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-gray-700'}`}><h4 className="font-medium text-sm mb-2 text-gray-800 dark:text-gray-200">{s.label}</h4><div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">{Object.entries(s.multipliers).map(([key, val]) => <div key={key} className="flex justify-between"><span>{keyLabels[key] || key}</span><span className={`font-medium ${val > 1 ? (key === 'costPerOrder' || key === 'marketingBudget' ? 'text-red-600' : 'text-emerald-600') : val < 1 ? (key === 'costPerOrder' || key === 'marketingBudget' ? 'text-emerald-600' : 'text-red-600') : ''}`}>{val > 1 ? '+' : ''}{Math.round((val - 1) * 100)}%</span></div>)}</div></div>)}</div></SectionCard>
    </div>
  );
}

const keyLabels: Record<string, string> = { traffic: 'Трафик', conversionPercent: 'Конверсия', averageCheck: 'Средний чек', costPerOrder: 'Себестоимость', marketingBudget: 'Маркетинг' };
function TRow({ label, values, colors, bold }: { label: string; values: string[]; colors?: string[]; bold?: boolean }) {
  return <tr className="border-b border-gray-100 dark:border-gray-700"><td className={`py-2 px-3 text-gray-700 dark:text-gray-300 ${bold ? 'font-bold' : ''}`}>{label}</td>{values.map((v, i) => <td key={i} className={`py-2 px-3 text-right ${bold ? 'font-bold' : 'font-medium'} ${colors?.[i] || 'text-gray-900 dark:text-white'}`}>{v}</td>)}</tr>;
}
