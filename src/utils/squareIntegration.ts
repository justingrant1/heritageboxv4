// Square catalog item mappings
export const SQUARE_CATALOG_ITEMS = {
  // Main packages
  'starter': {
    id: 'CWZUFHRUS6WG223QCKMLGDMV',
    variation_id: 'GNQP4YZH57MGVR265N4QA7QH',
    name: 'Starter Package',
    price: 69.00
  },
  'popular': {
    id: 'SRFFZ5C7PZ2FP2MMQC4SF5SO', 
    variation_id: 'MXDI5KGKHQE2G7MVWPGJWZIS',
    name: 'Popular Package',
    price: 179.00
  },
  'dustyRose': {
    id: 'SR4WG6NXKQRBPZZR5SAIQ42V',
    variation_id: 'GKIADSF5IJQEAAKCIL2WXZEK',
    name: 'Dusty Rose Package', 
    price: 349.00
  },
  'eternal': {
    id: '6QQ3TRFXNERSKJO7RDJPJIRZ',
    variation_id: 'X2N4DL3YZBKJYAICCVYMSJ6Y',
    name: 'Eternal Package',
    price: 599.00
  },
  
  // Add-ons
  'usbDrive': {
    id: 'NCR5WYLYAJOCWVG4S3IMNZPF',
    variation_id: 'SMW4WXZUAE6E5L3FTS76NC7Y',
    name: 'Custom USB Drive',
    price: 24.95
  },
  'expeditedProcessing': {
    id: '56ZXSWLL3X3TMEQBYM6KJWXF',
    variation_id: '37LXAW3CQ7ONF7AGNCYDWRRT',
    name: 'Expedited Processing',
    price: 29.99
  },
  'rushProcessing': {
    id: '3P62CBU2OECIDL4PKTOWPFWM',
    variation_id: 'HSMOF4CINCKHVWUPCEN5ZBOU',
    name: 'Rush Processing',
    price: 64.99
  },
  'onlineGallery': {
    id: 'KG44MEJ2E5GKEG3Y3HA6DAZ2',
    variation_id: 'YJ3AGBF7MRHW2QQ6KI5DMSPG',
    name: 'Online Gallery & Backup',
    price: 0.00 // Free first year
  }
};

export interface OrderDetails {
  packageType: keyof typeof SQUARE_CATALOG_ITEMS;
  addOns: (keyof typeof SQUARE_CATALOG_ITEMS)[];
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
  discountCode?: string;
  discountAmount?: number;
  totalAmount: number;
}

export function buildSquareLineItems(orderDetails: OrderDetails) {
  const lineItems = [];
  
  // Add main package
  const mainPackage = SQUARE_CATALOG_ITEMS[orderDetails.packageType];
  if (mainPackage) {
    lineItems.push({
      quantity: '1',
      catalog_object_id: mainPackage.variation_id, // Use variation ID for catalog items
      base_price_money: {
        amount: Math.round(mainPackage.price * 100), // Convert to cents
        currency: 'USD'
      }
    });
  }
  
  // Add selected add-ons
  orderDetails.addOns.forEach(addOnKey => {
    const addOn = SQUARE_CATALOG_ITEMS[addOnKey];
    if (addOn) {
      lineItems.push({
        quantity: '1',
        catalog_object_id: addOn.variation_id, // Use variation ID for catalog items
        base_price_money: {
          amount: Math.round(addOn.price * 100),
          currency: 'USD'
        }
      });
    }
  });
  
  return lineItems;
}

export function buildSquareCustomerData(customerInfo: OrderDetails['customerInfo']) {
  return {
    given_name: customerInfo.firstName,
    family_name: customerInfo.lastName,
    email_address: customerInfo.email,
    phone_number: customerInfo.phone,
    address: customerInfo.address
  };
}

// Map frontend package names to Square catalog keys
export function mapPackageToSquareCatalog(packageName: string): keyof typeof SQUARE_CATALOG_ITEMS {
  const packageMap: Record<string, keyof typeof SQUARE_CATALOG_ITEMS> = {
    'starter': 'starter',
    'popular': 'popular', 
    'dusty-rose': 'dustyRose',
    'eternal': 'eternal'
  };
  
  return packageMap[packageName] || 'starter';
}

export function mapAddOnsToSquareCatalog(addOns: string[]): (keyof typeof SQUARE_CATALOG_ITEMS)[] {
  const addOnMap: Record<string, keyof typeof SQUARE_CATALOG_ITEMS> = {
    'usb-drive': 'usbDrive',
    'expedited-processing': 'expeditedProcessing',
    'rush-processing': 'rushProcessing',
    'online-gallery': 'onlineGallery'
  };
  
  return addOns.map(addOn => addOnMap[addOn]).filter(Boolean);
}
