// Square Catalog Product Mapping
export const SQUARE_CATALOG_MAPPING = {
  // Main Packages
  packages: {
    starter: {
      itemId: 'CWZUFHRUS6WG223QCKMLGDMV',
      variationId: 'GNQP4YZH57MGVR265N4QA7QH',
      name: 'Starter Package',
      price: 69.00,
      description: 'Perfect for a small collection of memories. Digitize up to 3 tapes OR up to 75 photos with online access to digital files and free shipping both ways.',
      digitalFiles: '3 tapes OR 75 photos',
      processingTime: '4-6 weeks'
    },
    popular: {
      itemId: 'SRFFZ5C7PZ2FP2MMQC4SF5SO',
      variationId: 'MXDI5KGKHQE2G7MVWPGJWZIS',
      name: 'Popular Package',
      price: 179.00,
      description: 'Our most popular package for families. Digitize up to 10 tapes OR up to 250 photos with online access to digital files, free shipping both ways, and 1 year free online backup.',
      digitalFiles: '10 tapes OR 250 photos',
      processingTime: '4-6 weeks'
    },
    dustyRose: {
      itemId: 'SR4WG6NXKQRBPZZR5SAIQ42V',
      variationId: 'GKIADSF5IJQEAAKCIL2WXZEK',
      name: 'Dusty Rose Package',
      price: 349.00,
      description: 'Great for larger collections. Digitize up to 20 tapes OR up to 500 photos with online access to digital files, free shipping both ways, and 1 year free online backup.',
      digitalFiles: '20 tapes OR 500 photos',
      processingTime: '4-6 weeks'
    },
    eternal: {
      itemId: '6QQ3TRFXNERSKJO7RDJPJIRZ',
      variationId: 'X2N4DL3YZBKJYAICCVYMSJ6Y',
      name: 'Eternal Package',
      price: 599.00,
      description: 'For preserving a lifetime of memories. Digitize up to 40 tapes OR up to 1000 photos with online access to digital files, free shipping both ways, and 1 year free online backup.',
      digitalFiles: '40 tapes OR 1000 photos',
      processingTime: '4-6 weeks'
    }
  },

  // Add-on Services
  addons: {
    customUsb: {
      itemId: 'NCR5WYLYAJOCWVG4S3IMNZPF',
      variationId: 'SMW4WXZUAE6E5L3FTS76NC7Y',
      name: 'Custom USB Drive',
      price: 24.95,
      description: 'Physical backup for your memories on a custom USB drive.'
    },
    expeditedProcessing: {
      itemId: '56ZXSWLL3X3TMEQBYM6KJWXF',
      variationId: '37LXAW3CQ7ONF7AGNCYDWRRT',
      name: 'Expedited Processing',
      price: 29.99,
      description: 'Faster processing of your memories in 2-3 weeks instead of standard 4-6 weeks.',
      processingTime: '2-3 weeks'
    },
    rushProcessing: {
      itemId: '3P62CBU2OECIDL4PKTOWPFWM',
      variationId: 'HSMOF4CINCKHVWUPCEN5ZBOU',
      name: 'Rush Processing',
      price: 64.99,
      description: 'Priority handling for urgent projects with completion in 10 business days.',
      processingTime: '10 business days'
    }
  },

  // Subscriptions
  subscriptions: {
    onlineGallery: {
      itemId: 'KG44MEJ2E5GKEG3Y3HA6DAZ2',
      variationId: 'YJ3AGBF7MRHW2QQ6KI5DMSPG',
      name: 'Online Gallery & Backup',
      price: 0.00, // First year free
      description: 'Annual subscription for secure online gallery and cloud backup storage. First year included, renews at $49/year.'
    }
  }
};

// Coupon code to Square discount ID mapping
export const COUPON_CODE_MAPPING = {
  '99DOFF': '7RQTL7HC3MC6OPOJXO4QOWHY',  // $99 off
  '99SOFF': 'YNCJK4BPNMNUUJJT5S2SWYGP',  // $99 off shipping
  '15OFF': 'O4LYCD2U5MDIG5B6VMNUH6JB',   // 15% off
  'SAVE15': 'QL2BRYKDUXOOASYR2S6ORYTE'   // 15% off
};

// Helper function to get package details by key
export function getPackageDetails(packageKey: string) {
  return SQUARE_CATALOG_MAPPING.packages[packageKey];
}

// Helper function to get addon details by key
export function getAddonDetails(addonKey: string) {
  return SQUARE_CATALOG_MAPPING.addons[addonKey];
}

// Helper function to map frontend package names to Square catalog
export function mapPackageToSquare(packageName: string) {
  const packageMap = {
    'Starter Package': 'starter',
    'Popular Package': 'popular', 
    'Dusty Rose Package': 'dustyRose',
    'Eternal Package': 'eternal'
  };
  
  return packageMap[packageName] ? SQUARE_CATALOG_MAPPING.packages[packageMap[packageName]] : null;
}

// Helper function to create line items from order details
export function createSquareLineItems(orderDetails: any): any[] {
  const lineItems: any[] = [];

  // Add main package
  if (orderDetails.packageName) {
    const packageDetails = mapPackageToSquare(orderDetails.packageName);
    if (packageDetails) {
      lineItems.push({
        catalog_object_id: packageDetails.variationId,
        quantity: '1',
        note: `Digital files: ${packageDetails.digitalFiles}, Processing: ${packageDetails.processingTime}`
      });
    }
  }

  // Add selected addons
  if (orderDetails.addons) {
    orderDetails.addons.forEach((addon: any) => {
      let addonDetails = null;
      
      // Map addon names to catalog items
      switch (addon.name) {
        case 'Custom USB Drive':
          addonDetails = SQUARE_CATALOG_MAPPING.addons.customUsb;
          break;
        case 'Expedited Processing':
          addonDetails = SQUARE_CATALOG_MAPPING.addons.expeditedProcessing;
          break;
        case 'Rush Processing':
          addonDetails = SQUARE_CATALOG_MAPPING.addons.rushProcessing;
          break;
      }

      if (addonDetails) {
        lineItems.push({
          catalog_object_id: addonDetails.variationId,
          quantity: String(addon.quantity || 1),
          note: addonDetails.description
        });
      }
    });
  }

  // Add online gallery subscription if included
  if (orderDetails.includeOnlineGallery) {
    const galleryDetails = SQUARE_CATALOG_MAPPING.subscriptions.onlineGallery;
    lineItems.push({
      catalog_object_id: galleryDetails.variationId,
      quantity: '1',
      note: 'First year included - renews at $49/year'
    });
  }

  return lineItems;
}

// Helper function to calculate processing time based on addons
export function calculateProcessingTime(orderDetails: any): string {
  if (orderDetails.addons) {
    const hasRush = orderDetails.addons.some((addon: any) => addon.name === 'Rush Processing');
    const hasExpedited = orderDetails.addons.some((addon: any) => addon.name === 'Expedited Processing');
    
    if (hasRush) return '10 business days';
    if (hasExpedited) return '2-3 weeks';
  }
  
  return '4-6 weeks';
}

// Helper function to format customer data for Square
export function formatCustomerData(customerDetails: any) {
  return {
    given_name: customerDetails.firstName || '',
    family_name: customerDetails.lastName || '',
    email_address: customerDetails.email || '',
    phone_number: customerDetails.phone || '',
    address: customerDetails.address ? {
      address_line_1: customerDetails.address.street || '',
      address_line_2: customerDetails.address.street2 || '',
      locality: customerDetails.address.city || '',
      administrative_district_level_1: customerDetails.address.state || '',
      postal_code: customerDetails.address.zip || '',
      country: customerDetails.address.country || 'US'
    } : undefined
  };
}
