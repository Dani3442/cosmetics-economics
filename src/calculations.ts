import {
  InputParams, RevenueParams, MarketingParams, LTVParams,
  WarehouseParams, ProjectionSettings, ExpenseItem, TeamMember,
  CalculatedMetrics, FullMetrics, MonthlyProjection,
} from './types';
import { safe, safeDivide } from './utils';

// === Base calculation (backward-compatible) ===
export function calculate(p: InputParams): CalculatedMetrics {
  const conversion = p.conversionPercent / 100;
  const orders = Math.round(p.traffic * conversion);
  const revenue = orders * p.averageCheck;
  const cogs = orders * p.costPerOrder;
  const totalVariableCosts = orders * p.variableCostPerOrder;
  const grossProfit = revenue - cogs;
  const grossMarginPercent = safe(safeDivide(grossProfit, revenue) * 100);
  const profit = revenue - cogs - p.marketingBudget - totalVariableCosts - p.fixedCosts;
  const profitPerOrder = safe(safeDivide(profit, orders));
  const cac = safe(safeDivide(p.marketingBudget, orders));
  const marginPerOrder = p.averageCheck - p.costPerOrder - p.variableCostPerOrder;
  const isBreakEvenPossible = marginPerOrder > 0;

  let breakEvenOrders: number | null = null;
  let breakEvenTraffic: number | null = null;
  if (isBreakEvenPossible) {
    breakEvenOrders = Math.ceil((p.marketingBudget + p.fixedCosts) / marginPerOrder);
    breakEvenTraffic = conversion > 0 ? Math.ceil(breakEvenOrders / conversion) : null;
  }

  let paybackMonths: number | null = null;
  if (profit > 0 && p.initialInvestment > 0) {
    paybackMonths = Math.ceil(p.initialInvestment / profit);
  }

  const romi = safe(safeDivide(revenue - cogs - p.marketingBudget, p.marketingBudget) * 100);

  return {
    orders, revenue, cogs, totalVariableCosts, grossProfit, grossMarginPercent,
    profit, profitPerOrder, cac, breakEvenOrders, breakEvenTraffic,
    paybackMonths, romi, marginPerOrder, isBreakEvenPossible,
    isProfitable: profit > 0,
  };
}

// === Full extended calculation ===
export function calculateFull(
  params: InputParams,
  rev: RevenueParams,
  mkt: MarketingParams,
  ltv: LTVParams,
  wh: WarehouseParams,
  oneTime: ExpenseItem[],
  monthly: ExpenseItem[],
  team: TeamMember[],
  proj: ProjectionSettings,
): FullMetrics {
  const base = calculate(params);

  // Feature flags
  const hasRevDetail = rev.cancelRatePercent > 0 || rev.returnRatePercent > 0 || rev.discountSharePercent > 0;
  const hasLTVData = ltv.repeatPurchaseRatePercent > 0;
  const hasMarketingDetail = mkt.cpc > 0 || mkt.bloggersBudget > 0;
  const hasWarehouseDetail = wh.storageCostMonthly > 0 || wh.assemblyCostPerOrder > 0;
  const hasDetailedExpenses = monthly.some(e => e.amount > 0) || team.length > 0;

  // Revenue adjustments
  const cancelRate = rev.cancelRatePercent / 100;
  const returnRate = rev.returnRatePercent / 100;
  const effectiveOrders = hasRevDetail ? Math.round(base.orders * (1 - cancelRate)) : base.orders;
  const cancelledOrders = base.orders - effectiveOrders;
  const discountImpact = safe(base.revenue * (rev.discountSharePercent / 100) * (rev.avgDiscountPercent / 100));
  const returnCost = safe(effectiveOrders * returnRate * params.costPerOrder);
  const effectiveRevenue = hasRevDetail
    ? effectiveOrders * params.averageCheck * (1 - returnRate) - discountImpact
    : base.revenue;

  // LTV
  const repeatRate = ltv.repeatPurchaseRatePercent / 100;
  const ordersPerYear = ltv.avgOrdersPerCustomerPerYear || 1;
  const lifetimeMonths = ltv.customerLifetimeMonths || 12;
  const repeatCheck = ltv.repeatOrderAvgCheck || params.averageCheck;
  const contributionPerOrder = params.averageCheck - params.costPerOrder - params.variableCostPerOrder;
  const ltvValue = hasLTVData
    ? safe(contributionPerOrder * ordersPerYear * (lifetimeMonths / 12))
    : safe(contributionPerOrder);
  const newCustomers = effectiveOrders;
  const repeatCustomers = hasLTVData ? Math.round(newCustomers * repeatRate) : 0;
  const repeatRevenue = repeatCustomers * repeatCheck;
  const firstOrderProfit = contributionPerOrder - safe(safeDivide(params.marketingBudget, effectiveOrders));
  const ltvCacRatio = safe(safeDivide(ltvValue, base.cac));

  // Team costs
  const totalTeamCost = team.reduce((s, m) => s + m.salary * (1 + m.taxPercent / 100), 0);

  // Expenses
  const totalOneTimeCosts = oneTime.reduce((s, e) => s + e.amount, 0);
  const detailedMonthlyCosts = monthly.reduce((s, e) => s + e.amount, 0);

  // Warehouse
  const warehouseMonthlyCost = wh.storageCostMonthly;
  const fulfillmentCostPerOrder = wh.assemblyCostPerOrder + wh.packagingCostPerOrder + wh.deliveryCostPerOrder;
  const frozenInventory = wh.frozenInventoryAmount;

  // Effective costs (use detailed if filled, else base)
  const effectiveFixedCosts = hasDetailedExpenses
    ? detailedMonthlyCosts + totalTeamCost + warehouseMonthlyCost
    : params.fixedCosts;

  const effectiveVarCostPerOrder = hasWarehouseDetail
    ? params.variableCostPerOrder + fulfillmentCostPerOrder + wh.returnProcessingCost * returnRate
    : params.variableCostPerOrder;

  const effectiveStartup = totalOneTimeCosts > 0 ? totalOneTimeCosts : params.initialInvestment;

  // P&L
  const rev2 = effectiveRevenue + (hasLTVData ? repeatRevenue : 0);
  const cogs2 = effectiveOrders * params.costPerOrder + (repeatCustomers * params.costPerOrder);
  const varCosts = (effectiveOrders + repeatCustomers) * effectiveVarCostPerOrder;
  const grossProfit2 = rev2 - cogs2;
  const operatingProfit = grossProfit2 - params.marketingBudget - varCosts - effectiveFixedCosts - returnCost;
  const taxRate = proj.taxRatePercent / 100;
  const taxAmount = operatingProfit > 0 ? operatingProfit * taxRate : 0;
  const netProfit = operatingProfit - taxAmount;

  // Contribution margin
  const contributionMargin = params.averageCheck - params.costPerOrder - effectiveVarCostPerOrder;
  const contributionMarginPercent = safe(safeDivide(contributionMargin, params.averageCheck) * 100);

  // Break-even in revenue
  const breakEvenRevenue = contributionMarginPercent > 0
    ? safe((params.marketingBudget + effectiveFixedCosts) / (contributionMarginPercent / 100))
    : null;

  // Required params for break-even
  const totalFixedLike = params.marketingBudget + effectiveFixedCosts;
  const requiredConversion = base.marginPerOrder > 0 && params.traffic > 0
    ? safe(totalFixedLike / (base.marginPerOrder * params.traffic) * 100)
    : null;
  const requiredAvgCheck = effectiveOrders > 0
    ? safe((totalFixedLike / effectiveOrders) + params.costPerOrder + effectiveVarCostPerOrder)
    : null;

  // Cash
  const cashBurnMonthly = netProfit < 0 ? Math.abs(netProfit) : 0;
  const cashRunwayMonths = cashBurnMonthly > 0 ? Math.ceil(effectiveStartup / cashBurnMonthly) : null;
  const workingCapitalNeed = effectiveFixedCosts * 3 + frozenInventory;

  // Payback with extended data
  const paybackMonths = netProfit > 0 && effectiveStartup > 0
    ? Math.ceil(effectiveStartup / netProfit)
    : null;

  return {
    ...base,
    profit: hasDetailedExpenses || hasRevDetail ? netProfit : base.profit,
    profitPerOrder: safe(safeDivide(netProfit, effectiveOrders)),
    isProfitable: netProfit > 0,
    paybackMonths,

    effectiveOrders, effectiveRevenue, returnCost, cancelledOrders, discountImpact,
    ltv: ltvValue, ltvCacRatio, repeatRevenue, firstOrderProfit, newCustomers, repeatCustomers,
    totalTeamCost, totalOneTimeCosts, detailedMonthlyCosts,
    warehouseMonthlyCost, fulfillmentCostPerOrder,
    operatingProfit, taxAmount, netProfit,
    contributionMargin, contributionMarginPercent,
    breakEvenRevenue, requiredConversion, requiredAvgCheck,
    totalStartupCost: effectiveStartup,
    cashBurnMonthly, cashRunwayMonths, workingCapitalNeed, frozenInventory,
    hasDetailedExpenses, hasLTVData, hasMarketingDetail, hasWarehouseDetail,
  };
}

// === Monthly projections ===
export function generateProjections(
  params: InputParams,
  rev: RevenueParams,
  mkt: MarketingParams,
  ltvP: LTVParams,
  wh: WarehouseParams,
  oneTime: ExpenseItem[],
  monthly: ExpenseItem[],
  team: TeamMember[],
  proj: ProjectionSettings,
): MonthlyProjection[] {
  const result: MonthlyProjection[] = [];
  let cumProfit = 0;
  const startup = oneTime.reduce((s, e) => s + e.amount, 0) || params.initialInvestment;
  let cumCash = -startup;

  for (let m = 1; m <= proj.months; m++) {
    const growth = Math.pow(1 + proj.trafficGrowthPercent / 100, m - 1);
    const convGrowth = Math.pow(1 + proj.conversionImprovementPercent / 100, m - 1);
    const checkGrowth = Math.pow(1 + proj.avgCheckGrowthPercent / 100, m - 1);

    const monthParams: InputParams = {
      ...params,
      traffic: Math.round(params.traffic * growth),
      conversionPercent: Math.min(params.conversionPercent * convGrowth, 15),
      averageCheck: params.averageCheck * checkGrowth,
    };

    const full = calculateFull(monthParams, rev, mkt, ltvP, wh, oneTime, monthly, team, proj);

    cumProfit += full.netProfit;
    cumCash += full.netProfit;

    result.push({
      month: m,
      traffic: monthParams.traffic,
      orders: full.effectiveOrders,
      revenue: full.effectiveRevenue + full.repeatRevenue,
      cogs: full.cogs,
      grossProfit: full.grossProfit,
      marketing: params.marketingBudget,
      variableCosts: full.totalVariableCosts,
      fixedCosts: full.hasDetailedExpenses ? full.detailedMonthlyCosts + full.totalTeamCost : params.fixedCosts,
      operatingProfit: full.operatingProfit,
      tax: full.taxAmount,
      netProfit: full.netProfit,
      cumulativeProfit: cumProfit,
      cumulativeCash: cumCash,
    });
  }
  return result;
}

// === Sensitivity data (reused) ===
export function sensitivityData(
  base: InputParams,
  param: keyof InputParams,
  steps: number[],
): { label: string; profit: number; revenue: number }[] {
  return steps.map((mult) => {
    const modified = { ...base, [param]: base[param] * mult };
    const m = calculate(modified);
    const pctLabel = Math.round((mult - 1) * 100);
    return {
      label: `${pctLabel >= 0 ? '+' : ''}${pctLabel}%`,
      profit: Math.round(m.profit),
      revenue: Math.round(m.revenue),
    };
  });
}

export function breakEvenChartData(base: InputParams) {
  const maxOrders = Math.max(base.traffic * (base.conversionPercent / 100) * 2, 200);
  const step = Math.max(1, Math.round(maxOrders / 20));
  const data: { orders: number; revenue: number; totalCosts: number }[] = [];
  for (let o = 0; o <= maxOrders; o += step) {
    data.push({
      orders: o,
      revenue: o * base.averageCheck,
      totalCosts: base.fixedCosts + base.marketingBudget + o * (base.costPerOrder + base.variableCostPerOrder),
    });
  }
  return data;
}

// === Scenario calculation ===
export function calculateScenario(
  params: InputParams,
  multipliers: Record<string, number>,
  rev: RevenueParams,
  mkt: MarketingParams,
  ltvP: LTVParams,
  wh: WarehouseParams,
  oneTime: ExpenseItem[],
  monthly: ExpenseItem[],
  team: TeamMember[],
  proj: ProjectionSettings,
): FullMetrics {
  const modified: InputParams = {
    ...params,
    traffic: params.traffic * (multipliers.traffic ?? 1),
    conversionPercent: params.conversionPercent * (multipliers.conversionPercent ?? 1),
    averageCheck: params.averageCheck * (multipliers.averageCheck ?? 1),
    costPerOrder: params.costPerOrder * (multipliers.costPerOrder ?? 1),
    marketingBudget: params.marketingBudget * (multipliers.marketingBudget ?? 1),
  };
  return calculateFull(modified, rev, mkt, ltvP, wh, oneTime, monthly, team, proj);
}
