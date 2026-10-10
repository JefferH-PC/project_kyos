import {
  getCalendarDaysElapsed,
  getIOFRate,
  getIRRate,
  calculateTaxBreakdown
} from './tax';

describe('Brazilian Fixed Income Tax Engine (IOF & IR)', () => {
  test('calculates calendar days elapsed between dates', () => {
    expect(getCalendarDaysElapsed('2026-01-01', '2026-01-11')).toBe(10);
    expect(getCalendarDaysElapsed('2026-01-10', '2026-01-10')).toBe(0);
    expect(getCalendarDaysElapsed('2026-01-15', '2026-01-10')).toBe(0);
  });

  test('IOF rate starts at 96% and hits exactly 0% on day 30 and beyond', () => {
    expect(getIOFRate(0)).toBe(96);
    expect(getIOFRate(1)).toBe(96);
    expect(getIOFRate(2)).toBe(93);
    expect(getIOFRate(15)).toBe(50);
    expect(getIOFRate(29)).toBe(3);
    expect(getIOFRate(30)).toBe(0);
    expect(getIOFRate(31)).toBe(0);
    expect(getIOFRate(100)).toBe(0);
  });

  test('IR rate follows Brazilian regressive brackets (22.5%, 20%, 17.5%, 15%)', () => {
    expect(getIRRate(0)).toBe(22.5);
    expect(getIRRate(180)).toBe(22.5);
    expect(getIRRate(181)).toBe(20.0);
    expect(getIRRate(360)).toBe(20.0);
    expect(getIRRate(361)).toBe(17.5);
    expect(getIRRate(720)).toBe(17.5);
    expect(getIRRate(721)).toBe(15.0);
    expect(getIRRate(1000)).toBe(15.0);
  });

  test('calculates correct net yield and breakdown before 30 days (IOF + IR)', () => {
    // On day 10: IOF is 66%, IR is 22.5%
    // Gross = 100
    // IOF = 66
    // Taxable = 34
    // IR = 34 * 0.225 = 7.65
    // Total Tax = 66 + 7.65 = 73.65
    // Net = 100 - 73.65 = 26.35
    const result = calculateTaxBreakdown(100, 10);
    expect(result.grossYield).toBe(100);
    expect(result.daysElapsed).toBe(10);
    expect(result.iofRate).toBe(66);
    expect(result.iofAmount).toBeCloseTo(66, 2);
    expect(result.taxableYield).toBeCloseTo(34, 2);
    expect(result.irRate).toBe(22.5);
    expect(result.irAmount).toBeCloseTo(7.65, 2);
    expect(result.totalTax).toBeCloseTo(73.65, 2);
    expect(result.netYield).toBeCloseTo(26.35, 2);
  });

  test('calculates correct net yield after 30 days (0% IOF, only IR)', () => {
    // On day 45: IOF is 0%, IR is 22.5%
    // Gross = 1000
    // IOF = 0
    // IR = 225
    // Net = 775
    const result = calculateTaxBreakdown(1000, 45);
    expect(result.iofRate).toBe(0);
    expect(result.iofAmount).toBe(0);
    expect(result.irRate).toBe(22.5);
    expect(result.irAmount).toBe(225);
    expect(result.netYield).toBe(775);
  });

  test('calculates correct net yield for long-term investments (>720 days, 15% IR)', () => {
    const result = calculateTaxBreakdown(1000, 800);
    expect(result.iofRate).toBe(0);
    expect(result.irRate).toBe(15.0);
    expect(result.irAmount).toBe(150);
    expect(result.netYield).toBe(850);
  });
});
