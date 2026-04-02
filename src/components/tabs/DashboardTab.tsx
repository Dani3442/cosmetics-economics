import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import {
  ShoppingCart, DollarSign, TrendingUp, TrendingDown, Target,
  Users, Clock, Percent, ArrowUpRight, Repeat, Zap, Wallet,
  AlertTriangle, AlertCircle, Info, CheckCircle,
} from 'lucide-react';
import { FullMetrics, MonthlyProjection, Recommendation } from '../../types';
import { useStore } from '../../store';
import { sensitivityData, breakEvenChartData, calculateScenario } from '../../calculations';
import { fmt, fmtCurrency, fmtPercent, fmtShort } from '../../utils';
import { scenarios } from '../../defaults';
import { Badge } from '../shared/InputGroup';

const fmtAxis = (v: number) => fmtShort(v);
const fmtTip = (v: number) => fmtCurrency(v);

interface Props {
  metrics: FullMetrics;
  projections: MonthlyProjection[];
  recommendations: Recommendation[];
}

export function DashboardTab({ metrics: m, projections, recommendations }: Props) {
  const store = useStore();

  const scenarioData = useMemo(() =>
    scenarios.map((s) => ({
      ...s,
      m: calculateScenario(store.params, s.multipliers, store.revenue, store.marketing, store.ltv, store.warehouse, store.oneTimeExpenses, store.monthlyExpenses, store.teamMembers, store.projection),
    })),
    [store],
  );

  return (
    <div className="space-y-5">
      <StatusBanner m={m} />
      <KPIGrid m={m} />
      {m.hasDetailedExpenses || m.hasLTVData || m.hasMarketingDetail ? (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge color="blue">Расширенная модель</Badge>
          {m.hasLTVData && <Badge color="green">LTV учтён</Badge>}
          {m.hasDetailedExpenses && <Badge color="green">Детальные расходы</Badge>}
          {m.hasWarehouseDetail && <Badge color="green">Склад учтён</Badge>}
        </div>
      ) : (
        <Badge color="gray">Базовая модель — заполните вкладки для точности</Badge>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <RevenueExpensesChart m={m} params={store.params} />
        <ProjectionChart projections={projections} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <SensitivityChart params={store.params} />
        <BreakEvenChart params={store.params} />
      </div>
      <RecommendationsBlock items={recommendations} />
      <SummaryTable m={m} />
      <ScenarioComparison data={scenarioData} />
    </div>
  );
}

function StatusBanner({ m }: { m: FullMetrics }) {
  const bg = m.isProfitable
    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800';
  const color = m.isProfitable ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300';
  const Icon = m.isProfitable ? TrendingUp : TrendingDown;

  return (
    <div className={`rounded-xl border-2 p-5 flex items-center gap-4 ${bg}`}>
      <Icon size={32} className={color} />
      <div>
        <p className={`text-sm font-medium ${color}`}>{m.isProfitable ? 'Магазин прибыльный' : 'Магазин убыточный'}</p>
        <p className={`text-3xl font-bold ${color}`}>{fmtCurrency(Math.abs(m.netProfit))}<span className="text-base font-normal"> /мес</span></p>
      </div>
      {m.paybackMonths !== null && (
        <div className="ml-auto text-right">
          <p className="text-xs text-gray-500 dark:text-gray-400">Окупаемость</p>
          <p className={`text-xl font-bold ${color}`}>{m.paybackMonths} мес.</p>
        </div>
      )}
    </div>
  );
}

function KPIGrid({ m }: { m: FullMetrics }) {
  const cards = [
    { label: 'Заказы/мес', value: fmt(m.effectiveOrders), icon: <ShoppingCart size={16} /> },
    { label: 'Выручка', value: fmtCurrency(m.effectiveRevenue), icon: <DollarSign size={16} /> },
    { label: 'Валовая прибыль', value: fmtCurrency(m.grossProfit), icon: <TrendingUp size={16} /> },
    { label: 'Валовая маржа', value: fmtPercent(m.grossMarginPercent), icon: <Percent size={16} />, warn: m.grossMarginPercent < 30 },
    { label: 'Операц. прибыль', value: fmtCurrency(m.operatingProfit), icon: <TrendingUp size={16} />, warn: m.operatingProfit < 0 },
    { label: 'Чистая прибыль', value: fmtCurrency(m.netProfit), icon: <Zap size={16} />, warn: m.netProfit < 0 },
    { label: 'Прибыль/заказ', value: fmtCurrency(m.profitPerOrder), icon: <ArrowUpRight size={16} />, warn: m.profitPerOrder < 0 },
    { label: 'CAC', value: fmtCurrency(m.cac), icon: <Users size={16} /> },
    { label: 'LTV', value: m.hasLTVData ? fmtCurrency(m.ltv) : '—', icon: <Repeat size={16} /> },
    { label: 'LTV/CAC', value: m.hasLTVData ? m.ltvCacRatio.toFixed(1) : '—', icon: <Target size={16} />, warn: m.hasLTVData && m.ltvCacRatio < 3 },
    { label: 'ROMI', value: fmtPercent(m.romi, 0), icon: <TrendingUp size={16} /> },
    { label: 'БУ заказы', value: m.breakEvenOrders !== null ? fmt(m.breakEvenOrders) : '—', icon: <Target size={16} /> },
    { label: 'БУ трафик', value: m.breakEvenTraffic !== null ? fmt(m.breakEvenTraffic) : '—', icon: <Users size={16} /> },
    { label: 'БУ выручка', value: m.breakEvenRevenue !== null ? fmtCurrency(m.breakEvenRevenue) : '—', icon: <DollarSign size={16} /> },
    { label: 'Стартовый бюджет', value: fmtCurrency(m.totalStartupCost), icon: <Wallet size={16} /> },
    { label: 'Обор. средства', value: fmtCurrency(m.workingCapitalNeed), icon: <Wallet size={16} /> },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className={`card-compact ${c.warn ? 'border-amber-300 dark:border-amber-600' : ''}`}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-gray-400">{c.icon}</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{c.label}</span>
          </div>
          <p className={`text-base font-semibold ${c.warn ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
            {c.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function RevenueExpensesChart({ m, params }: { m: FullMetrics; params: any }) {
  const data = [
    { name: 'Выручка', value: m.effectiveRevenue, fill: '#6366f1' },
    { name: 'Себестоимость', value: m.cogs, fill: '#f97316' },
    { name: 'Маркетинг', value: params.marketingBudget, fill: '#ef4444' },
    { name: 'Переменные', value: m.totalVariableCosts, fill: '#f59e0b' },
    { name: 'Постоянные', value: m.hasDetailedExpenses ? m.detailedMonthlyCosts + m.totalTeamCost : params.fixedCosts, fill: '#8b5cf6' },
    { name: 'Прибыль', value: m.netProfit, fill: m.netProfit >= 0 ? '#10b981' : '#ef4444' },
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Выручка и расходы</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: number) => fmtTip(v)} />
          <Bar dataKey="value" name="Сумма" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ProjectionChart({ projections }: { projections: MonthlyProjection[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Прогноз по месяцам</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={projections} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: number) => fmtTip(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="revenue" name="Выручка" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} strokeWidth={2} />
          <Area type="monotone" dataKey="netProfit" name="Чистая прибыль" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
          <Line type="monotone" dataKey="cumulativeCash" name="Накоп. денежный поток" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const SENS_COLORS: Record<string, string> = {
  'Трафик': '#6366f1', 'Конверсия': '#10b981', 'Ср. чек': '#f59e0b',
  'Себестоимость': '#ef4444', 'Маркетинг': '#8b5cf6',
};

function SensitivityChart({ params }: { params: any }) {
  const steps = [0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];
  const trafficD = sensitivityData(params, 'traffic', steps);
  const convD = sensitivityData(params, 'conversionPercent', steps);
  const checkD = sensitivityData(params, 'averageCheck', steps);
  const costD = sensitivityData(params, 'costPerOrder', steps);
  const mktD = sensitivityData(params, 'marketingBudget', steps);
  const combined = steps.map((_, i) => ({
    label: trafficD[i].label,
    'Трафик': trafficD[i].profit,
    'Конверсия': convD[i].profit,
    'Ср. чек': checkD[i].profit,
    'Себестоимость': costD[i].profit,
    'Маркетинг': mktD[i].profit,
  }));

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Чувствительность прибыли</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={combined} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10 }} />
          <Tooltip content={<CompactTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" />
          {['Трафик', 'Конверсия', 'Ср. чек', 'Себестоимость', 'Маркетинг'].map((label) => (
            <Line key={label} type="monotone" dataKey={label} stroke={SENS_COLORS[label]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CompactTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 text-xs max-w-[180px]">
      <p className="font-medium text-gray-600 dark:text-gray-300 mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex justify-between gap-3">
          <span style={{ color: p.color }}>{p.dataKey}</span>
          <span className="font-medium text-gray-900 dark:text-white">{fmtTip(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function BreakEvenChart({ params }: { params: any }) {
  const data = breakEvenChartData(params);
  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Точка безубыточности</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="orders" tick={{ fontSize: 10 }} />
          <YAxis tickFormatter={fmtAxis} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(v: number) => fmtTip(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="revenue" name="Выручка" stroke="#6366f1" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="totalCosts" name="Расходы" stroke="#ef4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const recIcons = {
  danger: <AlertTriangle size={18} className="text-red-500 shrink-0" />,
  warning: <AlertCircle size={18} className="text-amber-500 shrink-0" />,
  info: <Info size={18} className="text-blue-500 shrink-0" />,
  success: <CheckCircle size={18} className="text-emerald-500 shrink-0" />,
};
const recBg = {
  danger: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
  warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
  info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
  success: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
};

function RecommendationsBlock({ items }: { items: Recommendation[] }) {
  if (!items.length) return null;
  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Рекомендации и диагностика</h3>
      <div className="space-y-2">
        {items.map((r, i) => (
          <div key={i} className={`flex gap-3 p-3 rounded-lg border ${recBg[r.type]}`}>
            {recIcons[r.type]}
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{r.title}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{r.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryTable({ m }: { m: FullMetrics }) {
  const rows = [
    ['Выручка', fmtCurrency(m.effectiveRevenue)],
    ['Себестоимость товаров', fmtCurrency(m.cogs)],
    ['Валовая прибыль', fmtCurrency(m.grossProfit)],
    ['Валовая маржа', fmtPercent(m.grossMarginPercent)],
    ['Переменные расходы', fmtCurrency(m.totalVariableCosts)],
    ['Маркетинг', fmtCurrency(m.cac * m.effectiveOrders)],
    ['Постоянные расходы', fmtCurrency(m.hasDetailedExpenses ? m.detailedMonthlyCosts + m.totalTeamCost : 0)],
    ['Операционная прибыль', fmtCurrency(m.operatingProfit)],
    ['Налог', fmtCurrency(m.taxAmount)],
    ['Чистая прибыль', fmtCurrency(m.netProfit)],
    ...(m.hasLTVData ? [
      ['Повторная выручка', fmtCurrency(m.repeatRevenue)],
      ['LTV', fmtCurrency(m.ltv)],
      ['LTV/CAC', m.ltvCacRatio.toFixed(1)],
    ] : []),
    ...(m.frozenInventory > 0 ? [['Заморожено в запасах', fmtCurrency(m.frozenInventory)]] : []),
  ];

  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Сводная таблица</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([label, value], i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-700 last:border-0">
                <td className="py-2 text-gray-600 dark:text-gray-400">{label}</td>
                <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ScenarioComparison({ data }: { data: { label: string; m: FullMetrics }[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">Сценарии</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {data.map((s) => {
          const color = s.m.isProfitable ? 'text-emerald-600' : 'text-red-600';
          const border = s.label === 'Пессимистичный'
            ? 'border-red-200 dark:border-red-800'
            : s.label === 'Оптимистичный'
              ? 'border-emerald-200 dark:border-emerald-800'
              : 'border-gray-200 dark:border-gray-700';
          return (
            <div key={s.label} className={`rounded-xl border-2 p-4 bg-white dark:bg-gray-800 ${border}`}>
              <h4 className="font-semibold text-xs text-gray-600 dark:text-gray-300 mb-2">{s.label}</h4>
              <div className="space-y-1.5 text-xs">
                <Row label="Заказы" value={fmt(s.m.effectiveOrders)} />
                <Row label="Выручка" value={fmtCurrency(s.m.effectiveRevenue)} />
                <Row label="Вал. маржа" value={fmtPercent(s.m.grossMarginPercent)} />
                <div className="border-t border-gray-100 dark:border-gray-700 pt-1.5">
                  <Row label="Чист. прибыль" value={fmtCurrency(s.m.netProfit)} className={color} bold />
                </div>
                <Row label="На заказ" value={fmtCurrency(s.m.profitPerOrder)} />
                <Row label="Окупаемость" value={s.m.paybackMonths ? `${s.m.paybackMonths} мес.` : '—'} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, className, bold }: { label: string; value: string; className?: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${className || 'text-gray-900 dark:text-white'}`}>{value}</span>
    </div>
  );
}
