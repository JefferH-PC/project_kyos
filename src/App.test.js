import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDate = (date, amount) => {
  const shiftedDate = new Date(date);
  shiftedDate.setDate(shiftedDate.getDate() + amount);
  return shiftedDate;
};

beforeEach(() => window.localStorage.clear());

test('switches built-in labels to Portuguese without changing user data', async () => {
  render(<App />);

  const localeSelect = screen.getByRole('combobox', { name: /select language/i });
  expect(localeSelect).toHaveValue('en');

  await userEvent.selectOptions(localeSelect, 'pt');

  expect(screen.getByRole('combobox', { name: /selecionar idioma/i })).toHaveValue('pt');
  expect(screen.getByText('Patrimônio')).toBeInTheDocument();
});

test('accumulates the current calendar week against the previous week', () => {
  const simulatedDate = new Date();
  const dayOfWeek = simulatedDate.getDay() === 0 ? 6 : simulatedDate.getDay() - 1;
  const startOfWeek = shiftDate(simulatedDate, -dayOfWeek);
  const incomeHistory = {};
  for (let daysFromStart = 0; daysFromStart <= dayOfWeek; daysFromStart += 1) {
    incomeHistory[getDateKey(shiftDate(startOfWeek, daysFromStart))] = 1;
  }
  for (let daysFromStart = -7; daysFromStart < 0; daysFromStart += 1) {
    incomeHistory[getDateKey(shiftDate(startOfWeek, daysFromStart))] = 2;
  }

  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: getDateKey(simulatedDate),
    wishlistSlots: [],
    recoverySlots: [],
    assets: [{ id: 'asset-test', name: 'Test asset', yieldRate: 0, investedAmount: 100, initialInvestedAmount: 100, totalIncome: 0, incomeHistory }],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));

  render(<App />);

  const weekCard = screen.getByRole('heading', { name: 'Week' }).parentElement;
  expect(weekCard).toHaveTextContent(`R$ ${((dayOfWeek + 1) * 1).toFixed(2).replace('.', ',')}`);
  expect(weekCard).toHaveTextContent('R$ 14,00');
});

test('reset incomes restores initial asset values and clears accumulated income', async () => {
  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: getDateKey(new Date()),
    wishlistSlots: [],
    recoverySlots: [],
    assets: [{ id: 'asset-test', name: 'Test asset', yieldRate: 100, investedAmount: 110, initialInvestedAmount: 100, totalIncome: 10, incomeHistory: { [getDateKey(new Date())]: 10 } }],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));

  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: 'Investments' }));
  await userEvent.click(screen.getByRole('button', { name: 'Reset Incomes' }));

  expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
  expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
});
