import {
  calculateDailyYield,
  calculateAnnualizedCDI,
  fetchHistoricalCDI,
  fetchLatestCDI,
  calculateAssetAccrualSinceDate,
  synchronizeAllAssetsIncomes,
  getHistoricalFallbackRateForDate,
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
});

