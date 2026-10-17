import {
  isBusinessDay,
  getBusinessDaysInRange,
  getAccrualBusinessDays,
  fetchBrazilianHolidays,
  getDateKey,
  shiftDate,
  HOLIDAYS_CACHE_KEY
} from './calendar';

beforeEach(() => {
  window.localStorage.clear();
  jest.restoreAllMocks();
});

describe('calendar utilities', () => {
  test('isBusinessDay returns false for Saturdays and Sundays', () => {
    // 2026-09-12 is Saturday, 2026-09-13 is Sunday, 2026-09-14 is Monday
    expect(isBusinessDay('2026-09-12', [])).toBe(false);
    expect(isBusinessDay('2026-09-13', [])).toBe(false);
    expect(isBusinessDay('2026-09-14', [])).toBe(true);
  });

  test('isBusinessDay returns false for holidays', () => {
    const holidays = [{ date: '2026-09-07', name: 'Independência do Brasil' }];
    // 2026-09-07 is Monday, but is a holiday
    expect(isBusinessDay('2026-09-07', holidays)).toBe(false);
    // 2026-09-08 is Tuesday, not holiday
    expect(isBusinessDay('2026-09-08', holidays)).toBe(true);
  });

  test('getBusinessDaysInRange excludes weekends and holidays', () => {
    const holidays = [{ date: '2026-09-07', name: 'Independência do Brasil' }];
    // From Friday 2026-09-04 to Tuesday 2026-09-08
    // 2026-09-04: Fri (business)
    // 2026-09-05: Sat (weekend)
    // 2026-09-06: Sun (weekend)
    // 2026-09-07: Mon (holiday)
    // 2026-09-08: Tue (business)
    const businessDays = getBusinessDaysInRange('2026-09-04', '2026-09-08', holidays);
    expect(businessDays.map(getDateKey)).toEqual(['2026-09-04', '2026-09-08']);
  });

  test('fetchBrazilianHolidays caches results in localStorage under kyos-holidays-cache', async () => {
    const mockHolidays = [{ date: '2026-01-01', name: 'Confraternização Universal' }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockHolidays)
    });

    const result = await fetchBrazilianHolidays(2026);
    expect(result).toEqual(mockHolidays);

    const cached = JSON.parse(window.localStorage.getItem(HOLIDAYS_CACHE_KEY));
    expect(cached['2026']).toEqual(mockHolidays);
  });

  test('fetchBrazilianHolidays falls back to cache if network request fails', async () => {
    const cachedData = { '2026': [{ date: '2026-12-25', name: 'Natal' }] };
    window.localStorage.setItem(HOLIDAYS_CACHE_KEY, JSON.stringify(cachedData));

    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await fetchBrazilianHolidays(2026);
    expect(result).toEqual(cachedData['2026']);
  });

  test('fetchBrazilianHolidays throws error if network request fails and cache is empty', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network offline'));

    await expect(fetchBrazilianHolidays(2026)).rejects.toThrow('Network offline');
  });

  test('getAccrualBusinessDays calculates accrual business days starting strictly after effective application date', () => {
    const holidays = [{ date: '2026-09-07', name: 'Independência do Brasil' }];

    // Same day deposit yields 0 days
    expect(getAccrualBusinessDays('2026-09-14', '2026-09-14', holidays).map(getDateKey)).toEqual([]);

    // Mon to Tue yields 1 day (Tue)
    expect(getAccrualBusinessDays('2026-09-14', '2026-09-15', holidays).map(getDateKey)).toEqual(['2026-09-15']);

    // Mon to Wed yields 2 days (Tue, Wed)
    expect(getAccrualBusinessDays('2026-09-14', '2026-09-16', holidays).map(getDateKey)).toEqual(['2026-09-15', '2026-09-16']);

    // Fri to Mon yields 1 day (Mon)
    expect(getAccrualBusinessDays('2026-09-11', '2026-09-14', holidays).map(getDateKey)).toEqual(['2026-09-14']);

    // Sat deposit becomes effective Mon, so on Mon yields 0 days
    expect(getAccrualBusinessDays('2026-09-12', '2026-09-14', holidays).map(getDateKey)).toEqual([]);

    // Sat deposit becomes effective Mon, yields first time on Tue
    expect(getAccrualBusinessDays('2026-09-12', '2026-09-15', holidays).map(getDateKey)).toEqual(['2026-09-15']);

    // Holiday deposit: 2026-09-07 is holiday. Effective date is Tue 2026-09-08. First yield is Wed 2026-09-09.
    expect(getAccrualBusinessDays('2026-09-07', '2026-09-08', holidays).map(getDateKey)).toEqual([]);
    expect(getAccrualBusinessDays('2026-09-07', '2026-09-09', holidays).map(getDateKey)).toEqual(['2026-09-09']);
  });
});

