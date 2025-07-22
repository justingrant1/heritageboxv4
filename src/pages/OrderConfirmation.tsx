import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Check, Package } from 'lucide-react';
import { useEffect, useState } from 'react';
import { sendOrderConfirmationToBrevo } from '@/utils/brevoUtils';
import { getDigitizingOptionById } from '@/lib/utils';
import { toast } from 'sonner';

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

// Function to generate sequential order number as fallback
const generateOrderNumber = () => {
  const baseNumber = 13405;
  const storedCount = localStorage.getItem('hb_order_count');
  const currentCount = storedCount ? parseInt(storedCount) : 0;
  const newCount = currentCount + 1;
  localStorage.setItem('hb_order_count', newCount.toString());
  return `HB${(baseNumber + newCount - 1).toString().padStart(5, '0')}`;
};

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const packageType = searchParams.get('package') || 'Popular';
  const usbDrives = parseInt(searchParams.get('usbDrives') || '0', 10);
  const digitizingSpeed = searchParams.get('digitizingSpeed') || 'standard';
  const [emailSent, setEmailSent] = useState(false);
  const [conversionTracked, setConversionTracked] = useState(false);
  
  // Get customer info and order number from state if available (passed from checkout)
  const customerInfo = location.state?.customerInfo || {
    firstName: '',
    lastName: '',
    email: ''
  };
  
  const passedOrderNumber = location.state?.orderNumber;
  
  // Use the passed order number if available, otherwise generate a fallback
  const [orderNumber] = useState(() => {
    if (passedOrderNumber) {
      console.log('✅ ORDER CONFIRMATION - Using passed order number:', passedOrderNumber);
      return passedOrderNumber;
    } else {
      const fallbackOrder = generateOrderNumber();
      console.log('⚠️ ORDER CONFIRMATION - No order number passed, generating fallback:', fallbackOrder);
      return fallbackOrder;
    }
  });
  
  // Get button color class based on package type
  const getButtonClass = () => {
    switch(packageType) {
      case 'Starter':
        return 'bg-primary hover:bg-primary/90 text-white';
      case 'Dusty Rose':
        return 'bg-rose-500 hover:bg-rose-600 text-white';
      case 'Eternal':
        return 'bg-primary-light hover:bg-primary-light/90 text-white';
      case 'Popular':
      default:
        return 'bg-secondary hover:bg-secondary/90 text-primary';
    }
  };

  const getTextColorClass = () => {
    switch(packageType) {
      case 'Starter':
        return 'text-primary';
      case 'Dusty Rose':
        return 'text-rose-500';
      case 'Eternal':
        return 'text-primary-light';
      case 'Popular':
      default:
        return 'text-secondary';
    }
  };

  // Track Google Ads conversion
  useEffect(() => {
    if (conversionTracked) return;

    // Fire the conversion event
    if (window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-458259403/prjPCLyM9_QCEMv3wdoB',
        'value': 50.0,
        'currency': 'USD',
        'transaction_id': orderNumber
      });
      
      setConversionTracked(true);
      console.log('Google Ads conversion tracked for order:', orderNumber);
    }
  }, [orderNumber, conversionTracked]);

  // Send order data to Brevo
  useEffect(() => {
    if (emailSent) return;

    // Get digitizing option details
    const digitizingOption = getDigitizingOptionById(digitizingSpeed);
    
    const sendOrderData = async () => {
      try {
        if (!customerInfo.email) {
          console.log('No customer email available, skipping Brevo notification');
          return;
        }

        const orderData = {
          orderNumber,
          orderDate: new Date().toLocaleDateString(),
          packageType,
          usbDrives,
          digitizingSpeed: digitizingOption.name,
          speedTime: digitizingOption.time,
          speedPrice: digitizingOption.price
        };

        const customerName = `${customerInfo.firstName} ${customerInfo.lastName}`.trim();
        
        await sendOrderConfirmationToBrevo(
          customerInfo.email,
          customerName || 'Valued Customer',
          orderData
        );
        
        setEmailSent(true);
        console.log('Order confirmation sent to Brevo');
      } catch (error) {
        console.error('Failed to send order data to Brevo:', error);
        toast.error('Could not send order confirmation email');
      }
    };

    sendOrderData();
  }, [packageType, usbDrives, digitizingSpeed, emailSent, customerInfo, orderNumber]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${getTextColorClass()} bg-green-100 mb-6`}>
                <Check size={40} className="stroke-[2.5]" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Thank You for Your Order!
              </h1>
              <p className="text-lg text-gray-600">
                Your order has been received and is being processed.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold mb-6">Order Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div>
                  <p className="text-gray-500 mb-1">Order Number:</p>
                  <p className="font-semibold">{orderNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Order Date:</p>
                  <p className="font-semibold">{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Package Type:</p>
                  <p className={`font-semibold ${getTextColorClass()}`}>{packageType} Package</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Shipping:</p>
                  <p className="font-semibold">Free Shipping</p>
                </div>
                {usbDrives > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-gray-500 mb-1">Add-ons:</p>
                    <p className="font-semibold">{usbDrives} Additional USB Drive{usbDrives > 1 ? 's' : ''}</p>
                  </div>
                )}
                {digitizingSpeed !== 'standard' && (
                  <div className="md:col-span-2">
                    <p className="text-gray-500 mb-1">Digitizing Speed:</p>
                    <p className="font-semibold">
                      {getDigitizingOptionById(digitizingSpeed).name} ({getDigitizingOptionById(digitizingSpeed).time})
                    </p>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 my-6 pt-6">
                <h3 className="text-xl font-semibold mb-4">What Happens Next?</h3>
                <ul className="space-y-4 text-left">
                  <li className="flex items-start">
                    <span className={`${getTextColorClass()} mr-3 mt-0.5 shrink-0`}>
                      <Package size={18} />
                    </span>
                    <span>
                      <strong>Shipping Kit:</strong> We'll send you a secure, prepaid shipping kit within 3-5 business days.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className={`${getTextColorClass()} mr-3 mt-0.5 shrink-0`}>
                      <Package size={18} />
                    </span>
                    <span>
                      <strong>Package Your Memories:</strong> Once you receive the kit, carefully pack your memories and send them back using the prepaid label.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className={`${getTextColorClass()} mr-3 mt-0.5 shrink-0`}>
                      <Package size={18} />
                    </span>
                    <span>
                      <strong>Digitization Process:</strong> Our team will carefully digitize your memories (typically takes {getDigitizingOptionById(digitizingSpeed).time}).
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className={`${getTextColorClass()} mr-3 mt-0.5 shrink-0`}>
                      <Package size={18} />
                    </span>
                    <span>
                      <strong>Delivery:</strong> We'll send back your original items along with your digital copies{usbDrives > 0 ? ` and ${usbDrives} USB drive${usbDrives > 1 ? 's' : ''}` : ''}.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
            
            <p className="text-gray-600 mb-8">
              A confirmation email has been sent to your email address with all the details of your order.
              If you have any questions, please contact our customer support.
            </p>
            
            <Button asChild className={`${getButtonClass()} px-6 py-5 text-lg`}>
              <Link to="/">Return to Homepage</Link>
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
