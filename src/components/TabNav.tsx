import {
  LayoutDashboard, Settings2, DollarSign, Megaphone,
  Repeat, Wallet, Calculator, TrendingUp, Target,
} from 'lucide-react';
import { useStore } from '../store';
import { TabId } from '../types';

const tabs: { id: TabId; label: string; icon: React.ReactNode; group?: string }[] = [
  { id: 'dashboard', label: 'Сводка', icon: <LayoutDashboard size={18} />, group: 'main' },
  { id: 'base', label: 'Параметры', icon: <Settings2 size={18} />, group: 'input' },
  { id: 'revenue', label: 'Выручка', icon: <DollarSign size={18} />, group: 'input' },
  { id: 'marketing', label: 'Маркетинг', icon: <Megaphone size={18} />, group: 'input' },
  { id: 'ltv', label: 'LTV', icon: <Repeat size={18} />, group: 'input' },
  { id: 'expenses', label: 'Расходы', icon: <Wallet size={18} />, group: 'input' },
  { id: 'unit-economics', label: 'Юнит-экономика', icon: <Calculator size={18} />, group: 'analytics' },
  { id: 'pnl', label: 'P&L', icon: <TrendingUp size={18} />, group: 'analytics' },
  { id: 'scenarios', label: 'Сценарии', icon: <Target size={18} />, group: 'analytics' },
];

export function TabNav() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex flex-col w-52 shrink-0 sticky top-4 self-start">
        <div className="card p-2 space-y-0.5">
          {tabs.map((tab, i) => {
            const prevGroup = i > 0 ? tabs[i - 1].group : null;
            const showDivider = prevGroup && prevGroup !== tab.group;
            return (
              <div key={tab.id}>
                {showDivider && <div className="border-t border-gray-200 dark:border-gray-700 my-1.5" />}
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Mobile tabs */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 overflow-x-auto">
        <div className="flex px-2 py-1.5 gap-1 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.icon}
              <span className="truncate max-w-[60px]">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
