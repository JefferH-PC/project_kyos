import { render, screen, waitFor } from '@testing-library/react';
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

const mockFetchSuccess = () => {
  global.fetch = jest.fn((url) => {
    const urlStr = String(url);
    if (urlStr.includes('brasilapi.com.br')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          { date: '2026-01-01', name: 'Confraternização Universal', type: 'national' },
          { date: '2026-04-21', name: 'Tiradentes', type: 'national' },
          { date: '2026-09-07', name: 'Independência do Brasil', type: 'national' },
          { date: '2026-10-12', name: 'Nossa Senhora Aparecida', type: 'national' },
          { date: '2026-11-02', name: 'Finados', type: 'national' },
          { date: '2026-11-15', name: 'Proclamação da República', type: 'national' },
          { date: '2026-12-25', name: 'Natal', type: 'national' }
        ])
      });
    }
    if (urlStr.includes('api.bcb.gov.br')) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve([
          { data: '14/09/2026', valor: '0.051660' }
        ])
      });
    }
    return Promise.reject(new Error('Unknown url: ' + urlStr));
  });
};

beforeEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
  mockFetchSuccess();
});

test('switches built-in labels to Portuguese without changing user data', async () => {
  render(<App />);

  const localeSelect = await screen.findByRole('combobox', { name: /select language/i });
  expect(localeSelect).toHaveValue('en');

  await userEvent.selectOptions(localeSelect, 'pt');

  expect(screen.getByRole('combobox', { name: /selecionar idioma/i })).toHaveValue('pt');
  expect(screen.getByText('Patrimônio')).toBeInTheDocument();
});

test('accumulates the current calendar week against the previous week', async () => {
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
  window.localStorage.setItem('kyos-last-opened-date', getDateKey(simulatedDate));

  render(<App />);

  const weekHeading = await screen.findByRole('heading', { name: 'Week' });
  const weekCard = weekHeading.parentElement;
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
  window.localStorage.setItem('kyos-last-opened-date', getDateKey(new Date()));

  render(<App />);
  const investmentsBtn = await screen.findByRole('button', { name: 'Investments' });
  await userEvent.click(investmentsBtn);
  await userEvent.click(screen.getByRole('button', { name: 'Reset Incomes' }));

  expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
  expect(screen.getByText('R$ 0,00')).toBeInTheDocument();
});

test('resiliency rule: displays error banner when holiday API fails and cache is empty', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('BrasilAPI network offline'));

  render(<App />);

  await waitFor(() => {
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
  expect(screen.getByText(/unable to fetch holiday data/i)).toBeInTheDocument();
});

test('auto-update processes missed business days and presents the Catch-Up Summary modal', async () => {
  const today = new Date();
  const threeDaysAgo = shiftDate(today, -3);

  window.localStorage.setItem('kyos-last-opened-date', getDateKey(threeDaysAgo));
  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: getDateKey(threeDaysAgo),
    wishlistSlots: [{ id: 'wish-1', type: 'expense', expenseName: 'New Keyboard', price: 100, originalPrice: 100 }],
    recoverySlots: [],
    assets: [{
      id: 'asset-catchup-test',
      name: 'Tesouro Selic',
      yieldRate: 100,
      investedAmount: 10000,
      initialInvestedAmount: 10000,
      totalIncome: 0,
      incomeHistory: {}
    }],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));

  render(<App />);

  // Should trigger catch-up and show modal
  const dialog = await screen.findByRole('dialog');
  expect(dialog).toBeInTheDocument();

  expect(screen.getByRole('heading', { name: /catch-up summary/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();

  // Dismiss modal
  await userEvent.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // Verify kyos-last-opened-date was updated to today
  expect(window.localStorage.getItem('kyos-last-opened-date')).toBe(getDateKey(today));
});

test('dedicated simulation section operates independently without mutating main database', async () => {
  window.localStorage.setItem('kyos-last-opened-date', getDateKey(new Date()));
  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: getDateKey(new Date()),
    wishlistSlots: [],
    recoverySlots: [],
    assets: [{
      id: 'asset-sim-test',
      name: 'Main Asset',
      yieldRate: 100,
      investedAmount: 5000,
      initialInvestedAmount: 5000,
      totalIncome: 0,
      incomeHistory: {}
    }],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));

  render(<App />);

  // Navigate to Simulation tab
  const simBtn = await screen.findByRole('button', { name: 'Simulation' });
  await userEvent.click(simBtn);

  expect(await screen.findByRole('button', { name: /reset to live baseline/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
  expect(screen.getByLabelText(/simulation cdi/i)).toBeInTheDocument();

  // Click "Clear All" in simulation
  await userEvent.click(screen.getByRole('button', { name: /clear all/i }));

  // Verify that the main database in localStorage is UNTOUCHED
  const mainDb = JSON.parse(window.localStorage.getItem('kyos-database'));
  expect(mainDb.assets.length).toBe(1);
  expect(mainDb.assets[0].name).toBe('Main Asset');
  expect(mainDb.assets[0].investedAmount).toBe(5000);
});
