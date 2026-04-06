import {
  InputParams, RevenueParams, MarketingParams, LTVParams,
  WarehouseParams, ProjectionSettings, ExpenseItem, TeamMember,
  CalculatedMetrics, FullMetrics, MonthlyProjection,
} from './types';
import { safe, safeDivide } from './utils';

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

  const romi = p.marketingBudget > 0
    ? safe(safeDivide(revenue - cogs - p.marketingBudget, p.marketingBudget) * 100)
    : 0;

  return {
    orders, revenue, cogs, totalVariableCosts, grossProfit, grossMarginPercent,
    profit, profitPerOrder, cac, breakEvenOrders, breakEvenTraffic,
    paybackMonths, romi, marginPerOrder, isBreakEvenPossible,
    isProfitable: profit > 0,
  };
}

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

  const hasRevPricing = rev.avgProductPrice > 0 && rev.avgItemsPerOrder > 0;
  const hasRevDetail = hasRevPricing || rev.cancelRatePercent > 0 || rev.returnRatePercent > 0 || rev.discountSharePercent > 0;
  const hasLTVData = ltv.repeatPurchaseRatePercent > 0 || ltv.avgOrdersPerCustomerPerYear > 0 || ltv.customerLifetimeMonths > 0 || ltv.repeatOrderAvgCheck > 0;
  const hasMarketingDetail = mkt.cpc > 0 || mkt.bloggersBudget > 0 || mkt.emailBudget > 0 || mkt.seoBudget > 0 || mkt.paidTrafficPercent > 0 || mkt.socialTrafficPercent > 0 || mkt.organicTrafficPercent > 0;
  const hasWarehouseDetail = wh.storageCostMonthly > 0 || wh.assemblyCostPerOrder > 0 || wh.packagingCostPerOrder > 0 || wh.deliveryCostPerOrder > 0 || wh.returnProcessingCost > 0 || wh.frozenInventoryAmount > 0;
  const hasDetailedExpenses = monthly.some(e => e.amount > 0) || team.some(t => t.salary > 0);

  const effectiveCheck = hasRevPricing ? rev.avgProductPrice * rev.avgItemsPerOrder : params.averageCheck;

  const paidTrafficShare = Math.max(0, Math.min(100, mkt.paidTrafficPercent));
  const paidClicks = hasMarketingDetail && mkt.cpc > 0 && paidTrafficShare > 0
    ? Math.round(params.traffic * paidTrafficShare / 100)
    : 0;
  const paidAdCost = paidClicks * mkt.cpc;
  const channelsBudget = mkt.bloggersBudget + mkt.emailBudget + mkt.seoBudget;
  const effectiveMarketingBudget = hasMarketingDetail ? paidAdCost + channelsBudget : params.marketingBudget;

  const cancelRate = rev.cancelRatePercent / 100;
  const returnRate = rev.returnRatePercent / 100;
  const effectiveOrders = hasRevDetail ? Math.round(base.orders * (1 - cancelRate)) : base.orders;
  const cancelledOrders = Math.max(0, base.orders - effectiveOrders);
  const discountImpact = safe(effectiveOrders * effectiveCheck * (rev.discountSharePercent / 100) * (rev.avgDiscountPercent / 100));
  const returnCost = safe(effectiveOrders * returnRate * (params.costPerOrder + wh.returnProcessingCost));
  const effectiveRevenue = hasRevDetail
    ? safe(effectiveOrders * effectiveCheck * (1 - returnRate) - discountImpact)
    : base.revenue;

  const repeatRate = ltv.repeatPurchaseRatePercent / 100;
  const ordersPerYear = ltv.avgOrdersPerCustomerPerYear || 1;
  const lifetimeMonths = ltv.customerLifetimeMonths || 12;
  const repeatCheck = ltv.repeatOrderAvgCheck || effectiveCheck;

  const totalTeamCost = team.reduce((s, member) => s + member.salary * (1 + member.taxPercent / 100), 0);
  const totalOneTimeCosts = oneTime.reduce((s, e) => s + e.amount, 0);
  const detailedMonthlyCosts = monthly.reduce((s, e) => s + e.amount, 0);
  const warehouseMonthlyCost = wh.storageCostMonthly;
  const fulfillmentCostPerOrder = wh.assemblyCostPerOrder + wh.packagingCostPerOrder + wh.deliveryCostPerOrder;
  const frozenInventory = wh.frozenInventoryAmount;

  const totalFixedCosts = params.fixedCosts
    + (hasDetailedExpenses ? detailedMonthlyCosts + totalTeamCost : 0)
    + (hasWarehouseDetail ? warehouseMonthlyCost : 0);

  const effectiveVariableCostPerOrder = params.variableCostPerOrder
    + (hasWarehouseDetail ? fulfillmentCostPerOrder : 0)
    + (hasWarehouseDetail ? wh.returnProcessingCost * returnRate : 0);

  const effectiveCac = safe(safeDivide(effectiveMarketingBudget, effectiveOrders));
  const firstOrderContribution = effectiveCheck - params.costPerOrder - effectiveVariableCostPerOrder;
  const repeatOrderContribution = repeatCheck - params.costPerOrder - effectiveVariableCostPerOrder;

  const repeatOrders = hasLTVData
    ? Math.max(0, Math.round(effectiveOrders * repeatRate))
    : 0;
  const repeatCustomers = repeatOrders;
  const repeatRevenue = repeatOrders * repeatCheck;
  const newCustomers = effectiveOrders;

  const ltvRepeatFactor = Math.max(0, ordersPerYear - 1) * (lifetimeMonths / 12) * repeatRate;
  const ltvValue = hasLTVData
    ? safe(firstOrderContribution + repeatOrderContribution * ltvRepeatFactor)
    : safe(firstOrderContribution);
  const firstOrderProfit = firstOrderContribution - effectiveCac;
  const ltvCacRatio = safe(safeDivide(ltvValue, effectiveCac));

  const totalRevenue = effectiveRevenue + repeatRevenue;
  const cogs = (effectiveOrders + repeatOrders) * params.costPerOrder;
  const totalVariableCosts = (effectiveOrders + repeatOrders) * effectiveVariableCostPerOrder;
  const grossProfit = totalRevenue - cogs;
  const grossMarginPercent = safe(safeDivide(grossProfit, totalRevenue) * 100);
  const operatingProfit = grossProfit - effectiveMarketingBudget - totalVariableCosts - totalFixedCosts - returnCost;
  const taxRate = proj.taxRatePercent / 100;
  const taxAmount = operatingProfit > 0 ? operatingProfit * taxRate : 0;
  const netProfit = operatingProfit - taxAmount;

  const contributionMargin = effectiveCheck - params.costPerOrder - effectiveVariableCostPerOrder;
  const contributionMarginPercent = safe(safeDivide(contributionMargin, effectiveCheck) * 100);
  const marginPerOrder = contributionMargin;
  const isBreakEvenPossible = contributionMargin > 0;

  let breakEvenOrders: number | null = null;
  let breakEvenTraffic: number | null = null;
  if (isBreakEvenPossible) {
    breakEvenOrders = Math.ceil((effectiveMarketingBudget + totalFixedCosts) / contributionMargin);
    breakEvenTraffic = params.conversionPercent > 0 ? Math.ceil(breakEvenOrders / (params.conversionPercent / 100)) : null;
  }

  const breakEvenRevenue = contributionMarginPercent > 0
    ? safe((effectiveMarketingBudget + totalFixedCosts) / (contributionMarginPercent / 100))
    : null;

  const requiredConversion = contributionMargin > 0 && params.traffic > 0
    ? safe(((effectiveMarketingBudget + totalFixedCosts) / (contributionMargin * params.traffic)) * 100)
    : null;
  const requiredAvgCheck = effectiveOrders > 0
    ? safe(((effectiveMarketingBudget + totalFixedCosts) / effectiveOrders) + params.costPerOrder + effectiveVariableCostPerOrder)
    : null;

  const effectiveStartup = params.initialInvestment + totalOneTimeCosts;
  const cashBurnMonthly = netProfit < 0 ? Math.abs(netProfit) : 0;
  const cashRunwayMonths = cashBurnMonthly > 0 ? Math.ceil(effectiveStartup / cashBurnMonthly) : null;
  const workingCapitalNeed = totalFixedCosts * 3 + frozenInventory;
  const paybackMonths = netProfit > 0 && effectiveStartup > 0 ? Math.ceil(effectiveStartup / netProfit) : null;

  const romi = effectiveMarketingBudget > 0
    ? safe(safeDivide(totalRevenue - cogs - effectiveMarketingBudget, effectiveMarketingBudget) * 100)
    : 0;
  const totalCosts = cogs + totalVariableCosts + effectiveMarketingBudget + totalFixedCosts + returnCost;

  return {
    ...base,
    revenue: totalRevenue,
    cogs,
    totalVariableCosts,
    grossProfit,
    grossMarginPercent,
    profit: netProfit,
    profitPerOrder: safe(safeDivide(netProfit, Math.max(effectiveOrders + repeatOrders, 1))),
    isProfitable: netProfit > 0,
    paybackMonths,
    cac: effectiveCac,
    romi,
    marginPerOrder,
    breakEvenOrders,
    breakEvenTraffic,
    isBreakEvenPossible,

    effectiveOrders,
    effectiveRevenue,
    totalRevenue,
    returnCost,
    cancelledOrders,
    discountImpact,
    ltv: ltvValue,
    ltvCacRatio,
    repeatRevenue,
    firstOrderProfit,
    newCustomers,
    repeatCustomers,
    repeatOrders,
    totalTeamCost,
    totalOneTimeCosts,
    detailedMonthlyCosts,
    warehouseMonthlyCost,
    fulfillmentCostPerOrder,
    totalFixedCosts,
    effectiveVariableCostPerOrder,
    effectiveAverageCheck: effectiveCheck,
    effectiveMarketingBudget,
    totalCosts,
    operatingProfit,
    taxAmount,
    netProfit,
    contributionMargin,
    contributionMarginPercent,
    breakEvenRevenue,
    requiredConversion,
    requiredAvgCheck,
    totalStartupCost: effectiveStartup,
    cashBurnMonthly,
    cashRunwayMonths,
    workingCapitalNeed,
    frozenInventory,
    hasDetailedExpenses,
    hasLTVData,
    hasMarketingDetail,
    hasWarehouseDetail,
  };
}

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
  const startup = params.initialInvestment + oneTime.reduce((s, e) => s + e.amount, 0);
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
      orders: full.effectiveOrders + full.repeatOrders,
      revenue: full.totalRevenue,
      cogs: full.cogs,
      grossProfit: full.grossProfit,
      marketing: full.effectiveMarketingBudget,
      variableCosts: full.totalVariableCosts,
      fixedCosts: full.totalFixedCosts,
      operatingProfit: full.operatingProfit,
      tax: full.taxAmount,
      netProfit: full.netProfit,
      cumulativeProfit: cumProfit,
      cumulativeCash: cumCash,
    });
  }
  return result;
}

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

export function sensitivityDataFull(
  params: InputParams,
  rev: RevenueParams,
  mkt: MarketingParams,
  ltv: LTVParams,
  wh: WarehouseParams,
  oneTime: ExpenseItem[],
  monthly: ExpenseItem[],
  team: TeamMember[],
  proj: ProjectionSettings,
  param: keyof InputParams,
  steps: number[],
): { label: string; profit: number; revenue: number }[] {
  return steps.map((mult) => {
    const modified = { ...params, [param]: params[param] * mult };
    const m = calculateFull(modified, rev, mkt, ltv, wh, oneTime, monthly, team, proj);
    const pctLabel = Math.round((mult - 1) * 100);
    return {
      label: `${pctLabel >= 0 ? '+' : ''}${pctLabel}%`,
      profit: Math.round(m.netProfit),
      revenue: Math.round(m.totalRevenue),
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

export function breakEvenChartDataFull(
  params: InputParams,
  rev: RevenueParams,
  mkt: MarketingParams,
  ltv: LTVParams,
  wh: WarehouseParams,
  oneTime: ExpenseItem[],
  monthly: ExpenseItem[],
  team: TeamMember[],
  proj: ProjectionSettings,
) {
  const baseline = calculateFull(params, rev, mkt, ltv, wh, oneTime, monthly, team, proj);
  const maxOrders = Math.max((baseline.effectiveOrders + baseline.repeatOrders) * 2, 200);
  const step = Math.max(1, Math.round(maxOrders / 20));
  const data: { orders: number; revenue: number; totalCosts: number }[] = [];
  for (let o = 0; o <= maxOrders; o += step) {
    const revenuePerOrder = baseline.effectiveAverageCheck;
    const repeatRevenuePerOrder = baseline.repeatOrders > 0 ? baseline.repeatRevenue / baseline.repeatOrders : 0;
    const avgRevenuePerOrder = baseline.repeatOrders > 0
      ? safeDivide((baseline.effectiveOrders * revenuePerOrder) + (baseline.repeatOrders * repeatRevenuePerOrder), baseline.effectiveOrders + baseline.repeatOrders)
      : revenuePerOrder;
    data.push({
      orders: o,
      revenue: o * avgRevenuePerOrder,
      totalCosts: baseline.totalFixedCosts + baseline.effectiveMarketingBudget + o * (params.costPerOrder + baseline.effectiveVariableCostPerOrder),
    });
  }
  return data;
}

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
