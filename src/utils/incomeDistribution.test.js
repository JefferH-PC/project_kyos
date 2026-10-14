import { distributeDailyIncome } from './incomeDistribution';

describe('distributeDailyIncome', () => {
  test('returns cloned slots unchanged and no completions when dailyYield is 0 or negative', () => {
    const recoverySlots = [{ id: 'r1', type: 'recovery', isProcessing: true, price: 50 }];
    const wishlistSlots = [{ id: 'w1', type: 'processing', price: 30 }];

    const resultZero = distributeDailyIncome({ recoverySlots, wishlistSlots, dailyYield: 0 });
    expect(resultZero.recoverySlots).toEqual(recoverySlots);
    expect(resultZero.wishlistSlots).toEqual(wishlistSlots);
    expect(resultZero.completedSlots).toEqual([]);

    const resultNeg = distributeDailyIncome({ recoverySlots, wishlistSlots, dailyYield: -10 });
    expect(resultNeg.recoverySlots).toEqual(recoverySlots);
    expect(resultNeg.wishlistSlots).toEqual(wishlistSlots);
    expect(resultNeg.completedSlots).toEqual([]);
  });

  test('handles empty slot arrays gracefully', () => {
    const result = distributeDailyIncome({ recoverySlots: [], wishlistSlots: [], dailyYield: 50 });
    expect(result.recoverySlots).toEqual([]);
    expect(result.wishlistSlots).toEqual([]);
    expect(result.completedSlots).toEqual([]);
  });

  test('user requirement: leftover income in wishlist carries over to next item on same day and promotes it to processing', () => {
    // Item 1 needs 30, Item 2 is pending expense with price 50
    // Income is 40 -> Item 1 completes (ready), Item 2 goes straight to processing with price 40 (50 - 10)
    const wishlistSlots = [
      { id: 'w1', type: 'processing', expenseName: 'Keyboard', price: 30, originalPrice: 50 },
      { id: 'w2', type: 'expense', expenseName: 'Mouse', price: 50, originalPrice: 50 }
    ];

    const result = distributeDailyIncome({
      recoverySlots: [],
      wishlistSlots,
      dailyYield: 40
    });

    expect(result.completedSlots).toEqual([
      { id: 'w1', name: 'Keyboard', price: 50, type: 'wishlist' }
    ]);

    expect(result.wishlistSlots).toEqual([
      { id: 'w1', type: 'ready', expenseName: 'Keyboard', price: 0, originalPrice: 50 },
      { id: 'w2', type: 'processing', expenseName: 'Mouse', price: 40, originalPrice: 50 }
    ]);
  });

  test('when item finishes with exact yield (0 leftover), next wishlist item still goes straight to processing lane', () => {
    const wishlistSlots = [
      { id: 'w1', type: 'processing', expenseName: 'Keyboard', price: 30, originalPrice: 30 },
      { id: 'w2', type: 'expense', expenseName: 'Mouse', price: 50, originalPrice: 50 }
    ];

    const result = distributeDailyIncome({
      recoverySlots: [],
      wishlistSlots,
      dailyYield: 30
    });

    expect(result.completedSlots).toHaveLength(1);
    expect(result.completedSlots[0].id).toBe('w1');

    expect(result.wishlistSlots).toEqual([
      { id: 'w1', type: 'ready', expenseName: 'Keyboard', price: 0, originalPrice: 30 },
      { id: 'w2', type: 'processing', expenseName: 'Mouse', price: 50, originalPrice: 50 }
    ]);
  });

  test('cascades through multiple wishlist items in a single day if yield is large enough', () => {
    const wishlistSlots = [
      { id: 'w1', type: 'processing', expenseName: 'Cables', price: 10, originalPrice: 10 },
      { id: 'w2', type: 'expense', expenseName: 'Desk Mat', price: 20, originalPrice: 20 },
      { id: 'w3', type: 'expense', expenseName: 'Monitor', price: 100, originalPrice: 100 }
    ];

    // 10 + 20 = 30 used to complete w1 and w2; remaining 15 applied to w3
    const result = distributeDailyIncome({
      recoverySlots: [],
      wishlistSlots,
      dailyYield: 45
    });

    expect(result.completedSlots).toEqual([
      { id: 'w1', name: 'Cables', price: 10, type: 'wishlist' },
      { id: 'w2', name: 'Desk Mat', price: 20, type: 'wishlist' }
    ]);

    expect(result.wishlistSlots).toEqual([
      { id: 'w1', type: 'ready', expenseName: 'Cables', price: 0, originalPrice: 10 },
      { id: 'w2', type: 'ready', expenseName: 'Desk Mat', price: 0, originalPrice: 20 },
      { id: 'w3', type: 'processing', expenseName: 'Monitor', price: 85, originalPrice: 100 }
    ]);
  });

  test('user requirement for recovery: leftover income carries over to next recovery item and promotes it to processing lane', () => {
    const recoverySlots = [
      { id: 'r1', type: 'recovery', isProcessing: true, expenseName: 'Dental bill', price: 30, originalPrice: 30 },
      { id: 'r2', type: 'recovery', isProcessing: false, expenseName: 'Car repair', price: 50, originalPrice: 50 }
    ];

    const result = distributeDailyIncome({
      recoverySlots,
      wishlistSlots: [],
      dailyYield: 40
    });

    expect(result.completedSlots).toEqual([
      { id: 'r1', name: 'Dental bill', price: 30, type: 'recovery' }
    ]);

    // r1 is removed, r2 is now index 0, isProcessing = true, with remaining price 40 (50 - 10)
    expect(result.recoverySlots).toEqual([
      { id: 'r2', type: 'recovery', isProcessing: true, expenseName: 'Car repair', price: 40, originalPrice: 50 }
    ]);
  });

  test('spills leftover income from fully cleared recovery into wishlist in the same day', () => {
    const recoverySlots = [
      { id: 'r1', type: 'recovery', isProcessing: true, expenseName: 'Dentist', price: 30, originalPrice: 30 }
    ];
    const wishlistSlots = [
      { id: 'w1', type: 'expense', expenseName: 'Headphones', price: 100, originalPrice: 100 }
    ];

    // 40 yield: 30 completes recovery; remaining 10 starts funding wishlist item #1
    const result = distributeDailyIncome({
      recoverySlots,
      wishlistSlots,
      dailyYield: 40
    });

    expect(result.completedSlots).toEqual([
      { id: 'r1', name: 'Dentist', price: 30, type: 'recovery' }
    ]);
    expect(result.recoverySlots).toEqual([]);
    expect(result.wishlistSlots).toEqual([
      { id: 'w1', type: 'processing', expenseName: 'Headphones', price: 90, originalPrice: 100 }
    ]);
  });

  test('incomplete recovery blocks wishlist from receiving any income on that day', () => {
    const recoverySlots = [
      { id: 'r1', type: 'recovery', isProcessing: true, expenseName: 'Hospital', price: 100, originalPrice: 100 }
    ];
    const wishlistSlots = [
      { id: 'w1', type: 'expense', expenseName: 'Camera', price: 200, originalPrice: 200 }
    ];

    const result = distributeDailyIncome({
      recoverySlots,
      wishlistSlots,
      dailyYield: 40
    });

    expect(result.completedSlots).toEqual([]);
    expect(result.recoverySlots).toEqual([
      { id: 'r1', type: 'recovery', isProcessing: true, expenseName: 'Hospital', price: 60, originalPrice: 100 }
    ]);
    // Wishlist remains completely untouched
    expect(result.wishlistSlots).toEqual(wishlistSlots);
  });

  test('skips items that are already ready and targets the active processing or next expense item', () => {
    const wishlistSlots = [
      { id: 'w1', type: 'ready', expenseName: 'Bought Watch', price: 0, originalPrice: 150 },
      { id: 'w2', type: 'processing', expenseName: 'Coffee Maker', price: 25, originalPrice: 80 },
      { id: 'w3', type: 'expense', expenseName: 'Grinder', price: 60, originalPrice: 60 }
    ];

    const result = distributeDailyIncome({
      recoverySlots: [],
      wishlistSlots,
      dailyYield: 35
    });

    expect(result.completedSlots).toEqual([
      { id: 'w2', name: 'Coffee Maker', price: 80, type: 'wishlist' }
    ]);

    expect(result.wishlistSlots).toEqual([
      { id: 'w1', type: 'ready', expenseName: 'Bought Watch', price: 0, originalPrice: 150 },
      { id: 'w2', type: 'ready', expenseName: 'Coffee Maker', price: 0, originalPrice: 80 },
      { id: 'w3', type: 'processing', expenseName: 'Grinder', price: 50, originalPrice: 60 }
    ]);
  });

  test('handles floating point arithmetic with cents precision cleanly', () => {
    const wishlistSlots = [
      { id: 'w1', type: 'processing', expenseName: 'Book', price: 29.99, originalPrice: 29.99 },
      { id: 'w2', type: 'expense', expenseName: 'Pen', price: 15.50, originalPrice: 15.50 }
    ];

    const result = distributeDailyIncome({
      recoverySlots: [],
      wishlistSlots,
      dailyYield: 35.00
    });

    // 35.00 - 29.99 = 5.01 leftover. 15.50 - 5.01 = 10.49
    expect(result.completedSlots).toEqual([
      { id: 'w1', name: 'Book', price: 29.99, type: 'wishlist' }
    ]);

    expect(result.wishlistSlots[0]).toMatchObject({ id: 'w1', type: 'ready', price: 0 });
    expect(result.wishlistSlots[1]).toMatchObject({ id: 'w2', type: 'processing', price: 10.49 });
  });
});
