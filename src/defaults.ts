import {
  InputParams, RevenueParams, MarketingParams, LTVParams,
  WarehouseParams, ProjectionSettings, ExpenseItem, TeamMember, Scenario,
} from './types';
import { uid } from './utils';

export const defaultParams: InputParams = {
  traffic: 15000,
  conversionPercent: 2.0,
  averageCheck: 2800,
  costPerOrder: 1200,
  marketingBudget: 0,
  variableCostPerOrder: 350,
  fixedCosts: 150000,
  initialInvestment: 500000,
};

export const exampleParams: InputParams = {
  traffic: 25000,
  conversionPercent: 2.5,
  averageCheck: 3200,
  costPerOrder: 1100,
  marketingBudget: 100000,
  variableCostPerOrder: 300,
  fixedCosts: 130000,
  initialInvestment: 400000,
};

export const emptyRevenue: RevenueParams = {
  skuCount: 0,
  avgProductPrice: 0,
  avgItemsPerOrder: 0,
  discountSharePercent: 0,
  avgDiscountPercent: 0,
  cancelRatePercent: 0,
  returnRatePercent: 0,
};

export const exampleRevenue: RevenueParams = {
  skuCount: 120,
  avgProductPrice: 1400,
  avgItemsPerOrder: 2,
  discountSharePercent: 15,
  avgDiscountPercent: 10,
  cancelRatePercent: 3,
  returnRatePercent: 5,
};

export const emptyMarketing: MarketingParams = {
  cpc: 0,
  organicTrafficPercent: 0,
  paidTrafficPercent: 0,
  socialTrafficPercent: 0,
  bloggersBudget: 0,
  emailBudget: 0,
  seoBudget: 0,
};

export const exampleMarketing: MarketingParams = {
  cpc: 25,
  organicTrafficPercent: 30,
  paidTrafficPercent: 45,
  socialTrafficPercent: 15,
  bloggersBudget: 30000,
  emailBudget: 5000,
  seoBudget: 20000,
};

export const emptyLTV: LTVParams = {
  repeatPurchaseRatePercent: 0,
  avgOrdersPerCustomerPerYear: 0,
  customerLifetimeMonths: 0,
  repeatOrderAvgCheck: 0,
};

export const exampleLTV: LTVParams = {
  repeatPurchaseRatePercent: 25,
  avgOrdersPerCustomerPerYear: 3,
  customerLifetimeMonths: 18,
  repeatOrderAvgCheck: 2500,
};

export const emptyWarehouse: WarehouseParams = {
  storageCostMonthly: 0,
  assemblyCostPerOrder: 0,
  packagingCostPerOrder: 0,
  deliveryCostPerOrder: 0,
  returnProcessingCost: 0,
  inventoryDays: 0,
  frozenInventoryAmount: 0,
};

export const exampleWarehouse: WarehouseParams = {
  storageCostMonthly: 25000,
  assemblyCostPerOrder: 50,
  packagingCostPerOrder: 80,
  deliveryCostPerOrder: 250,
  returnProcessingCost: 150,
  inventoryDays: 30,
  frozenInventoryAmount: 300000,
};

export const defaultProjection: ProjectionSettings = {
  months: 12,
  trafficGrowthPercent: 5,
  conversionImprovementPercent: 1,
  avgCheckGrowthPercent: 0,
  taxRatePercent: 6,
};

export const defaultOneTimeExpenses: ExpenseItem[] = [
  { id: uid(), name: 'Запуск сайта', amount: 0 },
  { id: uid(), name: 'Дизайн и брендинг', amount: 0 },
  { id: uid(), name: 'Фото и контент', amount: 0 },
  { id: uid(), name: 'Стартовый маркетинг', amount: 0 },
];

export const defaultMonthlyExpenses: ExpenseItem[] = [
  { id: uid(), name: 'Аренда', amount: 0 },
  { id: uid(), name: 'CRM и сервисы', amount: 0 },
  { id: uid(), name: 'Бухгалтерия', amount: 0 },
  { id: uid(), name: 'Техподдержка', amount: 0 },
];

export const exampleOneTimeExpenses: ExpenseItem[] = [
  { id: uid(), name: 'Запуск сайта', amount: 150000 },
  { id: uid(), name: 'Дизайн и брендинг', amount: 80000 },
  { id: uid(), name: 'Фото и контент', amount: 60000 },
  { id: uid(), name: 'Стартовый маркетинг', amount: 100000 },
];

export const exampleMonthlyExpenses: ExpenseItem[] = [
  { id: uid(), name: 'Аренда', amount: 30000 },
  { id: uid(), name: 'CRM и сервисы', amount: 8000 },
  { id: uid(), name: 'Бухгалтерия', amount: 15000 },
  { id: uid(), name: 'Техподдержка', amount: 10000 },
];

export const exampleTeam: TeamMember[] = [
  { id: uid(), role: 'Менеджер', salary: 50000, taxPercent: 30 },
  { id: uid(), role: 'Маркетолог', salary: 60000, taxPercent: 30 },
];

export const scenarios: Scenario[] = [
  {
    name: 'pessimistic',
    label: 'Пессимистичный',
    multipliers: { traffic: 0.8, conversionPercent: 0.8, averageCheck: 0.9, costPerOrder: 1.1, marketingBudget: 1.1 },
  },
  {
    name: 'base',
    label: 'Базовый',
    multipliers: { traffic: 1, conversionPercent: 1, averageCheck: 1, costPerOrder: 1, marketingBudget: 1 },
  },
  {
    name: 'optimistic',
    label: 'Оптимистичный',
    multipliers: { traffic: 1.2, conversionPercent: 1.2, averageCheck: 1.1, costPerOrder: 0.9, marketingBudget: 0.9 },
  },
];

export const baseInputFields = [
  { key: 'traffic' as const, label: 'Трафик в месяц', tooltip: 'Количество уникальных посетителей сайта за месяц', placeholder: '15 000', suffix: 'чел.', step: 500 },
  { key: 'conversionPercent' as const, label: 'Конверсия в заказ', tooltip: 'Процент посетителей, которые оформляют заказ. Норма для косметики: 1.5–3%', placeholder: '2.0', suffix: '%', step: 0.1, isPercent: true },
  { key: 'averageCheck' as const, label: 'Средний чек', tooltip: 'Средняя сумма одного заказа', placeholder: '2 800', suffix: '₽', step: 100 },
  { key: 'costPerOrder' as const, label: 'Себестоимость заказа', tooltip: 'Закупочная цена товаров + доставка до склада + упаковка товара', placeholder: '1 200', suffix: '₽', step: 50 },
  { key: 'variableCostPerOrder' as const, label: 'Переменные расходы на заказ', tooltip: 'Упаковка, доставка клиенту, эквайринг, сборка, бонусы, возвраты', placeholder: '350', suffix: '₽', step: 50 },
  { key: 'fixedCosts' as const, label: 'Постоянные расходы в месяц', tooltip: 'Зарплаты, аренда, CRM, сайт, бухгалтерия, подрядчики', placeholder: '150 000', suffix: '₽', step: 5000 },
  { key: 'initialInvestment' as const, label: 'Стартовые вложения', tooltip: 'Инвестиции на запуск магазина (для расчёта окупаемости)', placeholder: '500 000', suffix: '₽', step: 50000 },
];
