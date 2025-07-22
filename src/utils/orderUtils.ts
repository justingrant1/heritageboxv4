// Centralized order number generation
// Generates sequential order numbers starting at HB100420 and incrementing by 5

const BASE_ORDER_NUMBER = 100420;
const INCREMENT_VALUE = 5;
const ORDER_COUNT_KEY = 'hb_order_counter';

export const generateSequentialOrderNumber = (): string => {
  // Get current counter from localStorage (starts at 0)
  const storedCounter = localStorage.getItem(ORDER_COUNT_KEY);
  const currentCounter = storedCounter ? parseInt(storedCounter) : 0;
  
  // Calculate the actual order number: BASE + (counter * INCREMENT)
  const orderNumber = BASE_ORDER_NUMBER + (currentCounter * INCREMENT_VALUE);
  
  // Increment counter for next order
  const nextCounter = currentCounter + 1;
  localStorage.setItem(ORDER_COUNT_KEY, nextCounter.toString());
  
  // Format as HB100420, HB100425, HB100430, etc.
  const formattedOrderNumber = `HB${orderNumber}`;
  
  console.log(`Generated order number: ${formattedOrderNumber} (counter: ${currentCounter} -> ${nextCounter})`);
  
  return formattedOrderNumber;
};

// Function to get the next order number without incrementing (for preview purposes)
export const getNextOrderNumber = (): string => {
  const storedCounter = localStorage.getItem(ORDER_COUNT_KEY);
  const currentCounter = storedCounter ? parseInt(storedCounter) : 0;
  const orderNumber = BASE_ORDER_NUMBER + (currentCounter * INCREMENT_VALUE);
  return `HB${orderNumber}`;
};

// Function to reset order counter (for testing purposes)
export const resetOrderCounter = (): void => {
  localStorage.removeItem(ORDER_COUNT_KEY);
  console.log('Order counter reset');
};
