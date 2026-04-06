import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  InputParams, RevenueParams, MarketingParams, LTVParams,
  WarehouseParams, ProjectionSettings, ExpenseItem, TeamMember, TabId,
} from './types';
import {
  defaultParams, emptyRevenue, emptyMarketing, emptyLTV,
  emptyWarehouse, defaultProjection, defaultOneTimeExpenses,
  defaultMonthlyExpenses, exampleParams, exampleRevenue,
  exampleMarketing, exampleLTV, exampleWarehouse,
  exampleOneTimeExpenses, exampleMonthlyExpenses, exampleTeam,
} from './defaults';
import { uid } from './utils';

interface Store {
  params: InputParams;
  revenue: RevenueParams;
  marketing: MarketingParams;
  ltv: LTVParams;
  warehouse: WarehouseParams;
  oneTimeExpenses: ExpenseItem[];
  monthlyExpenses: ExpenseItem[];
  teamMembers: TeamMember[];
  projection: ProjectionSettings;
  activeTab: TabId;
  darkMode: boolean;

  setParam: <K extends keyof InputParams>(key: K, value: InputParams[K]) => void;
  setParams: (p: InputParams) => void;
  setRevenue: <K extends keyof RevenueParams>(key: K, value: number) => void;
  setMarketing: <K extends keyof MarketingParams>(key: K, value: number) => void;
  setLtv: <K extends keyof LTVParams>(key: K, value: number) => void;
  setWarehouse: <K extends keyof WarehouseParams>(key: K, value: number) => void;
  setProjection: <K extends keyof ProjectionSettings>(key: K, value: number) => void;

  addOneTimeExpense: () => void;
  updateOneTimeExpense: (id: string, field: keyof ExpenseItem, value: string | number) => void;
  removeOneTimeExpense: (id: string) => void;
  addMonthlyExpense: () => void;
  updateMonthlyExpense: (id: string, field: keyof ExpenseItem, value: string | number) => void;
  removeMonthlyExpense: (id: string) => void;

  addTeamMember: () => void;
  updateTeamMember: (id: string, field: keyof TeamMember, value: string | number | boolean) => void;
  removeTeamMember: (id: string) => void;

  setActiveTab: (tab: TabId) => void;
  toggleDarkMode: () => void;
  reset: () => void;
  loadExample: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      params: { ...defaultParams },
      revenue: { ...emptyRevenue },
      marketing: { ...emptyMarketing },
      ltv: { ...emptyLTV },
      warehouse: { ...emptyWarehouse },
      oneTimeExpenses: [...defaultOneTimeExpenses],
      monthlyExpenses: [...defaultMonthlyExpenses],
      teamMembers: [],
      projection: { ...defaultProjection },
      activeTab: 'dashboard',
      darkMode: false,

      setParam: (key, value) => set((s) => ({ params: { ...s.params, [key]: value } })),
      setParams: (p) => set({ params: { ...p } }),
      setRevenue: (key, value) => set((s) => ({ revenue: { ...s.revenue, [key]: value } })),
      setMarketing: (key, value) => set((s) => ({ marketing: { ...s.marketing, [key]: value } })),
      setLtv: (key, value) => set((s) => ({ ltv: { ...s.ltv, [key]: value } })),
      setWarehouse: (key, value) => set((s) => ({ warehouse: { ...s.warehouse, [key]: value } })),
      setProjection: (key, value) => set((s) => ({ projection: { ...s.projection, [key]: value } })),

      addOneTimeExpense: () => set((s) => ({ oneTimeExpenses: [...s.oneTimeExpenses, { id: uid(), name: '', amount: 0 }] })),
      updateOneTimeExpense: (id, field, value) => set((s) => ({ oneTimeExpenses: s.oneTimeExpenses.map((e) => e.id === id ? { ...e, [field]: value } : e) })),
      removeOneTimeExpense: (id) => set((s) => ({ oneTimeExpenses: s.oneTimeExpenses.filter((e) => e.id !== id) })),

      addMonthlyExpense: () => set((s) => ({ monthlyExpenses: [...s.monthlyExpenses, { id: uid(), name: '', amount: 0 }] })),
      updateMonthlyExpense: (id, field, value) => set((s) => ({ monthlyExpenses: s.monthlyExpenses.map((e) => e.id === id ? { ...e, [field]: value } : e) })),
      removeMonthlyExpense: (id) => set((s) => ({ monthlyExpenses: s.monthlyExpenses.filter((e) => e.id !== id) })),

      addTeamMember: () => set((s) => ({ teamMembers: [...s.teamMembers, { id: uid(), role: '', salary: 0, taxPercent: 30 }] })),
      updateTeamMember: (id, field, value) => set((s) => ({ teamMembers: s.teamMembers.map((m) => m.id === id ? { ...m, [field]: value } : m) })),
      removeTeamMember: (id) => set((s) => ({ teamMembers: s.teamMembers.filter((m) => m.id !== id) })),

      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      reset: () => set({
        params: { ...defaultParams },
        revenue: { ...emptyRevenue },
        marketing: { ...emptyMarketing },
        ltv: { ...emptyLTV },
        warehouse: { ...emptyWarehouse },
        oneTimeExpenses: [...defaultOneTimeExpenses],
        monthlyExpenses: [...defaultMonthlyExpenses],
        teamMembers: [],
        projection: { ...defaultProjection },
      }),

      loadExample: () => set({
        params: { ...exampleParams },
        revenue: { ...exampleRevenue },
        marketing: { ...exampleMarketing },
        ltv: { ...exampleLTV },
        warehouse: { ...exampleWarehouse },
        oneTimeExpenses: [...exampleOneTimeExpenses],
        monthlyExpenses: [...exampleMonthlyExpenses],
        teamMembers: [...exampleTeam],
      }),
    }),
    { name: 'cosmetics-economics-v3' },
  ),
);
