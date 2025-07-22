// Airtable integration using MCP server for HBOX2 normalized database
import { SQUARE_CATALOG_ITEMS } from './squareIntegration.js';

// Base and table configuration
const AIRTABLE_BASE_ID = 'appFMHAYZrTskpmdX';
const TABLES = {
  CUSTOMERS: 'tblUS7uf11axEmL56',
  PRODUCTS: 'tblJ0hgzvDXWgQGmK',
  ORDERS: 'tblTq25QawVDHTTkV',
  ORDER_ITEMS: 'tblgV4XGeQE3VL9CW'
};

// Interfaces for our normalized database
export interface Customer {
  recordId?: string;
  name: string;
  email: string;
  phone?: string;
  shippingAddress?: string;
  status?: 'Todo' | 'In progress' | 'Done';
}

export interface Product {
  recordId?: string;
  productName: string;
  description: string;
  price: number;
  sku: string;
  stockQuantity?: number;
}

export interface Order {
  recordId?: string;
  orderNumber: string;
  customerRecordId: string;
  orderDate: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Canceled';
  totalAmount: number;
  promoCode?: string;
}

export interface OrderItem {
  recordId?: string;
  itemId: string;
  orderRecordId: string;
  productRecordId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discountAmount?: number;
}

export interface OrderData {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: {
      address_line_1?: string;
      address_line_2?: string;
      locality?: string;
      administrative_district_level_1?: string;
      postal_code?: string;
      country?: string;
    };
  };
  orderDetails: {
    packageType: string;
    addOns: string[];
    totalAmount: number;
    discountCode?: string;
    discountAmount?: number;
  };
  paymentDetails?: {
    paymentId?: string;
    squareOrderId?: string;
    squareCustomerId?: string;
  };
}

// Helper function to make Airtable API calls through our endpoint
async function callAirtableMCP(operation: string, args: any) {
  try {
    console.log(`📊 AIRTABLE API - Calling ${operation} with args:`, args);
    
    const response = await fetch('/api/airtable-operations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        ...args
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Airtable operation failed');
    }

    return result.data;

  } catch (error) {
    console.error(`❌ AIRTABLE API ERROR - ${operation} failed:`, error);
    throw error;
  }
}

// Find or create customer by email
export async function findOrCreateCustomer(customerInfo: OrderData['customerInfo']): Promise<{ recordId: string; isNew: boolean }> {
  try {
    console.log('📊 AIRTABLE - Finding or creating customer:', customerInfo.email);

    // First, try to find existing customer by email
    const existingCustomers = await callAirtableMCP('search_records', {
      baseId: AIRTABLE_BASE_ID,
      tableId: TABLES.CUSTOMERS,
      filterByFormula: `{Email} = "${customerInfo.email}"`
    });

    if (existingCustomers.records && existingCustomers.records.length > 0) {
      console.log('✅ AIRTABLE - Found existing customer:', existingCustomers.records[0].id);
      return { recordId: existingCustomers.records[0].id, isNew: false };
    }

    // Customer not found, create new one
    const fullName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();
    const shippingAddress = customerInfo.address ? 
      `${customerInfo.address.address_line_1 || ''}\n${customerInfo.address.address_line_2 || ''}\n${customerInfo.address.locality || ''}, ${customerInfo.address.administrative_district_level_1 || ''} ${customerInfo.address.postal_code || ''}`.trim() : '';

    const newCustomer = await callAirtableMCP('create_record', {
      baseId: AIRTABLE_BASE_ID,
      tableId: TABLES.CUSTOMERS,
      fields: {
        'Name': fullName,
        'Email': customerInfo.email,
        'Phone': customerInfo.phone || '',
        'Shipping Address': shippingAddress,
        'Status': 'Todo'
      }
    });

    console.log('✅ AIRTABLE - Created new customer:', newCustomer.id);
    return { recordId: newCustomer.id, isNew: true };

  } catch (error) {
    console.error('❌ AIRTABLE ERROR - Customer creation/lookup failed:', error);
    throw error;
  }
}

// Ensure all products exist in the Products table
export async function ensureProductsExist(): Promise<Map<string, string>> {
  try {
    console.log('📊 AIRTABLE - Ensuring products exist in catalog');

    const productMap = new Map<string, string>();

    // Get existing products
    const existingProducts = await callAirtableMCP('list_records', {
      baseId: AIRTABLE_BASE_ID,
      tableId: TABLES.PRODUCTS
    });

    // Create a lookup map of existing products by SKU
    const existingProductsBySku = new Map();
    if (existingProducts.records) {
      existingProducts.records.forEach((record: any) => {
        if (record.fields.SKU) {
          existingProductsBySku.set(record.fields.SKU, record.id);
        }
      });
    }

    // Check/create each product from Square catalog
    for (const [key, item] of Object.entries(SQUARE_CATALOG_ITEMS)) {
      const sku = `HB-${key.toUpperCase()}`;
      
      if (existingProductsBySku.has(sku)) {
        // Product exists
        productMap.set(key, existingProductsBySku.get(sku));
        console.log(`✅ AIRTABLE - Product exists: ${item.name} (${sku})`);
      } else {
        // Create product
        try {
          const newProduct = await callAirtableMCP('create_record', {
            baseId: AIRTABLE_BASE_ID,
            tableId: TABLES.PRODUCTS,
            fields: {
              'Product Name': item.name,
              'Description': getProductDescription(key),
              'Price': item.price,
              'SKU': sku,
              'Stock Quantity': 999 // Digital products have unlimited stock
            }
          });

          productMap.set(key, newProduct.id);
          console.log(`✅ AIRTABLE - Created product: ${item.name} (${sku})`);
        } catch (error) {
          console.error(`❌ AIRTABLE ERROR - Failed to create product ${item.name}:`, error);
        }
      }
    }

    return productMap;

  } catch (error) {
    console.error('❌ AIRTABLE ERROR - Product setup failed:', error);
    throw error;
  }
}

// Create order record
export async function createOrder(orderData: OrderData, customerRecordId: string): Promise<string> {
  try {
    const orderNumber = generateOrderNumber();
    console.log('📊 AIRTABLE - Creating order:', orderNumber);

    const orderRecord = await callAirtableMCP('create_record', {
      baseId: AIRTABLE_BASE_ID,
      tableId: TABLES.ORDERS,
      fields: {
        'Order Number': orderNumber,
        'Customer': [customerRecordId],
        'Order Date': new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        'Status': 'Pending',
        'Total Amount': orderData.orderDetails.totalAmount,
        'Promo Code': orderData.orderDetails.discountCode || ''
      }
    });

    console.log('✅ AIRTABLE - Created order:', orderRecord.id);
    return orderRecord.id;

  } catch (error) {
    console.error('❌ AIRTABLE ERROR - Order creation failed:', error);
    throw error;
  }
}

// Create order items for packages and add-ons
export async function createOrderItems(
  orderRecordId: string, 
  orderData: OrderData, 
  productMap: Map<string, string>
): Promise<string[]> {
  try {
    console.log('📊 AIRTABLE - Creating order items for order:', orderRecordId);
    
    const orderItemIds: string[] = [];

    // Create item for main package
    const packageProductId = productMap.get(orderData.orderDetails.packageType);
    if (packageProductId) {
      const packageItem = SQUARE_CATALOG_ITEMS[orderData.orderDetails.packageType as keyof typeof SQUARE_CATALOG_ITEMS];
      const packageOrderItem = await callAirtableMCP('create_record', {
        baseId: AIRTABLE_BASE_ID,
        tableId: TABLES.ORDER_ITEMS,
        fields: {
          'Item ID': `${orderRecordId}-PKG-${orderData.orderDetails.packageType}`,
          'Order': [orderRecordId],
          'Product': [packageProductId],
          'Quantity': 1,
          'Unit Price': packageItem.price,
          'Line Total': packageItem.price,
          'Discount Amount': 0
        }
      });
      
      orderItemIds.push(packageOrderItem.id);
      console.log(`✅ AIRTABLE - Created package item: ${packageItem.name}`);
    }

    // Create items for add-ons
    for (const addOnKey of orderData.orderDetails.addOns) {
      const addOnProductId = productMap.get(addOnKey);
      if (addOnProductId) {
        const addOnItem = SQUARE_CATALOG_ITEMS[addOnKey as keyof typeof SQUARE_CATALOG_ITEMS];
        const addOnOrderItem = await callAirtableMCP('create_record', {
          baseId: AIRTABLE_BASE_ID,
          tableId: TABLES.ORDER_ITEMS,
          fields: {
            'Item ID': `${orderRecordId}-ADD-${addOnKey}`,
            'Order': [orderRecordId],
            'Product': [addOnProductId],
            'Quantity': 1,
            'Unit Price': addOnItem.price,
            'Line Total': addOnItem.price,
            'Discount Amount': 0
          }
        });
        
        orderItemIds.push(addOnOrderItem.id);
        console.log(`✅ AIRTABLE - Created add-on item: ${addOnItem.name}`);
      }
    }

    // Apply discount if present
    if (orderData.orderDetails.discountCode && orderData.orderDetails.discountAmount && orderItemIds.length > 0) {
      // Apply discount to the first item (main package)
      const discountAmount = orderData.orderDetails.discountAmount;
      await callAirtableMCP('update_records', {
        baseId: AIRTABLE_BASE_ID,
        tableId: TABLES.ORDER_ITEMS,
        records: [{
          id: orderItemIds[0],
          fields: {
            'Discount Amount': discountAmount,
            'Line Total': SQUARE_CATALOG_ITEMS[orderData.orderDetails.packageType as keyof typeof SQUARE_CATALOG_ITEMS].price - discountAmount
          }
        }]
      });
      
      console.log(`✅ AIRTABLE - Applied discount: $${discountAmount} with code ${orderData.orderDetails.discountCode}`);
    }

    return orderItemIds;

  } catch (error) {
    console.error('❌ AIRTABLE ERROR - Order items creation failed:', error);
    throw error;
  }
}

// Main function to create complete order in Airtable
export async function createCompleteOrder(orderData: OrderData): Promise<{
  customerRecordId: string;
  orderRecordId: string;
  orderItemIds: string[];
  isNewCustomer: boolean;
}> {
  try {
    console.log('📊 AIRTABLE - Creating complete order in Airtable');

    // Step 1: Find or create customer
    const { recordId: customerRecordId, isNew: isNewCustomer } = await findOrCreateCustomer(orderData.customerInfo);

    // Step 2: Ensure all products exist
    const productMap = await ensureProductsExist();

    // Step 3: Create order
    const orderRecordId = await createOrder(orderData, customerRecordId);

    // Step 4: Create order items
    const orderItemIds = await createOrderItems(orderRecordId, orderData, productMap);

    console.log('✅ AIRTABLE - Complete order created successfully');
    console.log(`📊 AIRTABLE - Customer: ${customerRecordId} (${isNewCustomer ? 'NEW' : 'EXISTING'})`);
    console.log(`📊 AIRTABLE - Order: ${orderRecordId}`);
    console.log(`📊 AIRTABLE - Items: ${orderItemIds.length} items created`);

    return {
      customerRecordId,
      orderRecordId,
      orderItemIds,
      isNewCustomer
    };

  } catch (error) {
    console.error('❌ AIRTABLE ERROR - Complete order creation failed:', error);
    throw error;
  }
}

// Update order with Square payment information
export async function updateOrderWithPaymentInfo(
  orderRecordId: string, 
  paymentInfo: { paymentId: string; squareOrderId: string; squareCustomerId: string }
): Promise<void> {
  try {
    console.log('📊 AIRTABLE - Updating order with payment info:', orderRecordId);

    // Since we don't have Square payment fields in the current schema,
    // we'll add this info to the notes or create custom fields
    // For now, we'll update the status to Processing
    await callAirtableMCP('update_records', {
      baseId: AIRTABLE_BASE_ID,
      tableId: TABLES.ORDERS,
      records: [{
        id: orderRecordId,
        fields: {
          'Status': 'Processing'
          // Could add custom fields for Square IDs if needed
        }
      }]
    });

    console.log('✅ AIRTABLE - Order updated with payment info');

  } catch (error) {
    console.error('❌ AIRTABLE ERROR - Failed to update order with payment info:', error);
    // Don't throw - this is not critical for order processing
  }
}

// Helper functions
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `HB-${timestamp}-${random}`;
}

function getProductDescription(productKey: string): string {
  const descriptions: Record<string, string> = {
    'starter': 'Perfect for small collections - digitize up to 100 photos with basic scanning and digital delivery',
    'popular': 'Most popular package - digitize up to 500 photos with enhanced scanning and restoration options',
    'dustyRose': 'Premium package with professional restoration and enhancement services for larger collections',
    'eternal': 'Ultimate package with comprehensive digitization, restoration, and premium archival services',
    'usbDrive': 'Custom USB drive with your digitized memories for easy sharing and backup',
    'expeditedProcessing': 'Get your digitized memories back faster with expedited processing',
    'rushProcessing': 'Urgent processing for time-sensitive projects - fastest turnaround available',
    'onlineGallery': 'Secure online gallery with cloud backup and easy sharing capabilities'
  };
  
  return descriptions[productKey] || 'HeritageBox digitization service';
}

// Legacy compatibility functions for Checkout.tsx
export async function sendOrderToAirtable(checkoutOrderData: any): Promise<{
  customerRecordId: string;
  orderRecordId: string;
  orderItemIds: string[];
  isNewCustomer: boolean;
}> {
  // Transform the checkout order data to the OrderData interface format
  const transformedOrderData = transformCheckoutOrderToOrderData(checkoutOrderData);
  return await createCompleteOrder(transformedOrderData);
}

// Parse add-on details from checkout form (handles both string[] and formatted string[] from checkout)
export function parseAddOnDetails(addOns: string[] | string): string {
  // Handle single string input
  if (typeof addOns === 'string') return addOns;
  
  if (!addOns || addOns.length === 0) return 'None';
  
  // If addOns are already formatted strings from checkout (like "1 USB Drive(s) - $24.95")
  if (addOns.length > 0 && addOns[0].includes('$')) {
    return addOns.join(', ');
  }
  
  // If addOns are keys that need to be converted to names
  const addOnNames = addOns.map(addOnKey => {
    const item = SQUARE_CATALOG_ITEMS[addOnKey as keyof typeof SQUARE_CATALOG_ITEMS];
    return item ? item.name : addOnKey;
  });
  
  return addOnNames.join(', ');
}

// Parse speed/processing details (handles both string[] and string input)
export function parseSpeedDetails(speedInput: string[] | string): string {
  // Handle single string input (from checkout form)
  if (typeof speedInput === 'string') return speedInput;
  
  if (!speedInput || speedInput.length === 0) return 'Standard Processing';
  
  const speedOptions = speedInput.filter(addOn => 
    addOn === 'expeditedProcessing' || addOn === 'rushProcessing'
  );
  
  if (speedOptions.includes('rushProcessing')) {
    return 'Rush Processing (1-2 business days)';
  } else if (speedOptions.includes('expeditedProcessing')) {
    return 'Expedited Processing (3-5 business days)';
  }
  
  return 'Standard Processing (7-10 business days)';
}

// Transform Checkout order data to OrderData interface format
function transformCheckoutOrderToOrderData(checkoutOrder: any): OrderData {
  // Map package name to the expected format
  const packageTypeMap: Record<string, string> = {
    'Starter': 'starter',
    'Popular': 'popular',
    'Dusty Rose': 'dustyRose',
    'Eternal': 'eternal'
  };
  
  const packageType = packageTypeMap[checkoutOrder.orderDetails.package] || 'popular';
  
  // Extract add-ons from the checkout format
  const addOns: string[] = [];
  
  // Check addOnDetails object for selected items
  if (checkoutOrder.orderDetails.addOnDetails) {
    const details = checkoutOrder.orderDetails.addOnDetails;
    if (details.storageUpgrade && details.storageUpgrade.selected) {
      addOns.push('usbDrive');
    }
    if (details.backupCopies && details.backupCopies.selected) {
      addOns.push('onlineGallery');
    }
  }
  
  // Check digitizing speed
  if (checkoutOrder.orderDetails.digitizingSpeed) {
    const speed = checkoutOrder.orderDetails.digitizingSpeed.toLowerCase();
    if (speed === 'expedited') {
      addOns.push('expeditedProcessing');
    } else if (speed === 'rush') {
      addOns.push('rushProcessing');
    }
  }
  
  // Convert total amount from string to number
  const totalAmount = parseFloat(checkoutOrder.orderDetails.totalAmount.replace('$', ''));
  const discountAmount = checkoutOrder.orderDetails.discountAmount 
    ? parseFloat(checkoutOrder.orderDetails.discountAmount.replace('$', ''))
    : 0;
  
  return {
    customerInfo: {
      firstName: checkoutOrder.customerInfo.firstName,
      lastName: checkoutOrder.customerInfo.lastName,
      email: checkoutOrder.customerInfo.email,
      phone: checkoutOrder.customerInfo.phone,
      address: {
        address_line_1: checkoutOrder.customerInfo.address,
        locality: checkoutOrder.customerInfo.city,
        administrative_district_level_1: checkoutOrder.customerInfo.state,
        postal_code: checkoutOrder.customerInfo.zipCode,
        country: 'US'
      }
    },
    orderDetails: {
      packageType: packageType,
      addOns: addOns,
      totalAmount: totalAmount,
      discountCode: checkoutOrder.orderDetails.couponCode !== 'None' ? checkoutOrder.orderDetails.couponCode : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined
    },
    paymentDetails: {
      // These would be populated if we had Square payment info
      paymentId: undefined,
      squareOrderId: undefined,
      squareCustomerId: undefined
    }
  };
}

// Export configuration for easy access
export const AIRTABLE_CONFIG = {
  BASE_ID: AIRTABLE_BASE_ID,
  TABLES
};
