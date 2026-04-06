import { InputParams, FullMetrics, LTVParams, RevenueParams, Recommendation } from './types';
import { fmt } from './utils';

export function generateRecommendations(
  p: InputParams,
  m: FullMetrics,
  ltv: LTVParams,
  rev: RevenueParams,
): Recommendation[] {
  const recs: Recommendation[] = [];
  let pr = 0;

  if (!m.isBreakEvenPossible) {
    recs.push({
      priority: pr++,
      title: 'Юнит-экономика отрицательная',
      description: `Contribution margin (${fmt(m.contributionMargin)} ₽) отрицательная. Минимальный требуемый чек: ${m.requiredAvgCheck ? fmt(m.requiredAvgCheck) : '—'} ₽.`,
      type: 'danger',
    });
  }

  if (!m.isProfitable && m.isBreakEvenPossible) {
    recs.push({
      priority: pr++,
      title: 'Магазин убыточен',
      description: `Убыток ${fmt(Math.abs(m.netProfit))} ₽/мес. Для безубыточности нужно ${m.breakEvenOrders ?? '—'} заказов, сейчас ${m.effectiveOrders}.`,
      type: 'danger',
    });
  }

  if (m.profitPerOrder < 0 && m.isBreakEvenPossible) {
    recs.push({
      priority: pr++,
      title: 'Убыток на каждом заказе',
      description: `Каждый заказ приносит убыток ${fmt(Math.abs(Math.round(m.profitPerOrder)))} ₽.`,
      type: 'danger',
    });
  }

  if (m.grossMarginPercent < 30 && m.grossMarginPercent > 0) {
    recs.push({
      priority: pr++,
      title: 'Низкая валовая маржа',
      description: `Валовая маржа ${m.grossMarginPercent.toFixed(1)}% — ниже 30%. Стоит пересмотреть закупку и скидочную политику.`,
      type: 'warning',
    });
  }

  if (p.conversionPercent < 1.5) {
    const neededConv = m.requiredConversion ? Math.max(1.5, m.requiredConversion) : 1.5;
    recs.push({
      priority: pr++,
      title: 'Низкая конверсия',
      description: `Конверсия ${p.conversionPercent}% ниже нормы 1.5–3%. Целевая конверсия для выхода в плюс: ${neededConv.toFixed(1)}%.`,
      type: 'warning',
    });
  }

  if (m.cac > 0 && m.cac > p.averageCheck * 0.3) {
    recs.push({
      priority: pr++,
      title: 'Высокая стоимость привлечения (CAC)',
      description: `CAC ${fmt(Math.round(m.cac))} ₽ — это ${(m.cac / Math.max(p.averageCheck, 1) * 100).toFixed(0)}% от среднего чека.`,
      type: 'warning',
    });
  }

  if (m.effectiveMarketingBudget > m.revenue * 0.3 && m.revenue > 0) {
    recs.push({
      priority: pr++,
      title: 'Маркетинг съедает слишком много',
      description: `Маркетинг (${fmt(m.effectiveMarketingBudget)} ₽) — ${(m.effectiveMarketingBudget / m.revenue * 100).toFixed(0)}% от выручки.`,
      type: 'warning',
    });
  }

  if (m.hasLTVData && m.ltvCacRatio < 3 && m.ltvCacRatio > 0) {
    recs.push({
      priority: pr++,
      title: 'LTV/CAC ниже нормы',
      description: `LTV/CAC = ${m.ltvCacRatio.toFixed(1)}. Цель — выше 3.`,
      type: 'warning',
    });
  }

  if (m.hasLTVData && ltv.repeatPurchaseRatePercent < 20) {
    recs.push({
      priority: pr++,
      title: 'Низкий процент повторных покупок',
      description: `Возвращается только ${ltv.repeatPurchaseRatePercent}% клиентов. Для косметики чаще ориентируются на 25–40%.`,
      type: 'warning',
    });
  }

  if (rev.returnRatePercent > 10) {
    recs.push({
      priority: pr++,
      title: 'Высокий процент возвратов',
      description: `Возвраты ${rev.returnRatePercent}% — выше нормы. Потери на возвратах: ${fmt(Math.round(m.returnCost))} ₽/мес.`,
      type: 'warning',
    });
  }

  if (rev.cancelRatePercent > 5) {
    recs.push({
      priority: pr++,
      title: 'Высокий процент отмен',
      description: `Отмены ${rev.cancelRatePercent}% — это потеря ${m.cancelledOrders} заказов в месяц.`,
      type: 'info',
    });
  }

  if (m.paybackMonths !== null && m.paybackMonths > 18) {
    recs.push({
      priority: pr++,
      title: 'Долгая окупаемость',
      description: `Окупаемость ${m.paybackMonths} мес. Для e-commerce это долго.`,
      type: 'info',
    });
  }

  if (m.frozenInventory > m.revenue * 0.5 && m.revenue > 0) {
    recs.push({
      priority: pr++,
      title: 'Много денег заморожено в товарах',
      description: `В запасах заморожено ${fmt(m.frozenInventory)} ₽ — ${(m.frozenInventory / m.revenue * 100).toFixed(0)}% от выручки.`,
      type: 'info',
    });
  }

  if (m.isProfitable) {
    recs.push({
      priority: 100,
      title: 'Магазин прибыльный',
      description: `Чистая прибыль ${fmt(Math.round(m.netProfit))} ₽/мес. Маржа на заказ: ${fmt(Math.round(m.profitPerOrder))} ₽. ROMI: ${m.romi.toFixed(0)}%.${m.hasLTVData ? ` LTV: ${fmt(Math.round(m.ltv))} ₽.` : ''}`,
      type: 'success',
    });
  }

  return recs.sort((a, b) => a.priority - b.priority);
}
