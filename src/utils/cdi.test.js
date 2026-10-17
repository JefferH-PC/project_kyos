import {
  calculateDailyYield,
  calculateAnnualizedCDI,
  fetchHistoricalCDI,
  fetchLatestCDI,
  calculateAssetAccrualSinceDate,
  synchronizeAllAssetsIncomes,
  getHistoricalFallbackRateForDate,
  getCDIRateForDate,
  fetchCDIRatesForDateRange,
  DEFAULT_CDI_RATE,
  CDI_CACHE_KEY
} from './cdi';

beforeEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('cdi utilities', () => {
  test('calculateDailyYield computes exact return formula', () => {
    // investedAmount * (yieldRate / 100) * (cdiRate / 100)
    // 10000 * (100 / 100) * (0.05 / 100) = 5
    const yieldVal = calculateDailyYield(10000, 100, 0.05);
    expect(yieldVal).toBeCloseTo(5, 4);
  });

  test('calculateAnnualizedCDI computes annual compound rate', () => {
    // ((1 + 0.051660 / 100)^252 - 1) * 100
    const annual = calculateAnnualizedCDI(0.051660);
    expect(annual).toBeGreaterThan(10);
    expect(annual).toBeLessThan(15);
  });

  test('fetchHistoricalCDI returns data from BCB SGS 12 and caches result', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ data: '10/09/2026', valor: '0.048900' }])
    });

    const rate = await fetchHistoricalCDI('2026-09-10');
    expect(rate).toBeCloseTo(0.0489, 4);

    const cache = JSON.parse(window.localStorage.getItem(CDI_CACHE_KEY));
    expect(cache['2026-09-10']).toBeCloseTo(0.0489, 4);
  });

  test('fetchHistoricalCDI falls back to latest CDI when specific date fails', async () => {
    // First call (historical) fails, second call (latest) succeeds
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Historical date not found'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ data: '14/09/2026', valor: '0.051660' }])
      });

    const rate = await fetchHistoricalCDI('2026-09-10');
    expect(rate).toBeCloseTo(0.05166, 5);
  });

  test('calculateAssetAccrualSinceDate calculates yields across past business days', () => {
    // Monday 2026-09-14 deposit to Wednesday 2026-09-16 (2 accrual business days: 15, 16)
    const asset = {
      name: 'Tesouro Prefixado',
      investedAmount: 10000,
      initialInvestedAmount: 10000,
      yieldRate: 100,
      creationDate: '2026-09-14'
    };
    const targetDate = '2026-09-16';
    const holidays = [];

    const updated = calculateAssetAccrualSinceDate(asset, targetDate, holidays, 0.05);
    expect(updated.investedAmount).toBeGreaterThan(10000);
    expect(updated.totalIncome).toBeGreaterThan(0);
    expect(Object.keys(updated.incomeHistory)).toEqual(['2026-09-15', '2026-09-16']);

    // Same day deposit yields 0
    const sameDay = calculateAssetAccrualSinceDate(asset, '2026-09-14', holidays, 0.05);
    expect(sameDay.totalIncome).toBe(0);
    expect(sameDay.investedAmount).toBe(10000);
    expect(Object.keys(sameDay.incomeHistory)).toEqual([]);
  });


  test('getHistoricalFallbackRateForDate returns accurate official benchmark for given year', () => {
    expect(getHistoricalFallbackRateForDate('2016-05-10')).toBeCloseTo(0.0520, 3);
    expect(getHistoricalFallbackRateForDate('2020-08-01')).toBeCloseTo(0.0108, 3);
    expect(getHistoricalFallbackRateForDate('2023-11-15')).toBeCloseTo(0.0486, 3);
  });

  test('fetchCDIRatesForDateRange fetches, parses, and caches multiple years of BCB rates', async () => {
    global.fetch = jest.fn().mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('2016')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { data: '04/01/2016', valor: '0.052496' },
            { data: '05/01/2016', valor: '0.052496' }
          ])
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          { data: '02/01/2017', valor: '0.052496' }
        ])
      });
    });

    const rates = await fetchCDIRatesForDateRange('2016-01-01', '2017-01-10');
    expect(rates['2016-01-04']).toBeCloseTo(0.052496, 5);
    expect(rates['2017-01-02']).toBeCloseTo(0.052496, 5);

    const cached = JSON.parse(window.localStorage.getItem(CDI_CACHE_KEY));
    expect(cached['2016-01-04']).toBeCloseTo(0.052496, 5);
  });

  test('calculateAssetAccrualSinceDate computes accurate compounding across a 10-year span (e.g. 2016 to 2026)', () => {
    const asset = {
      name: 'Tesouro 10 Years',
      investedAmount: 10000,
      initialInvestedAmount: 10000,
      yieldRate: 100,
      creationDate: '2016-01-04'
    };
    const targetDate = '2026-01-04';
    const holidays = [];

    const updated = calculateAssetAccrualSinceDate(asset, targetDate, holidays);
    expect(updated.investedAmount).toBeGreaterThan(20000); // 10 years of Brazilian CDI doubles principal
    expect(updated.totalIncome).toBeGreaterThan(10000);
    expect(Object.keys(updated.incomeHistory).length).toBeGreaterThan(2000);
  });

  test('synchronizeAllAssetsIncomes recalculates and updates all existing assets coherently from creation date to target date', () => {
    const assets = [
      {
        id: 'cdb-1',
        name: 'CDB Banco Inter',
        investedAmount: 10000,
        initialInvestedAmount: 10000,
        totalIncome: 0,
        yieldRate: 100,
        creationDate: '2026-09-14'
      },
      {
        id: 'cdb-2',
        name: 'CDB Nubank',
        investedAmount: 5000,
        initialInvestedAmount: 5000,
        totalIncome: 0,
        yieldRate: 100,
        creationDate: '2026-09-15'
      }
    ];

    const targetDate = '2026-09-18'; // Friday
    const synced = synchronizeAllAssetsIncomes(assets, targetDate, [], 0.05);

    expect(synced.length).toBe(2);
    // Asset 1 (created Mon 14): accrual days are 15, 16, 17, 18 (4 days)
    expect(Object.keys(synced[0].incomeHistory)).toEqual(['2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']);
    expect(synced[0].totalIncome).toBeGreaterThan(0);
    expect(synced[0].investedAmount).toBeGreaterThan(10000);

    // Asset 2 (created Tue 15): accrual days are 16, 17, 18 (3 days)
    expect(Object.keys(synced[1].incomeHistory)).toEqual(['2026-09-16', '2026-09-17', '2026-09-18']);
    expect(synced[1].totalIncome).toBeGreaterThan(0);
    expect(synced[1].investedAmount).toBeGreaterThan(5000);
  });

  test('getCDIRateForDate returns 100% accurate official BCB rates for 2024 business days', () => {
    // January 2024 Copom period
    expect(getCDIRateForDate('2024-01-02')).toBeCloseTo(0.043739, 6);
    expect(getCDIRateForDate('2024-01-15')).toBeCloseTo(0.043739, 6);
    // March/April 2024 Copom period
    expect(getCDIRateForDate('2024-03-25')).toBeCloseTo(0.040168, 6);
    // May to September 2024 Copom period
    expect(getCDIRateForDate('2024-06-10')).toBeCloseTo(0.039270, 6);
    // December 2024 Copom period
    expect(getCDIRateForDate('2024-12-16')).toBeCloseTo(0.045513, 6);
  });

  test('long invested asset from 2024 calculates 100% accurate gross return matching B3 / bank account', () => {
    // Deposit R$ 10.000,00 on 2024-01-02 (first business day of 2024)
    // Accrual runs strictly from next business day (2024-01-03) through 2024-12-31 (252 business days)
    const asset = {
      id: 'asset-2024-cdb',
      name: 'CDB 100% CDI 2024',
      investedAmount: 10000,
      initialInvestedAmount: 10000,
      yieldRate: 100,
      creationDate: '2024-01-02',
      totalIncome: 0,
      incomeHistory: {}
    };

    const targetDate = '2024-12-31';
    const updated = calculateAssetAccrualSinceDate(asset, targetDate, []);

    // 252 business days accrued in 2024
    expect(Object.keys(updated.incomeHistory).length).toBe(252);
    // Official B3 compound factor product over 2024 yields R$ 1.082,55 on R$ 10.000
    expect(updated.totalIncome).toBeCloseTo(1082.55, 1);
    expect(updated.investedAmount).toBeCloseTo(11082.55, 1);
    expect(updated.initialInvestedAmount).toBe(10000);
  });

  test('user asset of R$ 69.249,00 at 88% CDI from 2024-06-06 calculates exact R$ 89.966,36 matching bank statement', () => {
    const asset = {
      id: 'asset-user-lci',
      name: 'LCI 88% CDI Inter',
      investedAmount: 69249,
      initialInvestedAmount: 69249,
      yieldRate: 88,
      creationDate: '2024-06-06',
      totalIncome: 0,
      incomeHistory: {}
    };

    // Bank statement position as of 2026-10-15 (latest settled business day)
    const targetDate = '2026-10-15';
    const updated = calculateAssetAccrualSinceDate(asset, targetDate, []);

    expect(updated.investedAmount).toBeCloseTo(89966.36, 2);
    expect(updated.totalIncome).toBeCloseTo(20717.36, 2);
    expect(Object.keys(updated.incomeHistory).length).toBe(594);
  });
});

