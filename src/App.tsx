import { useMemo } from 'react';
import { useStore } from './store';
import { calculateFull, generateProjections } from './calculations';
import { generateRecommendations } from './recommendations';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { DashboardTab } from './components/tabs/DashboardTab';
import { BaseTab } from './components/tabs/BaseTab';
import { RevenueTab } from './components/tabs/RevenueTab';
import { MarketingTab } from './components/tabs/MarketingTab';
import { LTVTab } from './components/tabs/LTVTab';
import { ExpensesTab } from './components/tabs/ExpensesTab';
import { UnitEconomicsTab } from './components/tabs/UnitEconomicsTab';
import { PnLTab } from './components/tabs/PnLTab';
import { ScenariosTab } from './components/tabs/ScenariosTab';

export default function App() {
  const store = useStore();
  const { activeTab, darkMode } = store;

  const metrics = useMemo(
    () => calculateFull(
      store.params, store.revenue, store.marketing, store.ltv,
      store.warehouse, store.oneTimeExpenses, store.monthlyExpenses,
      store.teamMembers, store.projection,
    ),
    [store.params, store.revenue, store.marketing, store.ltv, store.warehouse,
     store.oneTimeExpenses, store.monthlyExpenses, store.teamMembers, store.projection],
  );

  const projections = useMemo(
    () => generateProjections(
      store.params, store.revenue, store.marketing, store.ltv,
      store.warehouse, store.oneTimeExpenses, store.monthlyExpenses,
      store.teamMembers, store.projection,
    ),
    [store.params, store.revenue, store.marketing, store.ltv, store.warehouse,
     store.oneTimeExpenses, store.monthlyExpenses, store.teamMembers, store.projection],
  );

  const recommendations = useMemo(
    () => generateRecommendations(store.params, metrics, store.ltv, store.revenue),
    [store.params, metrics, store.ltv, store.revenue],
  );

  const tabContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab metrics={metrics} projections={projections} recommendations={recommendations} />;
      case 'base': return <BaseTab />;
      case 'revenue': return <RevenueTab />;
      case 'marketing': return <MarketingTab />;
      case 'ltv': return <LTVTab metrics={metrics} />;
      case 'expenses': return <ExpensesTab />;
      case 'unit-economics': return <UnitEconomicsTab metrics={metrics} />;
      case 'pnl': return <PnLTab projections={projections} metrics={metrics} />;
      case 'scenarios': return <ScenariosTab />;
      default: return <DashboardTab metrics={metrics} projections={projections} recommendations={recommendations} />;
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-4">
          <Header />
          <div className="flex gap-6 mt-4">
            <TabNav />
            <main className="flex-1 min-w-0">
              {tabContent()}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
