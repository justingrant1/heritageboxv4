// Centralized order number generation utility

const ORDER_COUNT_KEY = 'hb_order_count';
const BASE_ORDER_NUMBER = 100420;
const INCREMENT_BY = 5;

/**
 * Generates sequential order numbers starting at HB100420 and incrementing by 5
 * Format: HB100420, HB100425, HB100430, etc.
 */
export const generateOrderNumber = (): string => {
  const storedCount = localStorage.getItem(ORDER_COUNT_KEY);
  const currentCount = storedCount ? parseInt(storedCount) : 0;
  
  // Calculate the order number: base + (count * increment)
  const orderNumber = BASE_ORDER_NUMBER + (currentCount * INCREMENT_BY);
  
  // Increment the counter for next order
  const newCount = currentCount + 1;
  localStorage.setItem(ORDER_COUNT_KEY, newCount.toString());
  
  console.log(`Order number generated: HB${orderNumber} (count: ${currentCount} -> ${newCount})`);
  
  return `HB${orderNumber}`;
};

/**
 * Get the next order number without incrementing the counter (for preview purposes)
 */
export const getNextOrderNumber = (): string => {
  const storedCount = localStorage.getItem(ORDER_COUNT_KEY);
  const currentCount = storedCount ? parseInt(storedCount) : 0;
  const nextOrderNumber = BASE_ORDER_NUMBER + (currentCount * INCREMENT_BY);
  
  return `HB${nextOrderNumber}`;
};

/**
 * Reset order counter (for testing purposes)
 */
export const resetOrderCounter = (): void => {
  localStorage.removeItem(ORDER_COUNT_KEY);
  console.log('Order counter reset');
};
