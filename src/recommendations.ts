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

  // Critical: negative unit economics
  if (!m.isBreakEvenPossible) {
    recs.push({
      priority: pr++,
      title: 'Юнит-экономика отрицательная',
      description: `Маржа на заказ (${fmt(m.marginPerOrder)} ₽) отрицательная. Средний чек (${fmt(p.averageCheck)} ₽) не покрывает себестоимость (${fmt(p.costPerOrder)} ₽) и переменные расходы (${fmt(p.variableCostPerOrder)} ₽). Поднимите чек минимум до ${fmt(p.costPerOrder + p.variableCostPerOrder + 1)} ₽ или снизьте себестоимость.`,
      type: 'danger',
    });
  }

  // Unprofitable
  if (!m.isProfitable && m.isBreakEvenPossible) {
    recs.push({
      priority: pr++,
      title: 'Магазин убыточен',
      description: `Убыток ${fmt(Math.abs(m.netProfit))} ₽/мес. Для безубыточности нужно ${m.breakEvenOrders ?? '—'} заказов (сейчас ${m.effectiveOrders}). Необходимый трафик: ${m.breakEvenTraffic ? fmt(m.breakEvenTraffic) : '—'} (сейчас ${fmt(p.traffic)}).`,
      type: 'danger',
    });
  }

  // Negative profit per order
  if (m.profitPerOrder < 0 && m.isBreakEvenPossible) {
    recs.push({
      priority: pr++,
      title: 'Убыток на каждом заказе',
      description: `Каждый заказ приносит убыток ${fmt(Math.abs(Math.round(m.profitPerOrder)))} ₽. Увеличьте объём или сократите фиксированные/маркетинговые расходы.`,
      type: 'danger',
    });
  }

  // Low gross margin
  if (m.grossMarginPercent < 30 && m.grossMarginPercent > 0) {
    recs.push({
      priority: pr++,
      title: 'Низкая валовая маржа',
      description: `Валовая маржа ${m.grossMarginPercent.toFixed(1)}% — ниже 30%. Снизьте себестоимость до ${fmt(Math.round(p.averageCheck * 0.6))} ₽ или поднимите чек до ${fmt(Math.round(p.costPerOrder / 0.6))} ₽.`,
      type: 'warning',
    });
  }

  // Low conversion
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

  // High CAC
  if (m.cac > 0 && m.cac > p.averageCheck * 0.3) {
    recs.push({
      priority: pr++,
      title: 'Высокая стоимость привлечения (CAC)',
      description: `CAC ${fmt(Math.round(m.cac))} ₽ — это ${(m.cac / p.averageCheck * 100).toFixed(0)}% от среднего чека. Снизьте маркетинг до ${fmt(Math.round(p.averageCheck * 0.2 * m.orders))} ₽/мес или повысьте конверсию.`,
      type: 'warning',
    });
  }

  // Marketing share too high
  if (p.marketingBudget > m.revenue * 0.3 && m.revenue > 0) {
    recs.push({
      priority: pr++,
      title: 'Маркетинг съедает слишком много',
      description: `Маркетинг (${fmt(p.marketingBudget)} ₽) — ${(p.marketingBudget / m.revenue * 100).toFixed(0)}% от выручки. Норма 15–25%. Сократите до ${fmt(Math.round(m.revenue * 0.2))} ₽.`,
      type: 'warning',
    });
  }

  // LTV too low vs CAC
  if (m.hasLTVData && m.ltvCacRatio < 3 && m.ltvCacRatio > 0) {
    recs.push({
      priority: pr++,
      title: 'LTV/CAC ниже нормы',
      description: `LTV/CAC = ${m.ltvCacRatio.toFixed(1)} (норма > 3). Увеличьте долю повторных покупок или снизьте CAC. Текущий LTV: ${fmt(Math.round(m.ltv))} ₽, CAC: ${fmt(Math.round(m.cac))} ₽.`,
      type: 'warning',
    });
  }

  // Low repeat rate
  if (m.hasLTVData && ltv.repeatPurchaseRatePercent < 20) {
    recs.push({
      priority: pr++,
      title: 'Низкий процент повторных покупок',
      description: `Только ${ltv.repeatPurchaseRatePercent}% клиентов возвращаются. Для косметики норма 25–40%. Внедрите email-маркетинг, программу лояльности, подписку.`,
      type: 'warning',
    });
  }

  // High returns
  if (rev.returnRatePercent > 10) {
    recs.push({
      priority: pr++,
      title: 'Высокий процент возвратов',
      description: `Возвраты ${rev.returnRatePercent}% — выше нормы (5–8%). Потери: ${fmt(Math.round(m.returnCost))} ₽/мес. Улучшите описания товаров, фото, размерные сетки.`,
      type: 'warning',
    });
  }

  // High cancellation
  if (rev.cancelRatePercent > 5) {
    recs.push({
      priority: pr++,
      title: 'Высокий процент отмен',
      description: `Отмены ${rev.cancelRatePercent}% — потеря ${m.cancelledOrders} заказов/мес. Ускорьте обработку, отправляйте подтверждения, звоните клиентам.`,
      type: 'info',
    });
  }

  // Long payback
  if (m.paybackMonths !== null && m.paybackMonths > 18) {
    recs.push({
      priority: pr++,
      title: 'Долгая окупаемость',
      description: `Срок окупаемости ${m.paybackMonths} мес. Норма для e-commerce — 6–12 месяцев. Увеличьте прибыль или пересмотрите стартовые вложения.`,
      type: 'info',
    });
  }

  // Frozen inventory warning
  if (m.frozenInventory > m.revenue * 0.5 && m.revenue > 0) {
    recs.push({
      priority: pr++,
      title: 'Много денег заморожено в товарах',
      description: `В запасах заморожено ${fmt(m.frozenInventory)} ₽ — ${(m.frozenInventory / m.revenue * 100).toFixed(0)}% от выручки. Оптимизируйте ассортимент и оборачиваемость.`,
      type: 'info',
    });
  }

  // Positive
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
