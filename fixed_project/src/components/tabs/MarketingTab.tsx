import { useStore } from '../../store';
import { InputGroup, SectionCard, Badge } from '../shared/InputGroup';
import { fmtCurrency, fmtPercent } from '../../utils';

export function MarketingTab() {
  const { marketing, setMarketing, params } = useStore();

  const fields: { key: keyof typeof marketing; label: string; tooltip: string; suffix: string; step: number; max?: number; isPercent?: boolean }[] = [
    { key: 'cpc', label: 'CPC (стоимость клика)', tooltip: 'Средняя стоимость одного клика в рекламе', suffix: '₽', step: 1, max: 500 },
    { key: 'organicTrafficPercent', label: 'Органический трафик', tooltip: 'Доля трафика из поиска (SEO)', suffix: '%', step: 5, max: 100, isPercent: true },
    { key: 'paidTrafficPercent', label: 'Платный трафик', tooltip: 'Доля трафика из платной рекламы', suffix: '%', step: 5, max: 100, isPercent: true },
    { key: 'socialTrafficPercent', label: 'Соцсети', tooltip: 'Доля трафика из соцсетей', suffix: '%', step: 5, max: 100, isPercent: true },
    { key: 'bloggersBudget', label: 'Бюджет на блогеров', tooltip: 'Расходы на инфлюенсеров / посевы', suffix: '₽', step: 5000 },
    { key: 'emailBudget', label: 'Email / CRM', tooltip: 'Расходы на email-маркетинг, CRM-рассылки', suffix: '₽', step: 1000 },
    { key: 'seoBudget', label: 'SEO-бюджет', tooltip: 'Расходы на поисковую оптимизацию', suffix: '₽', step: 5000 },
  ];

  const isFilled = Object.values(marketing).some(v => v > 0);
  const totalChannels = marketing.bloggersBudget + marketing.emailBudget + marketing.seoBudget;
  const paidFromBase = params.marketingBudget - totalChannels;

  return (
    <div className="space-y-4">
      <SectionCard title="Маркетинг — детализация">
        <div className="flex items-center gap-2 mb-4">
          <Badge color={isFilled ? 'green' : 'gray'}>{isFilled ? 'Данные заполнены' : 'Необязательные поля'}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <InputGroup
              key={f.key}
              label={f.label}
              tooltip={f.tooltip}
              value={marketing[f.key]}
              onChange={(v) => setMarketing(f.key, v)}
              suffix={f.suffix}
              step={f.step}
              max={f.max}
              isPercent={f.isPercent}
            />
          ))}
        </div>
      </SectionCard>

      {isFilled && (
        <SectionCard title="Сводка по маркетингу">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <Stat label="Общий бюджет" value={fmtCurrency(params.marketingBudget)} />
            <Stat label="Блогеры" value={fmtCurrency(marketing.bloggersBudget)} />
            <Stat label="Email/CRM" value={fmtCurrency(marketing.emailBudget)} />
            <Stat label="SEO" value={fmtCurrency(marketing.seoBudget)} />
            <Stat label="Платная реклама" value={fmtCurrency(Math.max(0, paidFromBase))} />
            {marketing.cpc > 0 && (
              <Stat label="Кликов за бюджет" value={Math.round(params.marketingBudget / marketing.cpc).toLocaleString('ru-RU')} />
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
