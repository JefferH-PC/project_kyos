import {
  calculateDailyYield,
  calculateAnnualizedCDI,
  fetchHistoricalCDI,
  fetchLatestCDI,
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
});
