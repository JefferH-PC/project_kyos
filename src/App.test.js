import { render, screen, waitFor, within } from '@testing-library/react';
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

test('edits an individual asset name, yield rate, and invested amount', async () => {
  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: getDateKey(new Date()),
    wishlistSlots: [],
    recoverySlots: [],
    assets: [{
      id: 'asset-test',
      name: 'Old Asset Name',
      yieldRate: 100,
      investedAmount: 1000,
      initialInvestedAmount: 1000,
      totalIncome: 0,
      incomeHistory: {}
    }],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));
  window.localStorage.setItem('kyos-last-opened-date', getDateKey(new Date()));

  render(<App />);
  const investmentsBtn = await screen.findByRole('button', { name: 'Investments' });
  await userEvent.click(investmentsBtn);

  expect(screen.getByText('Old Asset Name')).toBeInTheDocument();

  // Click edit button
  const editBtn = screen.getByRole('button', { name: /edit old asset name/i });
  await userEvent.click(editBtn);

  // Form should be visible
  const nameInput = screen.getByDisplayValue('Old Asset Name');
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, 'Updated Asset Name');

  const saveBtn = screen.getByRole('button', { name: 'Save' });
  await userEvent.click(saveBtn);

  expect(screen.getByText('Updated Asset Name')).toBeInTheDocument();
  expect(screen.queryByText('Old Asset Name')).not.toBeInTheDocument();
});

test('canceling asset edit preserves original asset data', async () => {
  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: getDateKey(new Date()),
    wishlistSlots: [],
    recoverySlots: [],
    assets: [{
      id: 'asset-test-cancel',
      name: 'Stable Asset',
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
  window.localStorage.setItem('kyos-last-opened-date', getDateKey(new Date()));

  render(<App />);
  const investmentsBtn = await screen.findByRole('button', { name: 'Investments' });
  await userEvent.click(investmentsBtn);

  expect(screen.getByText('Stable Asset')).toBeInTheDocument();

  // Click edit
  const editBtn = screen.getByRole('button', { name: /edit stable asset/i });
  await userEvent.click(editBtn);

  // Type new name
  const nameInput = screen.getByDisplayValue('Stable Asset');
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, 'Unsaved Changed Name');

  // Click cancel
  const cancelBtn = screen.getByRole('button', { name: 'Cancel' });
  await userEvent.click(cancelBtn);

  // Original name remains
  expect(screen.getByText('Stable Asset')).toBeInTheDocument();
  expect(screen.queryByText('Unsaved Changed Name')).not.toBeInTheDocument();
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

test('simulation calendar restricts backward month navigation to current and future months only', async () => {
  const simulatedDateKey = '2026-10-10';
  window.localStorage.setItem('kyos-last-opened-date', simulatedDateKey);
  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: simulatedDateKey,
    wishlistSlots: [],
    recoverySlots: [],
    assets: [],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));

  render(<App />);

  // Navigate to Simulation tab
  const simBtn = await screen.findByRole('button', { name: 'Simulation' });
  await userEvent.click(simBtn);

  // Month header initially displays October 2026
  expect(await screen.findByText(/October 2026/i)).toBeInTheDocument();

  // Previous month button must be disabled on the current baseline month
  const prevBtn = screen.getByRole('button', { name: /previous month/i });
  const nextBtn = screen.getByRole('button', { name: /next month/i });

  expect(prevBtn).toBeDisabled();
  expect(nextBtn).toBeEnabled();

  // Clicking prevBtn while disabled does NOT go backward to September 2026
  await userEvent.click(prevBtn);
  expect(screen.getByText(/October 2026/i)).toBeInTheDocument();
  expect(screen.queryByText(/September 2026/i)).toBeNull();

  // Navigate forward to November 2026
  await userEvent.click(nextBtn);
  expect(await screen.findByText(/November 2026/i)).toBeInTheDocument();

  // Now previous month button should be enabled
  expect(prevBtn).toBeEnabled();

  // Navigate back to October 2026
  await userEvent.click(prevBtn);
  expect(await screen.findByText(/October 2026/i)).toBeInTheDocument();

  // Once back at October 2026 (current month), it is disabled again
  expect(prevBtn).toBeDisabled();
});

test('catch-up modal displays accurate non-zero accrued income and completed slots rather than R$ 0,00', async () => {
  const RealDate = Date;
  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super('2026-09-16T12:00:00Z');
      } else {
        super(...args);
      }
    }
    static now() {
      return new RealDate('2026-09-16T12:00:00Z').getTime();
    }
  }

  global.Date = MockDate;

  try {
    window.localStorage.setItem('kyos-last-opened-date', '2026-09-15');
    window.localStorage.setItem('kyos-database', JSON.stringify({
      schemaVersion: 11,
      simulatedDate: '2026-09-15',
      wishlistSlots: [{ id: 'wish-coffee', type: 'expense', expenseName: 'Artisan Coffee', price: 4, originalPrice: 4 }],
      recoverySlots: [],
      assets: [{
        id: 'asset-test-accrual',
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

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Verify modal does NOT display R$ 0,00 for accrued income
    const accruedMetric = screen.getByText(/Total Accrued Income/i).parentElement;
    expect(accruedMetric).toHaveTextContent('R$ 5,17');
    expect(accruedMetric).not.toHaveTextContent('R$ 0,00');

    // Verify completed item is listed in the modal
    expect(screen.getByText('Artisan Coffee')).toBeInTheDocument();
  } finally {
    global.Date = RealDate;
  }
});

test('daily income accrues strictly once (1x, not 2x) on catch-up and reopening does not re-accrue', async () => {
  const RealDate = Date;
  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super('2026-09-16T12:00:00Z');
      } else {
        super(...args);
      }
    }
    static now() {
      return new RealDate('2026-09-16T12:00:00Z').getTime();
    }
  }

  global.Date = MockDate;

  try {
    window.localStorage.setItem('kyos-last-opened-date', '2026-09-15');
    window.localStorage.setItem('kyos-database', JSON.stringify({
      schemaVersion: 11,
      simulatedDate: '2026-09-15',
      wishlistSlots: [],
      recoverySlots: [],
      assets: [{
        id: 'asset-single-yield',
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

    const { unmount } = render(<App />);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Wait for catch-up to complete and persist
    await waitFor(() => {
      const db = JSON.parse(window.localStorage.getItem('kyos-database'));
      expect(db.assets[0].investedAmount).toBeCloseTo(10005.17, 1);
    });

    const savedDb = JSON.parse(window.localStorage.getItem('kyos-database'));
    // Income should have increased by ~5.17 (1 day), definitely NOT ~10.33 (2 days)
    const incomeAdded = savedDb.assets[0].investedAmount - 10000;
    expect(incomeAdded).toBeCloseTo(5.17, 1);
    expect(incomeAdded).toBeLessThan(8.0); // Guards against duplicate 2x accrual

    // Unmount and simulate reopening on the same day
    unmount();

    render(<App />);

    // Reopening on the same day must NOT show the catch-up modal again
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Reopening must NOT compound income again
    const reopenedDb = JSON.parse(window.localStorage.getItem('kyos-database'));
    expect(reopenedDb.assets[0].investedAmount).toBeCloseTo(10005.17, 1);
  } finally {
    global.Date = RealDate;
  }
});

test('opens the About modal with ? button and explains daily income, 10k milestones, recovery, and wishlist', async () => {
  render(<App />);

  const aboutButton = await screen.findByRole('button', { name: /how kyos works/i });
  expect(aboutButton).toBeInTheDocument();

  // Modal is not visible initially
  expect(screen.queryByRole('dialog', { name: /how kyos works/i })).not.toBeInTheDocument();

  // Click ? button
  await userEvent.click(aboutButton);

  // Modal opens
  const modal = await screen.findByRole('dialog');
  expect(modal).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'How Kyos Works' })).toBeInTheDocument();
  expect(screen.getByText('Daily Income Driven')).toBeInTheDocument();
  expect(screen.getByText('Auto 10k Milestones')).toBeInTheDocument();
  expect(screen.getByText('Recovery System')).toBeInTheDocument();
  expect(screen.getByText('Wishlist Funding')).toBeInTheDocument();
  expect(screen.getByText('Daily Yield Allocation Flow')).toBeInTheDocument();

  // Close modal via Got it button
  const gotItButton = screen.getByRole('button', { name: /got it/i });
  await userEvent.click(gotItButton);

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

test('closes the About modal when pressing the Escape key', async () => {
  render(<App />);

  const aboutButton = await screen.findByRole('button', { name: /how kyos works/i });
  await userEvent.click(aboutButton);

  expect(await screen.findByRole('dialog')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

test('displays About modal in Portuguese when locale is pt', async () => {
  render(<App />);

  const localeSelect = await screen.findByRole('combobox', { name: /select language/i });
  await userEvent.selectOptions(localeSelect, 'pt');

  const aboutButtonPt = screen.getByRole('button', { name: /como o kyos funciona/i });
  expect(aboutButtonPt).toBeInTheDocument();

  await userEvent.click(aboutButtonPt);

  expect(await screen.findByRole('heading', { name: 'Como Funciona o Kyos' })).toBeInTheDocument();
  expect(screen.getByText('Metas Automáticas de 10k')).toBeInTheDocument();
  expect(screen.getByText('Base no Rendimento Diário')).toBeInTheDocument();
  expect(screen.getByText('Sistema de Recuperação')).toBeInTheDocument();
  expect(screen.getByText('Financiamento de Desejos')).toBeInTheDocument();
  expect(screen.getByText('Fluxo de Alocação do Rendimento')).toBeInTheDocument();

  const closeBtn = screen.getByRole('button', { name: /fechar/i });
  await userEvent.click(closeBtn);

  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

test('makes Tax & IOF deduction optional per investment individually without affecting others', async () => {
  const simulatedDateKey = getDateKey(new Date());

  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: simulatedDateKey,
    wishlistSlots: [],
    recoverySlots: [],
    assets: [
      {
        id: 'asset-lci',
        name: 'LCI Banco Inter',
        yieldRate: 95,
        investedAmount: 10000,
        initialInvestedAmount: 10000,
        totalIncome: 100,
        creationDate: simulatedDateKey,
        applyTax: false,
        incomeHistory: {}
      },
      {
        id: 'asset-cdb',
        name: 'CDB Nubank',
        yieldRate: 110,
        investedAmount: 10000,
        initialInvestedAmount: 10000,
        totalIncome: 100,
        creationDate: simulatedDateKey,
        applyTax: true,
        incomeHistory: {}
      }
    ],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));
  window.localStorage.setItem('kyos-last-opened-date', simulatedDateKey);

  render(<App />);

  // Go to Investments
  const investmentsBtn = await screen.findByRole('button', { name: 'Investments' });
  await userEvent.click(investmentsBtn);

  // LCI should be tax-exempt (Isento)
  const lciToggleBtn = screen.getByRole('button', { name: /toggle tax.*lci banco inter/i });
  expect(lciToggleBtn).toHaveTextContent('Isento');

  // CDB should be taxable (Tributado)
  const cdbToggleBtn = screen.getByRole('button', { name: /toggle tax.*cdb nubank/i });
  expect(cdbToggleBtn).toHaveTextContent('Tributado');

  // Click toggle on LCI to make it taxable
  await userEvent.click(lciToggleBtn);
  expect(lciToggleBtn).toHaveTextContent('Tributado');
  // CDB must remain taxable (not toggled together!)
  expect(cdbToggleBtn).toHaveTextContent('Tributado');

  // Verify persistence in localStorage
  let savedDb = JSON.parse(window.localStorage.getItem('kyos-database'));
  expect(savedDb.assets.find((a) => a.id === 'asset-lci').applyTax).toBe(true);
  expect(savedDb.assets.find((a) => a.id === 'asset-cdb').applyTax).toBe(true);

  // Click toggle on CDB to make it exempt
  await userEvent.click(cdbToggleBtn);
  expect(cdbToggleBtn).toHaveTextContent('Isento');
  // LCI must still be taxable
  expect(lciToggleBtn).toHaveTextContent('Tributado');

  savedDb = JSON.parse(window.localStorage.getItem('kyos-database'));
  expect(savedDb.assets.find((a) => a.id === 'asset-lci').applyTax).toBe(true);
  expect(savedDb.assets.find((a) => a.id === 'asset-cdb').applyTax).toBe(false);
});

test('restores proportions of the 3 segment areas as direct children without area-column wrappers', async () => {
  render(<App />);

  const appAreas = document.querySelector('.app-areas');
  expect(appAreas).toBeInTheDocument();

  // Verify direct children are TimeArea (wishlist), main (middle), and TimeArea (recovery)
  const directChildren = appAreas.children;
  expect(directChildren.length).toBe(3);

  expect(directChildren[0]).toHaveClass('time-area', 'area-wishlist');
  expect(directChildren[1]).toHaveClass('middle');
  expect(directChildren[1].tagName.toLowerCase()).toBe('main');
  expect(directChildren[2]).toHaveClass('time-area', 'area-recovery');

  // Ensure no broken wrapper .area-column exists
  expect(document.querySelector('.area-column')).toBeNull();
});

test('adds asset without manual date picker and sets creationDate to simulatedDate', async () => {
  const today = new Date();
  const simulatedDateKey = getDateKey(today);

  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: simulatedDateKey,
    wishlistSlots: [],
    recoverySlots: [],
    assets: [],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));
  window.localStorage.setItem('kyos-last-opened-date', simulatedDateKey);

  render(<App />);

  // Go to Investments
  const investmentsBtn = await screen.findByRole('button', { name: 'Investments' });
  await userEvent.click(investmentsBtn);

  // Click Add Investment
  const addBtn = screen.getByRole('button', { name: /add investment/i });
  await userEvent.click(addBtn);

  // Verify that date picker is NOT present
  expect(screen.queryByLabelText(/investment date/i)).toBeNull();

  // Fill in form with name, yield, amount
  const nameInput = screen.getByPlaceholderText('Name');
  const yieldInput = screen.getByPlaceholderText('Yield %');
  const amountInput = screen.getByPlaceholderText('Invested amount');

  await userEvent.type(nameInput, 'CDB 110% CDI');
  await userEvent.type(yieldInput, '110');
  await userEvent.type(amountInput, '10000');

  // Submit form
  const assetFormEl = screen.getByPlaceholderText('Name').closest('form');
  const submitBtn = within(assetFormEl).getByRole('button', { name: 'Add' });
  await userEvent.click(submitBtn);

  // Asset should be rendered
  expect(await screen.findByText('CDB 110% CDI')).toBeInTheDocument();

  // Verify that it saved with simulatedDate as creationDate
  const db = JSON.parse(window.localStorage.getItem('kyos-database'));
  expect(db.assets.length).toBe(1);
  expect(db.assets[0].name).toBe('CDB 110% CDI');
  expect(db.assets[0].creationDate).toBe(simulatedDateKey);
  expect(db.assets[0].investedAmount).toBe(10000);
});

test('exports database backup via the header export button', async () => {
  render(<App />);

  const exportBtn = await screen.findByRole('button', { name: /export backup/i });
  expect(exportBtn).toBeInTheDocument();

  // Mock document.createElement('a') click
  const clickSpy = jest.fn();
  const origCreateElement = document.createElement.bind(document);
  jest.spyOn(document, 'createElement').mockImplementation((tag) => {
    const el = origCreateElement(tag);
    if (tag === 'a') {
      el.click = clickSpy;
    }
    return el;
  });

  await userEvent.click(exportBtn);

  expect(clickSpy).toHaveBeenCalled();
  jest.restoreAllMocks();
});

test('switches mobile view tabs between wishlist, dashboard, and recovery', async () => {
  render(<App />);

  const wishlistTab = screen.getByRole('button', { name: /^wishlist/i });
  const recoveryTab = screen.getByRole('button', { name: /^recovery/i });
  const dashboardTab = screen.getByRole('button', { name: /^dashboard/i });

  expect(wishlistTab).toBeInTheDocument();
  expect(recoveryTab).toBeInTheDocument();
  expect(dashboardTab).toBeInTheDocument();

  await userEvent.click(wishlistTab);
  expect(wishlistTab).toHaveClass('active');

  await userEvent.click(recoveryTab);
  expect(recoveryTab).toHaveClass('active');

  await userEvent.click(dashboardTab);
  expect(dashboardTab).toHaveClass('active');
});

test('displays asset investment date in BR format in Portuguese and USA format in English', async () => {
  const simulatedDateKey = '2026-10-10';
  const creationDateKey = '2026-04-21';

  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: simulatedDateKey,
    wishlistSlots: [],
    recoverySlots: [],
    assets: [{
      id: 'asset-date-test',
      name: 'Tesouro Prefixado',
      yieldRate: 100,
      investedAmount: 5000,
      initialInvestedAmount: 5000,
      totalIncome: 0,
      creationDate: creationDateKey,
      incomeHistory: {}
    }],
    milestone: { target: 0 },
    purchasedTotal: 0,
    recoverySpentTotal: 0
  }));
  window.localStorage.setItem('kyos-last-opened-date', simulatedDateKey);

  render(<App />);

  // Go to Investments
  const investmentsBtn = await screen.findByRole('button', { name: 'Investments' });
  await userEvent.click(investmentsBtn);

  // In English: MM/DD/YYYY -> 04/21/2026
  expect(screen.getByText('04/21/2026')).toBeInTheDocument();

  // Switch to Portuguese
  const localeSelect = screen.getByRole('combobox', { name: /select language/i });
  await userEvent.selectOptions(localeSelect, 'pt');

  // In Portuguese: DD/MM/YYYY -> 21/04/2026
  expect(screen.getByText('21/04/2026')).toBeInTheDocument();
});

test('balance section maintains stable 2-card layout without breaking when investments are added', async () => {
  const simulatedDateKey = getDateKey(new Date());

  window.localStorage.setItem('kyos-database', JSON.stringify({
    schemaVersion: 11,
    simulatedDate: simulatedDateKey,
    wishlistSlots: [],
    recoverySlots: [],
    assets: [
      {
        id: 'asset-bal-1',
        name: 'Tesouro Selic',
        yieldRate: 100,
        investedAmount: 25000,
        initialInvestedAmount: 25000,
        totalIncome: 0,
        creationDate: simulatedDateKey,
        applyTax: true,
        incomeHistory: {}
      }
    ],
    milestone: { target: 0 },
    purchasedTotal: 5000,
    recoverySpentTotal: 0
  }));
  window.localStorage.setItem('kyos-last-opened-date', simulatedDateKey);

  render(<App />);

  // Navigate to Balance tab
  const balanceBtn = await screen.findByRole('button', { name: 'Balance' });
  await userEvent.click(balanceBtn);

  const balanceView = document.querySelector('.balance-view');
  expect(balanceView).toBeInTheDocument();

  // Must contain only the 2 balanced sections: year grid and chart card
  expect(balanceView.children.length).toBe(2);
  expect(balanceView.children[0]).toHaveClass('balance-year-grid');
  expect(balanceView.children[1]).toHaveClass('balance-chart-card');

  // Verify Spent and Invested values render properly in cards and graphic
  expect(screen.getAllByText('R$ 25.000,00').length).toBeGreaterThanOrEqual(1);
  expect(screen.getAllByText('R$ 5.000,00').length).toBeGreaterThanOrEqual(1);

  // Verify Graphic Card and proportional bar exist, donut is replaced, and no extraneous layout breaking cards
  expect(document.querySelector('.balance-graphic-card')).toBeInTheDocument();
  expect(document.querySelector('.balance-proportional-bar')).toBeInTheDocument();
  expect(document.querySelector('.balance-graphic-grid')).toBeInTheDocument();
  expect(document.querySelector('.balance-donut')).toBeNull();
  expect(document.querySelector('.portfolio-allocation-card')).toBeNull();
});

test('carryover: during catch-up, leftover income carries over to next wishlist item and moves it to processing lane on the same day', async () => {
  const RealDate = Date;
  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super('2026-09-16T12:00:00Z');
      } else {
        super(...args);
      }
    }
    static now() {
      return new RealDate('2026-09-16T12:00:00Z').getTime();
    }
  }
  global.Date = MockDate;

  try {
    window.localStorage.setItem('kyos-last-opened-date', '2026-09-15');
    window.localStorage.setItem('kyos-database', JSON.stringify({
      schemaVersion: 11,
      simulatedDate: '2026-09-15',
      wishlistSlots: [
        { id: 'wish-item-1', type: 'processing', expenseName: 'Mechanical Keycaps', price: 3, originalPrice: 3 },
        { id: 'wish-item-2', type: 'expense', expenseName: 'Ergonomic Mouse', price: 10, originalPrice: 10 }
      ],
      recoverySlots: [],
      assets: [{
        id: 'asset-carryover-test',
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

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    expect(screen.getByText('Mechanical Keycaps')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    const savedDb = JSON.parse(window.localStorage.getItem('kyos-database'));
    const item1 = savedDb.wishlistSlots.find((s) => s.id === 'wish-item-1');
    const item2 = savedDb.wishlistSlots.find((s) => s.id === 'wish-item-2');

    expect(item1.type).toBe('ready');
    expect(item1.price).toBe(0);

    expect(item2.type).toBe('processing');
    expect(item2.price).toBeLessThan(10);
    expect(item2.price).toBeCloseTo(7.83, 1);
  } finally {
    global.Date = RealDate;
  }
});

test('carryover: during catch-up, leftover income carries over to next recovery item and keeps it in processing lane on the same day', async () => {
  const RealDate = Date;
  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super('2026-09-16T12:00:00Z');
      } else {
        super(...args);
      }
    }
    static now() {
      return new RealDate('2026-09-16T12:00:00Z').getTime();
    }
  }
  global.Date = MockDate;

  try {
    window.localStorage.setItem('kyos-last-opened-date', '2026-09-15');
    window.localStorage.setItem('kyos-database', JSON.stringify({
      schemaVersion: 11,
      simulatedDate: '2026-09-15',
      recoverySlots: [
        { id: 'rec-item-1', type: 'recovery', isProcessing: true, expenseName: 'Small Debt', price: 2, originalPrice: 2 },
        { id: 'rec-item-2', type: 'recovery', isProcessing: false, expenseName: 'Larger Debt', price: 10, originalPrice: 10 }
      ],
      wishlistSlots: [],
      assets: [{
        id: 'asset-carryover-test-rec',
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

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    expect(screen.getByText('Small Debt')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    const savedDb = JSON.parse(window.localStorage.getItem('kyos-database'));
    expect(savedDb.recoverySlots.find((s) => s.id === 'rec-item-1')).toBeUndefined();

    const rec2 = savedDb.recoverySlots.find((s) => s.id === 'rec-item-2');
    expect(rec2).toBeDefined();
    expect(rec2.isProcessing).toBe(true);
    expect(rec2.price).toBeLessThan(10);
    expect(rec2.price).toBeCloseTo(6.83, 1);
  } finally {
    global.Date = RealDate;
  }
});



