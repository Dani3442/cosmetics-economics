import {
  InputParams, RevenueParams, MarketingParams, LTVParams,
  WarehouseParams, ProjectionSettings, ExpenseItem, TeamMember,
  CalculatedMetrics, FullMetrics, MonthlyProjection,
} from './types';
import { safe, safeDivide } from './utils';

export interface CalcContext {
  params: InputParams;
  rev: RevenueParams;
  mkt: MarketingParams;
  ltv: LTVParams;
  wh: WarehouseParams;
  oneTime: ExpenseItem[];
  monthly: ExpenseItem[];
  team: TeamMember[];
  proj: ProjectionSettings;
}

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

  const paybackMonths = profit > 0 && p.initialInvestment > 0
    ? Math.ceil(p.initialInvestment / profit)
    : null;

  const romi = p.marketingBudget > 0
    ? safe(safeDivide(revenue - cogs - p.marketingBudget, p.marketingBudget) * 100)
    : 0;

  return { orders, revenue, cogs, totalVariableCosts, grossProfit, grossMarginPercent, profit, profitPerOrder, cac, breakEvenOrders, breakEvenTraffic, paybackMonths, romi, marginPerOrder, isBreakEvenPossible, isProfitable: profit > 0 };
}

function buildContext(params: InputParams, rev: RevenueParams, mkt: MarketingParams, ltv: LTVParams, wh: WarehouseParams, oneTime: ExpenseItem[], monthly: ExpenseItem[], team: TeamMember[], proj: ProjectionSettings): CalcContext {
  return { params, rev, mkt, ltv, wh, oneTime, monthly, team, proj };
}

export function calculateFull(params: InputParams, rev: RevenueParams, mkt: MarketingParams, ltv: LTVParams, wh: WarehouseParams, oneTime: ExpenseItem[], monthly: ExpenseItem[], team: TeamMember[], proj: ProjectionSettings): FullMetrics {
  const base = calculate(params);
  const hasRevPricing = rev.avgProductPrice > 0 && rev.avgItemsPerOrder > 0;
  const hasRevDetail = hasRevPricing || rev.cancelRatePercent > 0 || rev.returnRatePercent > 0 || rev.discountSharePercent > 0;
  const hasLTVData = ltv.repeatPurchaseRatePercent > 0 || ltv.avgOrdersPerCustomerPerYear > 0 || ltv.customerLifetimeMonths > 0 || ltv.repeatOrderAvgCheck > 0;
  const hasMarketingDetail = mkt.cpc > 0 || mkt.bloggersBudget > 0 || mkt.emailBudget > 0 || mkt.seoBudget > 0 || mkt.paidTrafficPercent > 0;
  const hasWarehouseDetail = wh.storageCostMonthly > 0 || wh.assemblyCostPerOrder > 0 || wh.packagingCostPerOrder > 0 || wh.deliveryCostPerOrder > 0 || wh.returnProcessingCost > 0;
  const hasDetailedExpenses = monthly.some((e) => e.amount > 0) || team.some((t) => t.salary > 0);

  const effectiveCheck = hasRevPricing ? rev.avgProductPrice * rev.avgItemsPerOrder : params.averageCheck;
  const paidClicks = hasMarketingDetail && mkt.cpc > 0 && mkt.paidTrafficPercent > 0 ? Math.round(params.traffic * (mkt.paidTrafficPercent / 100)) : 0;
  const paidAdCost = paidClicks * mkt.cpc;
  const channelsBudget = mkt.bloggersBudget + mkt.emailBudget + mkt.seoBudget;
  const effectiveMarketingBudget = hasMarketingDetail ? paidAdCost + channelsBudget : params.marketingBudget;

  const cancelRate = rev.cancelRatePercent / 100;
  const returnRate = rev.returnRatePercent / 100;
  const baseOrders = base.orders;
  const effectiveOrders = hasRevDetail ? Math.max(0, Math.round(baseOrders * (1 - cancelRate))) : baseOrders;
  const cancelledOrders = Math.max(baseOrders - effectiveOrders, 0);

  const preDiscountRevenue = effectiveOrders * effectiveCheck;
  const discountImpact = safe(preDiscountRevenue * (rev.discountSharePercent / 100) * (rev.avgDiscountPercent / 100));
  const revenueAfterDiscounts = preDiscountRevenue - discountImpact;
  const returnedRevenue = revenueAfterDiscounts * returnRate;
  const effectiveRevenue = hasRevDetail ? Math.max(0, revenueAfterDiscounts - returnedRevenue) : base.revenue;

  const fulfillmentCostPerOrder = wh.assemblyCostPerOrder + wh.packagingCostPerOrder + wh.deliveryCostPerOrder;
  const effectiveVariableCostPerOrder = params.variableCostPerOrder + (hasWarehouseDetail ? fulfillmentCostPerOrder : 0);
  const returnProcessingCost = effectiveOrders * returnRate * wh.returnProcessingCost;
  const returnCost = effectiveOrders * returnRate * params.costPerOrder + returnProcessingCost;

  const repeatRate = ltv.repeatPurchaseRatePercent / 100;
  const ordersPerYear = Math.max(ltv.avgOrdersPerCustomerPerYear || 1, 1);
  const lifetimeMonths = Math.max(ltv.customerLifetimeMonths || 12, 1);
  const repeatCheck = ltv.repeatOrderAvgCheck || effectiveCheck;
  const repeatOrdersShare = hasLTVData ? safe(Math.min(0.95, repeatRate * Math.max(ordersPerYear - 1, 0) / ordersPerYear)) : 0;
  const repeatOrders = Math.round(effectiveOrders * repeatOrdersShare);
  const newCustomers = Math.max(effectiveOrders - repeatOrders, 0);
  const repeatCustomers = repeatOrders;
  const repeatRevenue = repeatOrders * repeatCheck;

  const firstOrderContribution = effectiveCheck - params.costPerOrder - effectiveVariableCostPerOrder - safe(safeDivide(effectiveMarketingBudget, Math.max(newCustomers, effectiveOrders, 1)));
  const repeatOrderContribution = repeatCheck - params.costPerOrder - effectiveVariableCostPerOrder;
  const expectedRepeatOrdersLifetime = hasLTVData ? repeatRate * Math.max(ordersPerYear - 1, 0) * (lifetimeMonths / 12) : 0;
  const ltvValue = hasLTVData ? safe(firstOrderContribution + expectedRepeatOrdersLifetime * repeatOrderContribution) : safe(effectiveCheck - params.costPerOrder - effectiveVariableCostPerOrder);

  const totalTeamCost = team.reduce((s, member) => s + member.salary * (1 + member.taxPercent / 100), 0);
  const totalOneTimeCosts = oneTime.reduce((s, e) => s + e.amount, 0);
  const detailedMonthlyCosts = monthly.reduce((s, e) => s + e.amount, 0);
  const warehouseMonthlyCost = wh.storageCostMonthly;
  const frozenInventory = wh.frozenInventoryAmount;
  const effectiveFixedCosts = params.fixedCosts + (hasDetailedExpenses ? detailedMonthlyCosts + totalTeamCost : 0) + (hasWarehouseDetail ? warehouseMonthlyCost : 0);

  const totalRevenue = effectiveRevenue + repeatRevenue;
  const totalOrderCount = effectiveOrders + repeatOrders;
  const cogs = totalOrderCount * params.costPerOrder;
  const totalVariableCosts = totalOrderCount * effectiveVariableCostPerOrder + returnProcessingCost;
  const grossProfit = totalRevenue - cogs;
  const grossMarginPercent = safe(safeDivide(grossProfit, totalRevenue) * 100);
  const contributionMargin = effectiveCheck - params.costPerOrder - effectiveVariableCostPerOrder;
  const contributionMarginPercent = safe(safeDivide(contributionMargin, effectiveCheck) * 100);
  const isBreakEvenPossible = contributionMargin > 0;

  const operatingProfit = totalRevenue - cogs - totalVariableCosts - effectiveMarketingBudget - effectiveFixedCosts - returnCost;
  const taxRate = proj.taxRatePercent / 100;
  const taxAmount = operatingProfit > 0 ? operatingProfit * taxRate : 0;
  const netProfit = operatingProfit - taxAmount;
  const profitPerOrder = safe(safeDivide(netProfit, Math.max(effectiveOrders, 1)));
  const effectiveCac = safe(safeDivide(effectiveMarketingBudget, Math.max(newCustomers, effectiveOrders, 1)));
  const ltvCacRatio = hasLTVData ? safe(safeDivide(ltvValue, effectiveCac)) : 0;
  const effectiveRomi = effectiveMarketingBudget > 0 ? safe(safeDivide(totalRevenue - cogs - effectiveMarketingBudget, effectiveMarketingBudget) * 100) : 0;

  const totalFixedLike = effectiveMarketingBudget + effectiveFixedCosts;
  const breakEvenOrders = isBreakEvenPossible ? Math.ceil(totalFixedLike / contributionMargin) : null;
  const breakEvenTraffic = isBreakEvenPossible && params.conversionPercent > 0 ? Math.ceil(breakEvenOrders! / (params.conversionPercent / 100)) : null;
  const breakEvenRevenue = contributionMarginPercent > 0 ? safe(totalFixedLike / (contributionMarginPercent / 100)) : null;
  const requiredConversion = contributionMargin > 0 && params.traffic > 0 ? safe(totalFixedLike / (contributionMargin * params.traffic) * 100) : null;
  const requiredAvgCheck = effectiveOrders > 0 ? safe((totalFixedLike / effectiveOrders) + params.costPerOrder + effectiveVariableCostPerOrder) : null;

  const effectiveStartup = params.initialInvestment + totalOneTimeCosts;
  const cashBurnMonthly = netProfit < 0 ? Math.abs(netProfit) : 0;
  const cashRunwayMonths = cashBurnMonthly > 0 ? Math.ceil(effectiveStartup / cashBurnMonthly) : null;
  const workingCapitalNeed = effectiveFixedCosts * 3 + frozenInventory;
  const paybackMonths = netProfit > 0 && effectiveStartup > 0 ? Math.ceil(effectiveStartup / netProfit) : null;
  const totalCosts = cogs + totalVariableCosts + effectiveMarketingBudget + effectiveFixedCosts + returnCost + taxAmount;

  return {
    ...base,
    orders: effectiveOrders,
    revenue: totalRevenue,
    cogs,
    totalVariableCosts,
    grossProfit,
    grossMarginPercent,
    profit: netProfit,
    profitPerOrder,
    cac: effectiveCac,
    breakEvenOrders,
    breakEvenTraffic,
    paybackMonths,
    romi: effectiveRomi,
    marginPerOrder: contributionMargin,
    isBreakEvenPossible,
    isProfitable: netProfit > 0,
    effectiveOrders,
    effectiveRevenue,
    returnCost,
    cancelledOrders,
    discountImpact,
    ltv: ltvValue,
    ltvCacRatio,
    repeatRevenue,
    firstOrderProfit: firstOrderContribution,
    newCustomers,
    repeatCustomers,
    totalTeamCost,
    totalOneTimeCosts,
    detailedMonthlyCosts,
    warehouseMonthlyCost,
    fulfillmentCostPerOrder,
    effectiveMarketingBudget,
    effectiveFixedCosts,
    effectiveVariableCostPerOrder,
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

export function generateProjections(params: InputParams, rev: RevenueParams, mkt: MarketingParams, ltvP: LTVParams, wh: WarehouseParams, oneTime: ExpenseItem[], monthly: ExpenseItem[], team: TeamMember[], proj: ProjectionSettings): MonthlyProjection[] {
  const result: MonthlyProjection[] = [];
  let cumProfit = 0;
  const startup = params.initialInvestment + oneTime.reduce((s, e) => s + e.amount, 0);
  let cumCash = -startup;
  for (let month = 1; month <= proj.months; month++) {
    const growth = Math.pow(1 + proj.trafficGrowthPercent / 100, month - 1);
    const convGrowth = Math.pow(1 + proj.conversionImprovementPercent / 100, month - 1);
    const checkGrowth = Math.pow(1 + proj.avgCheckGrowthPercent / 100, month - 1);
    const monthParams: InputParams = { ...params, traffic: Math.round(params.traffic * growth), conversionPercent: Math.min(params.conversionPercent * convGrowth, 15), averageCheck: params.averageCheck * checkGrowth };
    const full = calculateFull(monthParams, rev, mkt, ltvP, wh, oneTime, monthly, team, proj);
    cumProfit += full.netProfit;
    cumCash += full.netProfit;
    result.push({ month, traffic: monthParams.traffic, orders: full.effectiveOrders, revenue: full.revenue, cogs: full.cogs, grossProfit: full.grossProfit, marketing: full.effectiveMarketingBudget, variableCosts: full.totalVariableCosts, fixedCosts: full.effectiveFixedCosts, operatingProfit: full.operatingProfit, tax: full.taxAmount, netProfit: full.netProfit, cumulativeProfit: cumProfit, cumulativeCash: cumCash });
  }
  return result;
}

export function sensitivityData(ctx: CalcContext, param: keyof InputParams, steps: number[]): { label: string; profit: number; revenue: number }[] {
  return steps.map((mult) => {
    const modifiedParams: InputParams = { ...ctx.params, [param]: ctx.params[param] * mult };
    const metrics = calculateFull(modifiedParams, ctx.rev, ctx.mkt, ctx.ltv, ctx.wh, ctx.oneTime, ctx.monthly, ctx.team, ctx.proj);
    const pctLabel = Math.round((mult - 1) * 100);
    return { label: `${pctLabel >= 0 ? '+' : ''}${pctLabel}%`, profit: Math.round(metrics.netProfit), revenue: Math.round(metrics.revenue) };
  });
}

export function breakEvenChartData(ctx: CalcContext) {
  const conversion = ctx.params.conversionPercent / 100;
  const currentOrders = Math.round(ctx.params.traffic * conversion);
  const maxOrders = Math.max(currentOrders * 2, 200);
  const step = Math.max(1, Math.round(maxOrders / 20));
  const data: { orders: number; revenue: number; totalCosts: number }[] = [];
  for (let orders = 0; orders <= maxOrders; orders += step) {
    const traffic = conversion > 0 ? Math.ceil(orders / conversion) : 0;
    const metrics = calculateFull({ ...ctx.params, traffic }, ctx.rev, ctx.mkt, ctx.ltv, ctx.wh, ctx.oneTime, ctx.monthly, ctx.team, ctx.proj);
    data.push({ orders, revenue: metrics.revenue, totalCosts: metrics.totalCosts });
  }
  return data;
}

export function calculateScenario(params: InputParams, multipliers: Record<string, number>, rev: RevenueParams, mkt: MarketingParams, ltvP: LTVParams, wh: WarehouseParams, oneTime: ExpenseItem[], monthly: ExpenseItem[], team: TeamMember[], proj: ProjectionSettings): FullMetrics {
  const modifiedParams: InputParams = { ...params, traffic: params.traffic * (multipliers.traffic ?? 1), conversionPercent: params.conversionPercent * (multipliers.conversionPercent ?? 1), averageCheck: params.averageCheck * (multipliers.averageCheck ?? 1), costPerOrder: params.costPerOrder * (multipliers.costPerOrder ?? 1), marketingBudget: params.marketingBudget * (multipliers.marketingBudget ?? 1) };
  const marketingBudgetMultiplier = multipliers.marketingBudget ?? 1;
  const modifiedMarketing: MarketingParams = { ...mkt, bloggersBudget: mkt.bloggersBudget * marketingBudgetMultiplier, emailBudget: mkt.emailBudget * marketingBudgetMultiplier, seoBudget: mkt.seoBudget * marketingBudgetMultiplier, cpc: mkt.cpc * marketingBudgetMultiplier };
  return calculateFull(modifiedParams, rev, modifiedMarketing, ltvP, wh, oneTime, monthly, team, proj);
}

export function makeCalcContext(params: InputParams, rev: RevenueParams, mkt: MarketingParams, ltv: LTVParams, wh: WarehouseParams, oneTime: ExpenseItem[], monthly: ExpenseItem[], team: TeamMember[], proj: ProjectionSettings): CalcContext {
  return buildContext(params, rev, mkt, ltv, wh, oneTime, monthly, team, proj);
}
