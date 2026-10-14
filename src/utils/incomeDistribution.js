/**
 * Utility for distributing daily investment yield across recovery and wishlist queues.
 *
 * Rules:
 * 1. Recovery items (debts/unplanned expenses) have strict priority.
 * 2. When an active recovery item reaches R$ 0, it is completed and removed.
 *    The next recovery item goes straight to the processing lane on the same day.
 * 3. Leftover income carries over to the next item on the same day.
 * 4. Once recovery is completely cleared (or if no recovery items exist),
 *    leftover income flows into Wishlist.
 * 5. In the wishlist, the active processing item (or first expense if none is processing)
 *    absorbs income. When its price reaches R$ 0, it becomes 'ready', and the next
 *    expense item goes straight to the processing lane on the same day and absorbs any
 *    remaining leftover income.
 */

const EPSILON = 1e-4;

const roundCents = (val) => Math.round(val * 100) / 100;

/**
 * Distributes daily income across recovery and wishlist slots with carryover.
 *
 * @param {Object} params
 * @param {Array} [params.recoverySlots=[]]
 * @param {Array} [params.wishlistSlots=[]]
 * @param {number} [params.dailyYield=0]
 * @returns {{ recoverySlots: Array, wishlistSlots: Array, completedSlots: Array }}
 */
export function distributeDailyIncome({ recoverySlots = [], wishlistSlots = [], dailyYield = 0 }) {
  let recSlots = Array.isArray(recoverySlots) ? JSON.parse(JSON.stringify(recoverySlots)) : [];
  let wishSlots = Array.isArray(wishlistSlots) ? JSON.parse(JSON.stringify(wishlistSlots)) : [];
  const completedSlots = [];

  let remainingYield = Number(dailyYield);
  if (!Number.isFinite(remainingYield) || remainingYield <= 0) {
    return {
      recoverySlots: recSlots,
      wishlistSlots: wishSlots,
      completedSlots
    };
  }

  // 1. Process Recovery Slots first
  while (remainingYield > EPSILON && recSlots.length > 0) {
    let activeRecIdx = recSlots.findIndex((s) => s.type === 'recovery' && s.isProcessing);
    if (activeRecIdx === -1) {
      activeRecIdx = 0;
      recSlots[0] = { ...recSlots[0], isProcessing: true };
    }

    const currentSlot = recSlots[activeRecIdx];
    const currentPrice = Number(currentSlot.price) || 0;
    const originalPrice = currentSlot.originalPrice ?? currentSlot.price ?? currentPrice;

    if (remainingYield >= currentPrice - EPSILON) {
      remainingYield = Math.max(0, remainingYield - currentPrice);
      completedSlots.push({
        id: currentSlot.id,
        name: currentSlot.expenseName,
        price: originalPrice,
        type: 'recovery'
      });

      // Remove completed recovery slot and promote next to processing lane
      recSlots = recSlots
        .filter((_, idx) => idx !== activeRecIdx)
        .map((item, idx) => (idx === 0 ? { ...item, isProcessing: true } : item));
    } else {
      const nextPrice = roundCents(Math.max(0, currentPrice - remainingYield));
      recSlots = recSlots.map((item, idx) =>
        idx === activeRecIdx ? { ...item, price: nextPrice, originalPrice } : item
      );
      remainingYield = 0;
    }
  }

  // Clean micro-fractions on remainingYield
  if (remainingYield < EPSILON) {
    remainingYield = 0;
  }

  // 2. Process Wishlist Slots if recovery is completely clear and yield remains
  const hasPendingRecovery = recSlots.some((s) => s.type === 'recovery');
  if (!hasPendingRecovery && remainingYield > 0) {
    while (remainingYield > EPSILON) {
      let activeWishIdx = wishSlots.findIndex((s) => s.type === 'processing');
      if (activeWishIdx === -1) {
        activeWishIdx = wishSlots.findIndex((s) => s.type === 'expense');
        if (activeWishIdx >= 0) {
          wishSlots[activeWishIdx] = { ...wishSlots[activeWishIdx], type: 'processing' };
        }
      }

      if (activeWishIdx === -1) {
        // No more items eligible for processing in wishlist
        break;
      }

      const currentSlot = wishSlots[activeWishIdx];
      const currentPrice = Number(currentSlot.price) || 0;
      const originalPrice = currentSlot.originalPrice ?? currentSlot.price ?? currentPrice;

      if (remainingYield >= currentPrice - EPSILON) {
        remainingYield = Math.max(0, remainingYield - currentPrice);
        completedSlots.push({
          id: currentSlot.id,
          name: currentSlot.expenseName,
          price: originalPrice,
          type: 'wishlist'
        });

        // Current item becomes ready with 0 price
        wishSlots[activeWishIdx] = {
          ...currentSlot,
          type: 'ready',
          price: 0,
          originalPrice
        };

        // Next expense goes straight to processing lane in the same day
        const nextExpenseIdx = wishSlots.findIndex((s) => s.type === 'expense');
        if (nextExpenseIdx >= 0) {
          wishSlots[nextExpenseIdx] = {
            ...wishSlots[nextExpenseIdx],
            type: 'processing'
          };
        }
      } else {
        const nextPrice = roundCents(Math.max(0, currentPrice - remainingYield));
        wishSlots[activeWishIdx] = {
          ...currentSlot,
          type: 'processing',
          price: nextPrice,
          originalPrice
        };
        remainingYield = 0;
      }
    }
  }

  return {
    recoverySlots: recSlots,
    wishlistSlots: wishSlots,
    completedSlots
  };
}
