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
      description: `Маржа на заказ (${fmt(m.marginPerOrder)} ₽) отрицательная. Средний чек (${fmt(m.effectiveAverageCheck)} ₽) не покрывает себестоимость (${fmt(p.costPerOrder)} ₽) и переменные расходы (${fmt(m.effectiveVariableCostPerOrder)} ₽). Поднимите чек или снизьте себестоимость.`,
      type: 'danger',
    });
  }

  if (!m.isProfitable && m.isBreakEvenPossible) {
    recs.push({
      priority: pr++,
      title: 'Магазин убыточен',
      description: `Убыток ${fmt(Math.abs(m.netProfit))} ₽/мес. Для безубыточности нужно ${m.breakEvenOrders ?? '—'} заказов (сейчас ${m.effectiveOrders}). Необходимый трафик: ${m.breakEvenTraffic ? fmt(m.breakEvenTraffic) : '—'} (сейчас ${fmt(p.traffic)}).`,
      type: 'danger',
    });
  }

  if (m.profitPerOrder < 0 && m.isBreakEvenPossible) {
    recs.push({
      priority: pr++,
      title: 'Убыток на каждом заказе',
      description: `Каждый заказ приносит убыток ${fmt(Math.abs(Math.round(m.profitPerOrder)))} ₽. Увеличьте объём или сократите фиксированные/маркетинговые расходы.`,
      type: 'danger',
    });
  }

  if (m.grossMarginPercent < 30 && m.grossMarginPercent > 0) {
    recs.push({
      priority: pr++,
      title: 'Низкая валовая маржа',
      description: `Валовая маржа ${m.grossMarginPercent.toFixed(1)}% — ниже 30%. Снизьте себестоимость или поднимите чек.`,
      type: 'warning',
    });
  }

  if (p.conversionPercent < 1.5) {
    const neededConv = m.isBreakEvenPossible && m.breakEvenOrders
      ? Math.max(1.5, (m.breakEvenOrders / p.traffic) * 100)
      : 1.5;
    recs.push({
      priority: pr++,
      title: 'Низкая конверсия',
      description: `Конверсия ${p.conversionPercent}% ниже нормы 1.5–3% для косметики. Целевая: ${neededConv.toFixed(1)}%. Улучшите карточки товаров, добавьте отзывы, упростите checkout.`,
      type: 'warning',
    });
  }

  if (m.cac > 0 && m.cac > m.effectiveAverageCheck * 0.3) {
    recs.push({
      priority: pr++,
      title: 'Высокая стоимость привлечения (CAC)',
      description: `CAC ${fmt(Math.round(m.cac))} ₽ — это ${(m.cac / m.effectiveAverageCheck * 100).toFixed(0)}% от среднего чека. Снизьте маркетинг или повысьте конверсию.`,
      type: 'warning',
    });
  }

  if (m.effectiveMarketingBudget > m.totalRevenue * 0.3 && m.totalRevenue > 0) {
    recs.push({
      priority: pr++,
      title: 'Маркетинг съедает слишком много',
      description: `Маркетинг (${fmt(m.effectiveMarketingBudget)} ₽) — ${(m.effectiveMarketingBudget / m.totalRevenue * 100).toFixed(0)}% от выручки. Норма 15–25%.`,
      type: 'warning',
    });
  }

  if (m.hasLTVData && m.ltvCacRatio < 3 && m.ltvCacRatio > 0) {
    recs.push({
      priority: pr++,
      title: 'LTV/CAC ниже нормы',
      description: `LTV/CAC = ${m.ltvCacRatio.toFixed(1)} (норма > 3). Увеличьте долю повторных покупок или снизьте CAC. Текущий LTV: ${fmt(Math.round(m.ltv))} ₽, CAC: ${fmt(Math.round(m.cac))} ₽.`,
      type: 'warning',
    });
  }

  if (m.hasLTVData && ltv.repeatPurchaseRatePercent < 20) {
    recs.push({
      priority: pr++,
      title: 'Низкий процент повторных покупок',
      description: `Только ${ltv.repeatPurchaseRatePercent}% клиентов возвращаются. Для косметики норма 25–40%. Внедрите email-маркетинг, программу лояльности, подписку.`,
      type: 'warning',
    });
  }

  if (rev.returnRatePercent > 10) {
    recs.push({
      priority: pr++,
      title: 'Высокий процент возвратов',
      description: `Возвраты ${rev.returnRatePercent}% — выше нормы (5–8%). Потери: ${fmt(Math.round(m.returnCost))} ₽/мес. Улучшите описания товаров и фото.`,
      type: 'warning',
    });
  }

  if (rev.cancelRatePercent > 5) {
    recs.push({
      priority: pr++,
      title: 'Высокий процент отмен',
      description: `Отмены ${rev.cancelRatePercent}% — потеря ${m.cancelledOrders} заказов/мес. Ускорьте обработку, отправляйте подтверждения, звоните клиентам.`,
      type: 'info',
    });
  }

  if (m.paybackMonths !== null && m.paybackMonths > 18) {
    recs.push({
      priority: pr++,
      title: 'Долгая окупаемость',
      description: `Срок окупаемости ${m.paybackMonths} мес. Норма для e-commerce — 6–12 месяцев. Увеличьте прибыль или пересмотрите стартовые вложения.`,
      type: 'info',
    });
  }

  if (m.frozenInventory > m.totalRevenue * 0.5 && m.totalRevenue > 0) {
    recs.push({
      priority: pr++,
      title: 'Много денег заморожено в товарах',
      description: `В запасах заморожено ${fmt(m.frozenInventory)} ₽ — ${(m.frozenInventory / m.totalRevenue * 100).toFixed(0)}% от выручки. Оптимизируйте ассортимент и оборачиваемость.`,
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
