// Utility functions for Square API integration
import { generateOrderId } from './emailUtils';

// Square API endpoints (will be set from environment variables)
const SQUARE_API_URL = process.env.SQUARE_API_URL || 'https://connect.squareup.com';
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

// Interface definitions for Square API requests
interface SquareCustomer {
  given_name?: string;
  family_name?: string;
  email_address?: string;
  phone_number?: string;
  address?: {
    address_line_1?: string;
    locality?: string;
    administrative_district_level_1?: string;
    postal_code?: string;
    country?: string;
  };
  reference_id?: string;
}

interface SquareOrderLineItem {
  name: string;
  quantity: string;
  base_price_money?: {
    amount: number;
    currency: string;
  };
  note?: string;
}

interface SquareOrder {
  location_id: string;
  customer_id?: string;
  reference_id?: string;
  line_items: SquareOrderLineItem[];
  metadata?: { [key: string]: string };
}

// Create customer in Square
export async function createSquareCustomer(customerData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const squareCustomer: SquareCustomer = {
      given_name: customerData.firstName,
      family_name: customerData.lastName,
      email_address: customerData.email,
      phone_number: customerData.phone,
      address: {
        address_line_1: customerData.address,
        locality: customerData.city,
        administrative_district_level_1: customerData.state,
        postal_code: customerData.zipCode,
        country: 'US'
      },
      reference_id: `hb_${Date.now()}`
    };

    const response = await fetch(`${SQUARE_API_URL}/v2/customers`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-02-15',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        given_name: squareCustomer.given_name,
        family_name: squareCustomer.family_name,
        email_address: squareCustomer.email_address,
        phone_number: squareCustomer.phone_number,
        address: squareCustomer.address,
        reference_id: squareCustomer.reference_id,
        idempotency_key: crypto.randomUUID()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Square customer creation failed:', result);
      return { 
        success: false, 
        error: result.errors?.[0]?.detail || 'Failed to create customer in Square' 
      };
    }

    return {
      success: true,
      customerId: result.customer?.id
    };
  } catch (error) {
    console.error('Error creating Square customer:', error);
    return { 
      success: false, 
      error: 'Network error creating customer in Square' 
    };
  }
}

// Create order in Square
export async function createSquareOrder(orderData: {
  customerId?: string;
  packageType: string;
  packagePrice: number;
  usbDrives: number;
  cloudBackup: number;
  digitizingSpeed: string;
  digitizingPrice: number;
  couponCode?: string;
  discountPercent: number;
  totalAmount: number;
  orderId: string;
}): Promise<{ success: boolean; squareOrderId?: string; error?: string }> {
  try {
    // Create line items for the order
    const lineItems: SquareOrderLineItem[] = [];

    // Main package line item
    lineItems.push({
      name: `${orderData.packageType} Package - Memory Digitization`,
      quantity: '1',
      base_price_money: {
        amount: Math.round(orderData.packagePrice * 100), // Convert to cents
        currency: 'USD'
      },
      note: `Heritage Box ${orderData.packageType} memory digitization package`
    });

    // USB drives if any
    if (orderData.usbDrives > 0) {
      lineItems.push({
        name: 'Custom USB Drive',
        quantity: orderData.usbDrives.toString(),
        base_price_money: {
          amount: 2495, // $24.95 in cents
          currency: 'USD'
        },
        note: 'Physical backup of digitized memories'
      });
    }

    // Cloud backup if any (free but we'll track it)
    if (orderData.cloudBackup > 0) {
      lineItems.push({
        name: 'Online Gallery & Backup (1 Year)',
        quantity: orderData.cloudBackup.toString(),
        base_price_money: {
          amount: 0,
          currency: 'USD'
        },
        note: 'Secure cloud storage and online gallery access - Included free'
      });
    }

    // Digitizing speed upgrade if not standard
    if (orderData.digitizingPrice > 0) {
      lineItems.push({
        name: `${orderData.digitizingSpeed} Processing`,
        quantity: '1',
        base_price_money: {
          amount: Math.round(orderData.digitizingPrice * 100),
          currency: 'USD'
        },
        note: `Expedited digitization processing - ${orderData.digitizingSpeed}`
      });
    }

    // Create discounts array if applicable
    const discounts = [];
    if (orderData.couponCode && orderData.discountPercent > 0) {
      discounts.push({
        name: `Coupon: ${orderData.couponCode}`,
        percentage: orderData.discountPercent.toString(),
        scope: 'ORDER'
      });
    }

    const squareOrder: any = {
      location_id: SQUARE_LOCATION_ID,
      reference_id: orderData.orderId,
      line_items: lineItems,
      metadata: {
        source: 'HeritageBox Website',
        order_type: 'Memory Digitization',
        package_type: orderData.packageType,
        processing_speed: orderData.digitizingSpeed,
        ...(orderData.couponCode && { coupon_code: orderData.couponCode })
      }
    };

    // Add customer ID if available
    if (orderData.customerId) {
      squareOrder.customer_id = orderData.customerId;
    }

    // Add discounts if any
    if (discounts.length > 0) {
      squareOrder.discounts = discounts;
    }

    const response = await fetch(`${SQUARE_API_URL}/v2/orders`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-02-15',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: squareOrder,
        idempotency_key: crypto.randomUUID()
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Square order creation failed:', result);
      return { 
        success: false, 
        error: result.errors?.[0]?.detail || 'Failed to create order in Square' 
      };
    }

    return {
      success: true,
      squareOrderId: result.order?.id
    };
  } catch (error) {
    console.error('Error creating Square order:', error);
    return { 
      success: false, 
      error: 'Network error creating order in Square' 
    };
  }
}

// Helper function to search for existing customer by email
export async function findSquareCustomerByEmail(email: string): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const response = await fetch(`${SQUARE_API_URL}/v2/customers/search`, {
      method: 'POST',
      headers: {
        'Square-Version': '2024-02-15',
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filter: {
          email_address: {
            exact: email
          }
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Square customer search failed:', result);
      return { 
        success: false, 
        error: result.errors?.[0]?.detail || 'Failed to search customers in Square' 
      };
    }

    // Check if customer was found
    if (result.customers && result.customers.length > 0) {
      return {
        success: true,
        customerId: result.customers[0].id
      };
    } else {
      return { success: false, error: 'Customer not found' };
    }
  } catch (error) {
    console.error('Error searching Square customer:', error);
    return { 
      success: false, 
      error: 'Network error searching customer in Square' 
    };
  }
}

// Helper function to get or create customer in Square
export async function getOrCreateSquareCustomer(customerData: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}): Promise<{ success: boolean; customerId?: string; error?: string }> {
  // First try to find existing customer by email
  const searchResult = await findSquareCustomerByEmail(customerData.email);
  
  if (searchResult.success && searchResult.customerId) {
    console.log('Found existing Square customer:', searchResult.customerId);
    return searchResult;
  }

  // If not found, create new customer
  console.log('Creating new Square customer for:', customerData.email);
  return await createSquareCustomer(customerData);
}
