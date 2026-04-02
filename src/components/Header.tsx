import { Moon, Sun, RotateCcw, FileDown, Upload } from 'lucide-react';
import { useStore } from '../store';

export function Header() {
  const { darkMode, toggleDarkMode, reset, loadExample, params } = useStore();

  const exportCSV = () => {
    const rows = [
      ['Параметр', 'Значение'],
      ['Трафик', params.traffic],
      ['Конверсия %', params.conversionPercent],
      ['Средний чек', params.averageCheck],
      ['Себестоимость заказа', params.costPerOrder],
      ['Маркетинг', params.marketingBudget],
      ['Переменные расходы на заказ', params.variableCostPerOrder],
      ['Постоянные расходы', params.fixedCosts],
      ['Стартовые вложения', params.initialInvestment],
    ];
    const csv = rows.map((r) => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cosmetics-economics.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Экономика интернет-магазина косметики
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Финансовая модель и юнит-экономика
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={loadExample} className="btn-secondary" title="Загрузить расширенный пример">
          <Upload size={15} /> Пример
        </button>
        <button onClick={reset} className="btn-secondary" title="Сбросить все">
          <RotateCcw size={15} /> Сброс
        </button>
        <button onClick={exportCSV} className="btn-secondary" title="Экспорт CSV">
          <FileDown size={15} /> CSV
        </button>
        <button onClick={toggleDarkMode} className="btn-icon" title="Тема">
          {darkMode ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
