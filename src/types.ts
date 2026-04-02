// === Base params (required, backward-compatible) ===
export interface InputParams {
  traffic: number;
  conversionPercent: number;
  averageCheck: number;
  costPerOrder: number;
  marketingBudget: number;
  variableCostPerOrder: number;
  fixedCosts: number;
  initialInvestment: number;
}

// === Extended optional params ===
export interface RevenueParams {
  skuCount: number;
  avgProductPrice: number;
  avgItemsPerOrder: number;
  discountSharePercent: number;
  avgDiscountPercent: number;
  cancelRatePercent: number;
  returnRatePercent: number;
}

export interface MarketingParams {
  cpc: number;
  organicTrafficPercent: number;
  paidTrafficPercent: number;
  socialTrafficPercent: number;
  bloggersBudget: number;
  emailBudget: number;
  seoBudget: number;
}

export interface LTVParams {
  repeatPurchaseRatePercent: number;
  avgOrdersPerCustomerPerYear: number;
  customerLifetimeMonths: number;
  repeatOrderAvgCheck: number;
}

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
}

export interface TeamMember {
  id: string;
  role: string;
  salary: number;
  taxPercent: number;
}

export interface WarehouseParams {
  storageCostMonthly: number;
  assemblyCostPerOrder: number;
  packagingCostPerOrder: number;
  deliveryCostPerOrder: number;
  returnProcessingCost: number;
  inventoryDays: number;
  frozenInventoryAmount: number;
}

export interface ProjectionSettings {
  months: number;
  trafficGrowthPercent: number;
  conversionImprovementPercent: number;
  avgCheckGrowthPercent: number;
  taxRatePercent: number;
}

// === Calculated metrics ===
export interface CalculatedMetrics {
  orders: number;
  revenue: number;
  cogs: number;
  totalVariableCosts: number;
  grossProfit: number;
  grossMarginPercent: number;
  profit: number;
  profitPerOrder: number;
  cac: number;
  breakEvenOrders: number | null;
  breakEvenTraffic: number | null;
  paybackMonths: number | null;
  romi: number;
  marginPerOrder: number;
  isBreakEvenPossible: boolean;
  isProfitable: boolean;
}

export interface FullMetrics extends CalculatedMetrics {
  effectiveOrders: number;
  effectiveRevenue: number;
  returnCost: number;
  cancelledOrders: number;
  discountImpact: number;

  ltv: number;
  ltvCacRatio: number;
  repeatRevenue: number;
  firstOrderProfit: number;
  newCustomers: number;
  repeatCustomers: number;

  totalTeamCost: number;
  totalOneTimeCosts: number;
  detailedMonthlyCosts: number;
  warehouseMonthlyCost: number;
  fulfillmentCostPerOrder: number;

  operatingProfit: number;
  taxAmount: number;
  netProfit: number;

  contributionMargin: number;
  contributionMarginPercent: number;
  breakEvenRevenue: number | null;
  requiredConversion: number | null;
  requiredAvgCheck: number | null;

  totalStartupCost: number;
  cashBurnMonthly: number;
  cashRunwayMonths: number | null;
  workingCapitalNeed: number;
  frozenInventory: number;

  hasDetailedExpenses: boolean;
  hasLTVData: boolean;
  hasMarketingDetail: boolean;
  hasWarehouseDetail: boolean;
}

export interface MonthlyProjection {
  month: number;
  traffic: number;
  orders: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marketing: number;
  variableCosts: number;
  fixedCosts: number;
  operatingProfit: number;
  tax: number;
  netProfit: number;
  cumulativeProfit: number;
  cumulativeCash: number;
}

export interface Scenario {
  name: string;
  label: string;
  multipliers: Record<string, number>;
}

export interface Recommendation {
  priority: number;
  title: string;
  description: string;
  type: 'danger' | 'warning' | 'info' | 'success';
}

export type TabId =
  | 'dashboard' | 'base' | 'revenue' | 'marketing'
  | 'ltv' | 'expenses' | 'unit-economics' | 'pnl' | 'scenarios';
