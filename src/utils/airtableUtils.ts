
import Airtable from 'airtable';

// Airtable configuration - you'll need to set these environment variables
const AIRTABLE_API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID || '';
const AIRTABLE_TABLE_NAME = import.meta.env.VITE_AIRTABLE_TABLE_NAME || 'Orders';

// Check if Airtable is properly configured
const isAirtableConfigured = () => {
  return AIRTABLE_API_KEY && AIRTABLE_BASE_ID;
};

// Initialize Airtable only if properly configured
let base: any = null;
if (isAirtableConfigured()) {
  try {
    base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);
  } catch (error) {
    console.warn('⚠️ AIRTABLE WARNING - Failed to initialize Airtable:', error);
    base = null;
  }
} else {
  console.warn('⚠️ AIRTABLE WARNING - Airtable not configured. Missing API key or Base ID.');
}

interface OrderData {
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    fullName: string;
  };
  orderDetails: {
    package: string;
    packagePrice: string;
    packageFeatures: string;
    totalAmount: string;
    digitizingSpeed: string;
    digitizingTime: string;
    digitizingPrice: string;
    addOns: string[];
    // Detailed add-on breakdown
    addOnDetails?: {
      photoRestoration?: { selected: boolean; cost: number };
      videoEnhancement?: { selected: boolean; cost: number };
      digitalDelivery?: { selected: boolean; cost: number };
      expressShipping?: { selected: boolean; cost: number };
      storageUpgrade?: { selected: boolean; cost: number };
      backupCopies?: { selected: boolean; cost: number };
    };
    // Detailed digitizing speed breakdown
    speedDetails?: {
      standardSpeed?: { selected: boolean; cost: number; timeframe: string };
      expressSpeed?: { selected: boolean; cost: number; timeframe: string };
      rushSpeed?: { selected: boolean; cost: number; timeframe: string };
    };
  };
  paymentMethod: string;
  timestamp: string;
}

export const sendOrderToAirtable = async (orderData: OrderData) => {
  // Check if Airtable is configured before attempting to send
  if (!isAirtableConfigured()) {
    console.warn('⚠️ AIRTABLE WARNING - Airtable not configured. Order will not be sent to Airtable.');
    console.warn('⚠️ AIRTABLE WARNING - Please set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID environment variables.');
    return null;
  }

  if (!base) {
    console.warn('⚠️ AIRTABLE WARNING - Airtable base not initialized. Order will not be sent to Airtable.');
    return null;
  }

  try {
    console.log('📊 AIRTABLE - Sending order data to Airtable:', orderData);

    // Calculate add-on costs
    const addOnDetails = orderData.orderDetails.addOnDetails || {};
    const photoRestorationCost = addOnDetails.photoRestoration?.selected ? addOnDetails.photoRestoration.cost : 0;
    const videoEnhancementCost = addOnDetails.videoEnhancement?.selected ? addOnDetails.videoEnhancement.cost : 0;
    const digitalDeliveryCost = addOnDetails.digitalDelivery?.selected ? addOnDetails.digitalDelivery.cost : 0;
    const expressShippingCost = addOnDetails.expressShipping?.selected ? addOnDetails.expressShipping.cost : 0;
    const storageUpgradeCost = addOnDetails.storageUpgrade?.selected ? addOnDetails.storageUpgrade.cost : 0;
    const backupCopiesCost = addOnDetails.backupCopies?.selected ? addOnDetails.backupCopies.cost : 0;

    // Calculate speed costs
    const speedDetails = orderData.orderDetails.speedDetails || {};
    const standardSpeedCost = speedDetails.standardSpeed?.selected ? speedDetails.standardSpeed.cost : 0;
    const expressSpeedCost = speedDetails.expressSpeed?.selected ? speedDetails.expressSpeed.cost : 0;
    const rushSpeedCost = speedDetails.rushSpeed?.selected ? speedDetails.rushSpeed.cost : 0;

    // Prepare the record data for Airtable
    const recordFields = {
      // Customer Information
      'Customer Name': orderData.customerInfo.fullName,
      'First Name': orderData.customerInfo.firstName,
      'Last Name': orderData.customerInfo.lastName,
      'Email': orderData.customerInfo.email,
      'Phone': orderData.customerInfo.phone,
      'Address': orderData.customerInfo.address,
      'City': orderData.customerInfo.city,
      'State': orderData.customerInfo.state,
      'ZIP Code': orderData.customerInfo.zipCode,
      'Full Address': `${orderData.customerInfo.address}, ${orderData.customerInfo.city}, ${orderData.customerInfo.state} ${orderData.customerInfo.zipCode}`,
      
      // Order Details
      'Package': orderData.orderDetails.package,
      'Package Price': orderData.orderDetails.packagePrice,
      'Package Features': orderData.orderDetails.packageFeatures,
      'Total Amount': orderData.orderDetails.totalAmount,
      
      // Digitizing Information
      'Digitizing Speed': orderData.orderDetails.digitizingSpeed,
      'Digitizing Time': orderData.orderDetails.digitizingTime,
      'Digitizing Price': orderData.orderDetails.digitizingPrice,
      
      // Digitizing Speed Breakdown
      'Standard Speed Selected': speedDetails.standardSpeed?.selected || false,
      'Standard Speed Cost': standardSpeedCost,
      'Standard Speed Timeframe': speedDetails.standardSpeed?.timeframe || '',
      'Express Speed Selected': speedDetails.expressSpeed?.selected || false,
      'Express Speed Cost': expressSpeedCost,
      'Express Speed Timeframe': speedDetails.expressSpeed?.timeframe || '',
      'Rush Speed Selected': speedDetails.rushSpeed?.selected || false,
      'Rush Speed Cost': rushSpeedCost,
      'Rush Speed Timeframe': speedDetails.rushSpeed?.timeframe || '',
      
      // Add-ons Summary
      'Add Ons': orderData.orderDetails.addOns.length > 0 ? orderData.orderDetails.addOns.join(', ') : 'None',
      
      // Individual Add-on Breakdown
      'Photo Restoration Selected': addOnDetails.photoRestoration?.selected || false,
      'Photo Restoration Cost': photoRestorationCost,
      'Video Enhancement Selected': addOnDetails.videoEnhancement?.selected || false,
      'Video Enhancement Cost': videoEnhancementCost,
      'Digital Delivery Selected': addOnDetails.digitalDelivery?.selected || false,
      'Digital Delivery Cost': digitalDeliveryCost,
      'Express Shipping Selected': addOnDetails.expressShipping?.selected || false,
      'Express Shipping Cost': expressShippingCost,
      'Storage Upgrade Selected': addOnDetails.storageUpgrade?.selected || false,
      'Storage Upgrade Cost': storageUpgradeCost,
      'Backup Copies Selected': addOnDetails.backupCopies?.selected || false,
      'Backup Copies Cost': backupCopiesCost,
      
      // Calculated Totals
      'Total Add-on Cost': photoRestorationCost + videoEnhancementCost + digitalDeliveryCost + expressShippingCost + storageUpgradeCost + backupCopiesCost,
      'Total Speed Cost': standardSpeedCost + expressSpeedCost + rushSpeedCost,
      
      // Payment and Order Info
      'Payment Method': orderData.paymentMethod,
      'Order Date': new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      'Timestamp': orderData.timestamp,
      
      // Status
      'Order Status': 'New Order',
      'Processing Status': 'Pending'
    };

    // Create the record in Airtable
    const createdRecord = await base(AIRTABLE_TABLE_NAME).create([{ fields: recordFields }]);
    
    console.log('✅ AIRTABLE SUCCESS - Record created:', createdRecord[0].getId());
    return createdRecord;
    
  } catch (error) {
    console.error('❌ AIRTABLE ERROR - Failed to create record:', error);
    
    // Log more details about the error
    if (error.statusCode) {
      console.error('❌ AIRTABLE ERROR - Status Code:', error.statusCode);
      console.error('❌ AIRTABLE ERROR - Error Message:', error.message);
    }
    
    // Don't throw the error - we don't want to break the checkout process
    // Just log it for debugging
    console.error('❌ AIRTABLE ERROR - Order data that failed:', JSON.stringify(orderData, null, 2));
    
    // Could optionally send to a fallback system or email alert here
    return null;
  }
};

// Function to test Airtable connection
export const testAirtableConnection = async () => {
  if (!isAirtableConfigured()) {
    console.warn('⚠️ AIRTABLE TEST - Airtable not configured. Cannot test connection.');
    return false;
  }

  if (!base) {
    console.warn('⚠️ AIRTABLE TEST - Airtable base not initialized. Cannot test connection.');
    return false;
  }

  try {
    console.log('🧪 AIRTABLE TEST - Testing connection...');
    
    // Try to fetch the first record to test connection
    const records = await base(AIRTABLE_TABLE_NAME).select({
      maxRecords: 1
    }).firstPage();
    
    console.log('✅ AIRTABLE TEST - Connection successful');
    return true;
  } catch (error) {
    console.error('❌ AIRTABLE TEST - Connection failed:', error);
    return false;
  }
};

// Helper function to parse add-on details from checkout data
export const parseAddOnDetails = (addOns: string[], packageType: string) => {
  const addOnPrices = {
    'Photo Restoration': 15,
    'Video Enhancement': 25,
    'Digital Delivery': 10,
    'Express Shipping': 20,
    'Storage Upgrade': 35,
    'Backup Copies': 15
  };

  const addOnDetails = {
    photoRestoration: { selected: addOns.includes('Photo Restoration'), cost: addOns.includes('Photo Restoration') ? addOnPrices['Photo Restoration'] : 0 },
    videoEnhancement: { selected: addOns.includes('Video Enhancement'), cost: addOns.includes('Video Enhancement') ? addOnPrices['Video Enhancement'] : 0 },
    digitalDelivery: { selected: addOns.includes('Digital Delivery'), cost: addOns.includes('Digital Delivery') ? addOnPrices['Digital Delivery'] : 0 },
    expressShipping: { selected: addOns.includes('Express Shipping'), cost: addOns.includes('Express Shipping') ? addOnPrices['Express Shipping'] : 0 },
    storageUpgrade: { selected: addOns.includes('Storage Upgrade'), cost: addOns.includes('Storage Upgrade') ? addOnPrices['Storage Upgrade'] : 0 },
    backupCopies: { selected: addOns.includes('Backup Copies'), cost: addOns.includes('Backup Copies') ? addOnPrices['Backup Copies'] : 0 }
  };

  return addOnDetails;
};

// Helper function to parse speed details
export const parseSpeedDetails = (digitizingSpeed: string) => {
  const speedPrices = {
    'Standard (2-3 weeks)': { cost: 0, timeframe: '2-3 weeks' },
    'Express (1 week)': { cost: 50, timeframe: '1 week' },
    'Rush (3-5 days)': { cost: 100, timeframe: '3-5 days' }
  };

  const speedDetails = {
    standardSpeed: { 
      selected: digitizingSpeed.includes('Standard'), 
      cost: digitizingSpeed.includes('Standard') ? speedPrices['Standard (2-3 weeks)'].cost : 0,
      timeframe: digitizingSpeed.includes('Standard') ? speedPrices['Standard (2-3 weeks)'].timeframe : ''
    },
    expressSpeed: { 
      selected: digitizingSpeed.includes('Express'), 
      cost: digitizingSpeed.includes('Express') ? speedPrices['Express (1 week)'].cost : 0,
      timeframe: digitizingSpeed.includes('Express') ? speedPrices['Express (1 week)'].timeframe : ''
    },
    rushSpeed: { 
      selected: digitizingSpeed.includes('Rush'), 
      cost: digitizingSpeed.includes('Rush') ? speedPrices['Rush (3-5 days)'].cost : 0,
      timeframe: digitizingSpeed.includes('Rush') ? speedPrices['Rush (3-5 days)'].timeframe : ''
    }
  };

  return speedDetails;
};
