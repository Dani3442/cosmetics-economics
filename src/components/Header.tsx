import { Moon, Sun, RotateCcw, FileDown, Upload, TrendingUp, TrendingDown } from 'lucide-react';
import { useStore } from '../store';
import { fmtCurrency } from '../utils';
import type { FullMetrics } from '../types';

export function Header({ metrics }: { metrics: FullMetrics }) {
  const { darkMode, toggleDarkMode, reset, loadExample, params, revenue, marketing, ltv, warehouse, oneTimeExpenses, monthlyExpenses, teamMembers, projection } = useStore();

  const exportCSV = () => {
    const sections: Array<[string, Array<[string, string | number]>]> = [
      ['Базовые параметры', [
        ['Трафик', params.traffic], ['Конверсия %', params.conversionPercent], ['Средний чек', params.averageCheck], ['Себестоимость заказа', params.costPerOrder], ['Маркетинг', params.marketingBudget], ['Переменные расходы на заказ', params.variableCostPerOrder], ['Постоянные расходы', params.fixedCosts], ['Стартовые вложения', params.initialInvestment],
      ]],
      ['Выручка', Object.entries(revenue).map(([k, v]) => [k, v])],
      ['Маркетинг', Object.entries(marketing).map(([k, v]) => [k, v])],
      ['LTV', Object.entries(ltv).map(([k, v]) => [k, v])],
      ['Склад', Object.entries(warehouse).map(([k, v]) => [k, v])],
      ['Прогноз', Object.entries(projection).map(([k, v]) => [k, v])],
      ['Метрики', [
        ['Заказы', metrics.effectiveOrders], ['Выручка', metrics.revenue], ['Себестоимость', metrics.cogs], ['Переменные расходы', metrics.totalVariableCosts], ['Маркетинг факт', metrics.effectiveMarketingBudget], ['Постоянные расходы факт', metrics.effectiveFixedCosts], ['Операционная прибыль', metrics.operatingProfit], ['Налог', metrics.taxAmount], ['Чистая прибыль', metrics.netProfit], ['CAC', metrics.cac], ['LTV', metrics.ltv], ['LTV/CAC', metrics.ltvCacRatio],
      ]],
    ];
    const rows: string[][] = [['Раздел', 'Параметр', 'Значение']];
    sections.forEach(([section, items]) => items.forEach(([label, value]) => rows.push([section, String(label), String(value)])));
    oneTimeExpenses.forEach((item) => rows.push(['Разовые расходы', item.name || 'Без названия', String(item.amount)]));
    monthlyExpenses.forEach((item) => rows.push(['Ежемесячные расходы', item.name || 'Без названия', String(item.amount)]));
    teamMembers.forEach((item) => rows.push(['Команда', item.role || 'Без роли', `${item.salary} / налог ${item.taxPercent}%`]));
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).split('\"').join('\"\"')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cosmetics-economics-full.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const profitable = metrics.netProfit > 0;
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Экономика интернет-магазина косметики</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Финансовая модель и юнит-экономика</p>
        </div>
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border ${profitable ? 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800'}`}>
          {profitable ? <TrendingUp size={16} className="text-green-600 dark:text-green-400" /> : <TrendingDown size={16} className="text-red-600 dark:text-red-400" />}
          <div className="text-xs leading-tight">
            <span className={`font-bold text-sm ${profitable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>{fmtCurrency(metrics.netProfit)}</span>
            <span className={`ml-1 ${profitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>/мес</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`sm:hidden flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${profitable ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
          {profitable ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {fmtCurrency(metrics.netProfit)}
        </div>
        <button onClick={loadExample} className="btn-secondary" title="Загрузить расширенный пример"><Upload size={15} /> Пример</button>
        <button onClick={reset} className="btn-secondary" title="Сбросить все"><RotateCcw size={15} /> Сброс</button>
        <button onClick={exportCSV} className="btn-secondary" title="Экспорт полного CSV"><FileDown size={15} /> CSV</button>
        <button onClick={toggleDarkMode} className="btn-icon" title="Тема">{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button>
      </div>
    </header>
  );
}
