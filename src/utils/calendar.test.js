import {
  isBusinessDay,
  getBusinessDaysInRange,
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
});
