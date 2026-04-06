import { SectionCard } from '../shared/InputGroup';
import { InputGroup } from '../shared/InputGroup';
import { MonthlyProjection, FullMetrics } from '../../types';
import { fmtCurrency, fmtShort } from '../../utils';
import { useStore } from '../../store';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

export function PnLTab({ projections, metrics }: { projections: MonthlyProjection[]; metrics: FullMetrics }) {
  const { projection, setProjection } = useStore();

  return (
    <div className="space-y-4">
      <SectionCard title="Настройки прогноза">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Период</label>
            <select
              value={projection.months}
              onChange={(e) => setProjection('months', parseInt(e.target.value))}
              className="input-field"
            >
              <option value={6}>6 месяцев</option>
              <option value={12}>12 месяцев</option>
              <option value={24}>24 месяца</option>
            </select>
          </div>
          <InputGroup
            label="Рост трафика/мес"
            tooltip="Ежемесячный рост трафика в %"
            value={projection.trafficGrowthPercent}
            onChange={(v) => setProjection('trafficGrowthPercent', v)}
            suffix="%" isPercent step={0.5} max={50} showSlider={false}
          />
          <InputGroup
            label="Рост конверсии/мес"
            tooltip="Ежемесячное улучшение конверсии в %"
            value={projection.conversionImprovementPercent}
            onChange={(v) => setProjection('conversionImprovementPercent', v)}
            suffix="%" isPercent step={0.5} max={20} showSlider={false}
          />
          <InputGroup
            label="Налог"
            tooltip="Ставка налога (УСН 6%, ОСН 20% и т.д.)"
            value={projection.taxRatePercent}
            onChange={(v) => setProjection('taxRatePercent', v)}
            suffix="%" isPercent step={1} max={40} showSlider={false}
          />
        </div>
      </SectionCard>

      <SectionCard title="График P&L">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={projections} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} label={{ value: 'Месяц', position: 'insideBottom', offset: -2, fontSize: 10 }} />
            <YAxis tickFormatter={(v) => fmtShort(v)} tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: number) => fmtCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="revenue" name="Выручка" stroke="#6366f1" fill="#6366f1" fillOpacity={0.08} strokeWidth={2} />
            <Area type="monotone" dataKey="grossProfit" name="Вал. прибыль" stroke="#10b981" fill="#10b981" fillOpacity={0.08} strokeWidth={1.5} />
            <Area type="monotone" dataKey="netProfit" name="Чист. прибыль" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.08} strokeWidth={2} />
            <Area type="monotone" dataKey="cumulativeCash" name="Накопл. кэш" stroke="#ef4444" fill="none" strokeWidth={2} strokeDasharray="5 5" />
          </AreaChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard title="Таблица P&L по месяцам">
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                <th className="text-left py-2 px-2 font-medium sticky left-0 bg-white dark:bg-gray-800">Мес.</th>
                <th className="text-right py-2 px-2 font-medium">Трафик</th>
                <th className="text-right py-2 px-2 font-medium">Заказы</th>
                <th className="text-right py-2 px-2 font-medium">Выручка</th>
                <th className="text-right py-2 px-2 font-medium">Себест.</th>
                <th className="text-right py-2 px-2 font-medium">Вал. прибыль</th>
                <th className="text-right py-2 px-2 font-medium">Маркетинг</th>
                <th className="text-right py-2 px-2 font-medium">Пост. расх.</th>
                <th className="text-right py-2 px-2 font-medium">Опер. прибыль</th>
                <th className="text-right py-2 px-2 font-medium">Налог</th>
                <th className="text-right py-2 px-2 font-medium">Чист. прибыль</th>
                <th className="text-right py-2 px-2 font-medium">Накопл.</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((p) => (
                <tr key={p.month} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-1.5 px-2 font-medium sticky left-0 bg-white dark:bg-gray-800">{p.month}</td>
                  <td className="py-1.5 px-2 text-right">{fmtShort(p.traffic)}</td>
                  <td className="py-1.5 px-2 text-right">{fmtShort(p.orders)}</td>
                  <td className="py-1.5 px-2 text-right">{fmtShort(p.revenue)}</td>
                  <td className="py-1.5 px-2 text-right">{fmtShort(p.cogs)}</td>
                  <td className="py-1.5 px-2 text-right">{fmtShort(p.grossProfit)}</td>
                  <td className="py-1.5 px-2 text-right">{fmtShort(p.marketing)}</td>
                  <td className="py-1.5 px-2 text-right">{fmtShort(p.fixedCosts)}</td>
                  <td className={`py-1.5 px-2 text-right font-medium ${p.operatingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmtShort(p.operatingProfit)}
                  </td>
                  <td className="py-1.5 px-2 text-right">{fmtShort(p.tax)}</td>
                  <td className={`py-1.5 px-2 text-right font-medium ${p.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmtShort(p.netProfit)}
                  </td>
                  <td className={`py-1.5 px-2 text-right font-medium ${p.cumulativeCash >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {fmtShort(p.cumulativeCash)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Ключевые показатели прогноза">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <StatBlock label="Стартовые вложения" value={fmtCurrency(metrics.totalStartupCost)} />
          <StatBlock label="Cash burn/мес" value={metrics.cashBurnMonthly > 0 ? fmtCurrency(metrics.cashBurnMonthly) : '—'} warn={metrics.cashBurnMonthly > 0} />
          <StatBlock label="Cash runway" value={metrics.cashRunwayMonths ? `${metrics.cashRunwayMonths} мес.` : '—'} warn={metrics.cashRunwayMonths !== null && metrics.cashRunwayMonths < 6} />
          <StatBlock label="Окупаемость" value={metrics.paybackMonths ? `${metrics.paybackMonths} мес.` : 'Не окупается'} warn={metrics.paybackMonths === null} />
        </div>
      </SectionCard>
    </div>
  );
}

function StatBlock({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${warn ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`font-semibold ${warn ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}
