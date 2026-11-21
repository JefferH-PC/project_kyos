import React, { useState } from 'react';
import { formatDecimal, formatDateKey } from '../../utils/formatters';

const BalanceArea = ({
  t,
  locale,
  displayMoney,
  actualDate,
  investedTotal,
  spentTotal,
  previousYearIncome,
  lastYearSpentTotal,
  selectedExpenseYear,
  onSelectExpenseYear,
  availableExpenseYears,
  filteredExpenses,
  expensesYearlyMetrics,
  simulatedDate,
  onAddDirectExpense,
  onUpdateExpense,
  onDeleteExpense
}) => {
  const [isAddDirectExpenseOpen, setIsAddDirectExpenseOpen] = useState(false);
  const [directExpenseForm, setDirectExpenseForm] = useState({
    name: '',
    amount: '',
    date: '',
    category: 'wishlist'
  });

  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseForm, setEditExpenseForm] = useState({
    name: '',
    amount: '',
    date: '',
    category: 'wishlist'
  });

  const totalBalance = spentTotal + investedTotal;
  const spentRatio = totalBalance > 0 ? (spentTotal / totalBalance) * 100 : 0;
  const investedRatio = totalBalance > 0 ? (investedTotal / totalBalance) * 100 : 0;

  const handleCreateSubmit = (event) => {
    event.preventDefault();
    const amt = Number(directExpenseForm.amount);
    if (!directExpenseForm.name.trim() || !Number.isFinite(amt) || amt <= 0) return;

    onAddDirectExpense({
      name: directExpenseForm.name.trim(),
      amount: amt,
      date: directExpenseForm.date || simulatedDate,
      category: directExpenseForm.category === 'recovery' ? 'recovery' : 'wishlist'
    });

    setDirectExpenseForm({ name: '', amount: '', date: '', category: 'wishlist' });
    setIsAddDirectExpenseOpen(false);
  };

  const startEditingExpense = (exp) => {
    setEditingExpenseId(exp.id);
    setEditExpenseForm({
      name: exp.name || '',
      amount: String(exp.amount ?? ''),
      date: exp.date || simulatedDate,
      category: exp.category === 'recovery' ? 'recovery' : 'wishlist'
    });
  };

  const cancelEditingExpense = () => {
    setEditingExpenseId(null);
    setEditExpenseForm({ name: '', amount: '', date: '', category: 'wishlist' });
  };

  const handleEditSubmit = (event, expId) => {
    event.preventDefault();
    const amt = Number(editExpenseForm.amount);
    if (!editExpenseForm.name.trim() || !Number.isFinite(amt) || amt <= 0) return;

    onUpdateExpense(expId, {
      name: editExpenseForm.name.trim(),
      amount: amt,
      date: editExpenseForm.date || simulatedDate,
      category: editExpenseForm.category === 'recovery' ? 'recovery' : 'wishlist'
    });

    setEditingExpenseId(null);
  };

  return (
    <div className='balance-view'>
      <div className='balance-summary-card'>
        <div className='balance-year-grid'>
          <div className='balance-card'>
            <div className='balance-card-head'>
              <h2>{t.invested}</h2>
              <span className='balance-year-label'>{actualDate.getFullYear()}</span>
            </div>
            <strong>R$ {displayMoney(investedTotal)}</strong>
            <div className='balance-card-footer'>
              <h3>{t.lastYear}</h3>
              <strong>R$ {displayMoney(previousYearIncome)}</strong>
            </div>
          </div>
          <div className='balance-card'>
            <div className='balance-card-head'>
              <h2>{t.spent}</h2>
              <span className='balance-year-label'>{actualDate.getFullYear()}</span>
            </div>
            <strong>R$ {displayMoney(spentTotal)}</strong>
            <div className='balance-card-footer'>
              <h3>{t.lastYear}</h3>
              <strong>R$ {displayMoney(lastYearSpentTotal)}</strong>
            </div>
          </div>
        </div>

        <div className='balance-visual-track-wrap'>
          <div className='balance-track-header'>
            <span className='track-marker'>
              {t.invested} <strong>{formatDecimal(investedRatio)}%</strong>
            </span>
            <span className='track-marker'>
              {t.spent} <strong>{formatDecimal(spentRatio)}%</strong>
            </span>
          </div>
          <div
            className='balance-proportional-bar'
            role='progressbar'
            aria-valuenow={investedRatio}
            aria-valuemin='0'
            aria-valuemax='100'
            aria-label={t.moneyBalance}
          >
            <div
              className='bar-segment invested-segment'
              style={{ width: `${totalBalance > 0 ? Math.max(investedRatio, 2) : 50}%` }}
              title={`${t.invested}: R$ ${displayMoney(investedTotal)} (${formatDecimal(investedRatio)}%)`}
            />
            <div
              className='bar-segment spent-segment'
              style={{ width: `${totalBalance > 0 ? Math.max(spentRatio, 2) : 50}%` }}
              title={`${t.spent}: R$ ${displayMoney(spentTotal)} (${formatDecimal(spentRatio)}%)`}
            />
          </div>
        </div>
      </div>

      <div className='balance-expenses-card'>
        <div className='expenses-card-header'>
          <div className='expenses-header-titles'>
            <div className='expenses-badge-row'>
              <h2>{t.expensesTitle}</h2>
              <span className='expenses-count-badge'>
                {expensesYearlyMetrics.count} {expensesYearlyMetrics.count === 1 ? t.itemSingular : t.itemPlural}
              </span>
              <strong className='expenses-period-total'>- R$ {displayMoney(expensesYearlyMetrics.total)}</strong>
            </div>
          </div>

          <div className='expenses-header-actions'>
            <div className='yearly-filter-pills' role='group' aria-label={t.filterByYear}>
              <button
                type='button'
                className={`filter-pill ${selectedExpenseYear === 'all' ? 'active' : ''}`}
                onClick={() => onSelectExpenseYear('all')}
              >
                {t.allYears}
              </button>
              {availableExpenseYears.map((yr) => (
                <button
                  key={yr}
                  type='button'
                  className={`filter-pill ${selectedExpenseYear === yr ? 'active' : ''}`}
                  onClick={() => onSelectExpenseYear(yr)}
                >
                  {yr}
                </button>
              ))}
            </div>
            <button
              type='button'
              className='add-expense-btn'
              onClick={() => setIsAddDirectExpenseOpen((prev) => !prev)}
              title={t.addExpenseCost}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
                <path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"/>
              </svg>
              <span>{t.addExpenseCost}</span>
            </button>
          </div>
        </div>

        {isAddDirectExpenseOpen && (
          <form className='direct-expense-form' onSubmit={handleCreateSubmit}>
            <div className='direct-expense-grid'>
              <div className='direct-expense-field'>
                <label>{t.name}</label>
                <input
                  type='text'
                  required
                  placeholder={t.expenseName}
                  value={directExpenseForm.name}
                  onChange={(e) => setDirectExpenseForm({ ...directExpenseForm, name: e.target.value })}
                />
              </div>
              <div className='direct-expense-field'>
                <label>{t.expenseValue}</label>
                <input
                  type='number'
                  step='0.01'
                  min='0.01'
                  required
                  placeholder='0,00'
                  value={directExpenseForm.amount}
                  onChange={(e) => setDirectExpenseForm({ ...directExpenseForm, amount: e.target.value })}
                />
              </div>
              <div className='direct-expense-field'>
                <label>{t.date}</label>
                <input
                  type='date'
                  value={directExpenseForm.date || simulatedDate}
                  onChange={(e) => setDirectExpenseForm({ ...directExpenseForm, date: e.target.value })}
                />
              </div>
              <div className='direct-expense-field'>
                <label>{t.capitalAllocation}</label>
                <select
                  value={directExpenseForm.category}
                  onChange={(e) => setDirectExpenseForm({ ...directExpenseForm, category: e.target.value })}
                >
                  <option value='wishlist'>{t.wishlistCategory}</option>
                  <option value='recovery'>{t.recoveryCategory}</option>
                </select>
              </div>
            </div>
            <div className='direct-expense-actions'>
              <button type='button' className='cancel-btn' onClick={() => setIsAddDirectExpenseOpen(false)}>
                {t.cancel}
              </button>
              <button type='submit' className='submit-btn'>
                {t.add}
              </button>
            </div>
          </form>
        )}

        <div className='expenses-items-list'>
          {filteredExpenses.length === 0 ? (
            <div className='expenses-empty-state'>
              <p>{t.noExpensesFound}</p>
            </div>
          ) : (
            filteredExpenses.map((exp) => (
              <div key={exp.id} className='expense-item-row'>
                {editingExpenseId === exp.id ? (
                  <form className='expense-inline-edit-form' onSubmit={(e) => handleEditSubmit(e, exp.id)}>
                    <input
                      type='text'
                      className='expense-edit-input'
                      aria-label={t.expenseName}
                      value={editExpenseForm.name}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, name: e.target.value })}
                      required
                    />
                    <input
                      type='number'
                      step='0.01'
                      min='0.01'
                      className='expense-edit-input amount-input'
                      aria-label={t.expenseValue}
                      value={editExpenseForm.amount}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, amount: e.target.value })}
                      required
                    />
                    <input
                      type='date'
                      className='expense-edit-input date-input'
                      aria-label={t.date}
                      value={editExpenseForm.date}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, date: e.target.value })}
                    />
                    <select
                      className='expense-edit-select'
                      aria-label={t.capitalAllocation}
                      value={editExpenseForm.category}
                      onChange={(e) => setEditExpenseForm({ ...editExpenseForm, category: e.target.value })}
                    >
                      <option value='wishlist'>{t.wishlistCategory}</option>
                      <option value='recovery'>{t.recoveryCategory}</option>
                    </select>
                    <div className='expense-edit-actions'>
                      <button type='submit' className='expense-save-btn'>{t.save}</button>
                      <button type='button' className='expense-cancel-btn' onClick={cancelEditingExpense}>{t.cancel}</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className='expense-item-meta'>
                      <strong className='expense-item-name'>{exp.name}</strong>
                      <span className='expense-category-label'>
                        {exp.category === 'recovery' ? t.recoveryCategory : t.wishlistCategory}
                      </span>
                    </div>
                    <div className='expense-item-amount'>
                      <span className='expense-item-date'>{formatDateKey(exp.date, locale)}</span>
                      <span className='expense-amount-negative'>- R$ {displayMoney(exp.amount)}</span>
                      <button
                        type='button'
                        className='expense-edit-btn'
                        onClick={() => startEditingExpense(exp)}
                        title={`${t.edit} ${exp.name}`}
                        aria-label={`${t.edit} ${exp.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 256 256" fill="currentColor">
                          <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                        </svg>
                      </button>
                      <button
                        type='button'
                        className='expense-delete-btn'
                        onClick={() => onDeleteExpense(exp.id)}
                        title={t.removeExpense}
                        aria-label={t.removeExpense}
                      >
                        ×
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceArea;
