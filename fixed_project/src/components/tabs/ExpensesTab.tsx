import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store';
import { InputGroup, SectionCard, Badge } from '../shared/InputGroup';
import { fmtCurrency } from '../../utils';

export function ExpensesTab() {
  const {
    oneTimeExpenses, addOneTimeExpense, updateOneTimeExpense, removeOneTimeExpense,
    monthlyExpenses, addMonthlyExpense, updateMonthlyExpense, removeMonthlyExpense,
    teamMembers, addTeamMember, updateTeamMember, removeTeamMember,
    warehouse, setWarehouse,
  } = useStore();

  const totalOneTime = oneTimeExpenses.reduce((s, e) => s + e.amount, 0);
  const totalMonthly = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const totalTeam = teamMembers.reduce((s, m) => s + m.salary * (1 + m.taxPercent / 100), 0);
  const hasSomething = totalOneTime > 0 || totalMonthly > 0 || teamMembers.length > 0;

  return (
    <div className="space-y-4">
      {/* One-time expenses */}
      <SectionCard title="Разовые расходы (стартовые вложения)">
        <Badge color={totalOneTime > 0 ? 'green' : 'gray'}>
          Итого: {fmtCurrency(totalOneTime)}
        </Badge>
        <div className="mt-3 space-y-2">
          {oneTimeExpenses.map((e) => (
            <div key={e.id} className="flex items-center gap-2">
              <input
                type="text"
                value={e.name}
                onChange={(ev) => updateOneTimeExpense(e.id, 'name', ev.target.value)}
                placeholder="Название"
                className="input-field flex-1"
              />
              <input
                type="text"
                value={e.amount || ''}
                onChange={(ev) => {
                  const v = parseFloat(ev.target.value.replace(/\s/g, '')) || 0;
                  updateOneTimeExpense(e.id, 'amount', v);
                }}
                placeholder="0"
                className="input-field w-32 text-right"
              />
              <span className="text-xs text-gray-400 w-4">₽</span>
              <button onClick={() => removeOneTimeExpense(e.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button onClick={addOneTimeExpense} className="btn-secondary text-xs mt-1">
            <Plus size={14} /> Добавить
          </button>
        </div>
      </SectionCard>

      {/* Monthly expenses */}
      <SectionCard title="Ежемесячные расходы">
        <Badge color={totalMonthly > 0 ? 'green' : 'gray'}>
          Итого: {fmtCurrency(totalMonthly)}/мес
        </Badge>
        <div className="mt-3 space-y-2">
          {monthlyExpenses.map((e) => (
            <div key={e.id} className="flex items-center gap-2">
              <input
                type="text"
                value={e.name}
                onChange={(ev) => updateMonthlyExpense(e.id, 'name', ev.target.value)}
                placeholder="Название"
                className="input-field flex-1"
              />
              <input
                type="text"
                value={e.amount || ''}
                onChange={(ev) => {
                  const v = parseFloat(ev.target.value.replace(/\s/g, '')) || 0;
                  updateMonthlyExpense(e.id, 'amount', v);
                }}
                placeholder="0"
                className="input-field w-32 text-right"
              />
              <span className="text-xs text-gray-400 w-4">₽</span>
              <button onClick={() => removeMonthlyExpense(e.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button onClick={addMonthlyExpense} className="btn-secondary text-xs mt-1">
            <Plus size={14} /> Добавить
          </button>
        </div>
      </SectionCard>

      {/* Team */}
      <SectionCard title="Команда">
        <Badge color={teamMembers.length > 0 ? 'green' : 'gray'}>
          ФОТ с налогами: {fmtCurrency(totalTeam)}/мес
        </Badge>
        <div className="mt-3 space-y-2">
          {teamMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <input
                type="text"
                value={m.role}
                onChange={(ev) => updateTeamMember(m.id, 'role', ev.target.value)}
                placeholder="Роль"
                className="input-field flex-1 min-w-[120px]"
              />
              <input
                type="text"
                value={m.salary || ''}
                onChange={(ev) => {
                  const v = parseFloat(ev.target.value.replace(/\s/g, '')) || 0;
                  updateTeamMember(m.id, 'salary', v);
                }}
                placeholder="Зарплата"
                className="input-field w-28 text-right"
              />
              <span className="text-xs text-gray-400 shrink-0">₽ + </span>
              <input
                type="text"
                value={m.taxPercent || ''}
                onChange={(ev) => {
                  const v = parseFloat(ev.target.value) || 0;
                  updateTeamMember(m.id, 'taxPercent', v);
                }}
                placeholder="30"
                className="input-field w-16 text-right"
              />
              <span className="text-xs text-gray-400 shrink-0">%</span>
              <button onClick={() => removeTeamMember(m.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button onClick={addTeamMember} className="btn-secondary text-xs mt-1">
            <Plus size={14} /> Добавить сотрудника
          </button>
        </div>
      </SectionCard>

      {/* Warehouse */}
      <SectionCard title="Склад и логистика">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Необязательно — уточняет переменные расходы</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputGroup label="Хранение/мес" tooltip="Ежемесячная стоимость хранения товаров" value={warehouse.storageCostMonthly} onChange={(v) => setWarehouse('storageCostMonthly', v)} suffix="₽" step={1000} />
          <InputGroup label="Сборка заказа" tooltip="Стоимость сборки одного заказа" value={warehouse.assemblyCostPerOrder} onChange={(v) => setWarehouse('assemblyCostPerOrder', v)} suffix="₽" step={10} max={1000} />
          <InputGroup label="Упаковка" tooltip="Стоимость упаковки одного заказа" value={warehouse.packagingCostPerOrder} onChange={(v) => setWarehouse('packagingCostPerOrder', v)} suffix="₽" step={10} max={1000} />
          <InputGroup label="Доставка клиенту" tooltip="Средняя стоимость доставки одного заказа" value={warehouse.deliveryCostPerOrder} onChange={(v) => setWarehouse('deliveryCostPerOrder', v)} suffix="₽" step={50} max={2000} />
          <InputGroup label="Обработка возврата" tooltip="Стоимость обработки одного возврата" value={warehouse.returnProcessingCost} onChange={(v) => setWarehouse('returnProcessingCost', v)} suffix="₽" step={50} max={2000} />
          <InputGroup label="Заморожено в запасах" tooltip="Деньги, замороженные в товарных остатках" value={warehouse.frozenInventoryAmount} onChange={(v) => setWarehouse('frozenInventoryAmount', v)} suffix="₽" step={10000} />
        </div>
      </SectionCard>

      {/* Summary */}
      {hasSomething && (
        <SectionCard title="Итоги по расходам">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <StatBlock label="Разовые" value={fmtCurrency(totalOneTime)} />
            <StatBlock label="Ежемесячные" value={fmtCurrency(totalMonthly)} />
            <StatBlock label="ФОТ" value={fmtCurrency(totalTeam)} />
            <StatBlock label="Всего/мес" value={fmtCurrency(totalMonthly + totalTeam + warehouse.storageCostMonthly)} highlight />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Runway (3 мес.): {fmtCurrency((totalMonthly + totalTeam + warehouse.storageCostMonthly) * 3)}
            {' | '}Runway (6 мес.): {fmtCurrency((totalMonthly + totalTeam + warehouse.storageCostMonthly) * 6)}
          </p>
        </SectionCard>
      )}
    </div>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`font-semibold ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}
