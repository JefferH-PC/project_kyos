import {
  formatMoney,
  formatDecimal,
  formatDateKey,
  formatDate,
  formatDateLong
} from './formatters';

describe('Formatters Utility', () => {
  test('formats money and decimal with pt-BR standard', () => {
    expect(formatMoney(1234.56)).toBe('1.234,56');
    expect(formatMoney(0)).toBe('0,00');
    expect(formatDecimal(5.166)).toBe('5,17');
  });

  test('formats YYYY-MM-DD date key in BR format (DD/MM/YYYY) for Portuguese', () => {
    expect(formatDateKey('2026-09-07', 'pt')).toBe('07/09/2026');
    expect(formatDateKey('2026-12-25', 'pt')).toBe('25/12/2026');
    expect(formatDateKey('2026-01-01', 'pt')).toBe('01/01/2026');
  });

  test('formats YYYY-MM-DD date key in USA format (MM/DD/YYYY) for English', () => {
    expect(formatDateKey('2026-09-07', 'en')).toBe('09/07/2026');
    expect(formatDateKey('2026-12-25', 'en')).toBe('12/25/2026');
    expect(formatDateKey('2026-01-01', 'en')).toBe('01/01/2026');
  });

  test('formats Date instances accurately for both locales', () => {
    const date = new Date(2026, 3, 21); // April 21, 2026 (Tiradentes)
    expect(formatDate(date, 'pt')).toBe('21/04/2026');
    expect(formatDate(date, 'en')).toBe('04/21/2026');
  });

  test('handles invalid or empty inputs gracefully', () => {
    expect(formatDateKey('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDateLong(undefined)).toBe('');
  });
});
