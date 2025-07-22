import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { 
  Check, ShoppingBag, CreditCard, Truck, Lock, 
  Plus, Minus, Cloud, Usb, Calendar, 
  AlertCircle, ArrowRight, CreditCard as PaymentIcon,
  Loader2, Tag, Star, Shield, Award
} from 'lucide-react';
import SquarePayment from '@/components/SquarePayment';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { sendEmailToHeritageBox, generateOrderId } from '@/utils/emailUtils';
import { sendOrderToAirtable, parseAddOnDetails, parseSpeedDetails } from '@/utils/airtableUtils';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Form validation schema
const shippingFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number").regex(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"),
  address: z.string().min(5, "Please enter your complete address"),
  city: z.string().min(2, "Please enter a valid city"),
  state: z.string().min(2, "Please enter a valid state"),
  zipCode: z.string().min(5, "Please enter a valid ZIP code").max(10)
});

// Define the form state type explicitly to avoid TypeScript errors
type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
};

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const packageType = searchParams.get('package') || 'Popular';
  const navigate = useNavigate();
  
  // Form validation using react-hook-form
  const form = useForm<z.infer<typeof shippingFormSchema>>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [usbDrives, setUsbDrives] = useState(1);
  const [cloudBackup, setCloudBackup] = useState(1);
  const [digitizingSpeed, setDigitizingSpeed] = useState('standard'); // 'standard', 'expedited', or 'rush'
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Remove the separate formState and use form values directly
  const [validatedFormData, setValidatedFormData] = useState<FormState | null>(null);

  // Define digitizing time options
  const digitizingOptions = [
    {
      id: 'standard',
      name: 'Standard',
      price: 0,
      time: '4-6 weeks',
      description: 'Our standard digitizing service'
    },
    {
      id: 'expedited',
      name: 'Expedited',
      price: 29.99,
      time: '2-3 weeks',
      description: 'Faster processing of your memories'
    },
    {
      id: 'rush',
      name: 'Rush',
      price: 64.99,
      time: '10 business days',
      description: 'Priority handling for urgent projects'
    }
  ];

  // Define all packages (updated with new prices and description)
  const allPackages = [
    {
      name: "Starter",
      price: "$69",
      numericPrice: 69,
      description: "Perfect for a small collection of memories",
      color: "primary",
      features: [
        "Digitize up to 3 tapes OR up to 75 photos",
        "Online access to digital files",
        "Free shipping both ways"
      ]
    },
    {
      name: "Popular",
      price: "$179",
      numericPrice: 179,
      description: "Our most popular package for families",
      color: "secondary",
      popular: true,
      features: [
        "Digitize up to 10 tapes OR up to 250 photos",
        "Online access to digital files",
        "Free shipping both ways",
        "Online Backup (1 Year Free)"
      ]
    },
    {
      name: "Dusty Rose",
      price: "$349",
      numericPrice: 349,
      description: "Great for larger collections",
      color: "rose-dark",
      features: [
        "Digitize up to 20 tapes OR up to 500 photos",
        "Online access to digital files",
        "Free shipping both ways",
        "Online Backup (1 Year Free)"
      ]
    },
    {
      name: "Eternal",
      price: "$599",
      numericPrice: 599,
      description: "For preserving a lifetime of memories",
      color: "primary-light",
      features: [
        "Digitize up to 40 tapes OR up to 1000 photos",
        "Online access to digital files",
        "Free shipping both ways",
        "Online Backup (1 Year Free)"
      ]
    }
  ];
  
  // Get selected package details
  const getPackageDetails = () => {
    return allPackages.find(pkg => pkg.name === packageType) || allPackages[1];
  };

  const packageDetails = getPackageDetails();

  // USB drive price
  const USB_DRIVE_PRICE = 24.95;
  const CLOUD_BACKUP_PRICE = 0; // Updated price to zero

  // Function to generate sequential order number (same as OrderConfirmation)
  const generateOrderNumber = () => {
    const baseNumber = 13405;
    const storedCount = localStorage.getItem('hb_order_count');
    const currentCount = storedCount ? parseInt(storedCount) : 0;
    const newCount = currentCount + 1;
    localStorage.setItem('hb_order_count', newCount.toString());
    return `HB${(baseNumber + newCount - 1).toString().padStart(5, '0')}`;
  };

  // Get selected digitizing option
  const getSelectedDigitizingOption = () => {
    return digitizingOptions.find(option => option.id === digitizingSpeed) || digitizingOptions[0];
  };

  // Calculate subtotal before discount
  const calculateSubtotal = () => {
    const packagePrice = packageDetails.numericPrice || parseFloat(packageDetails.price.replace('$', ''));
    const usbTotal = usbDrives * USB_DRIVE_PRICE;
    const cloudTotal = cloudBackup * CLOUD_BACKUP_PRICE;
    const digitizingOption = getSelectedDigitizingOption();
    const speedPrice = digitizingOption ? digitizingOption.price : 0;
    
    return packagePrice + usbTotal + cloudTotal + speedPrice;
  };

  // Calculate total price with coupon discount
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = subtotal * (couponDiscount / 100);
    return (subtotal - discount).toFixed(2);
  };

  // Handle coupon code application
  const applyCouponCode = () => {
    const trimmedCode = couponCode.trim().toUpperCase();
    
    console.log('Applying coupon code:', trimmedCode); // Debug log
    
    if (trimmedCode === 'SAVE15' || trimmedCode === '15OFF') {
      setAppliedCoupon(trimmedCode);
      setCouponDiscount(15);
      toast.success("Coupon applied!", {
        description: "You saved 15% on your order!",
        position: "top-center",
      });
    } else if (trimmedCode === '99DOFF') {
      setAppliedCoupon(trimmedCode);
      setCouponDiscount(99);
      toast.success("Coupon applied!", {
        description: "You saved 99% on your order!",
        position: "top-center",
      });
      console.log('99DOFF coupon applied successfully'); // Debug log
    } else if (trimmedCode === '') {
      toast.error("Please enter a coupon code", {
        position: "top-center",
      });
    } else {
      console.log('Invalid coupon code entered:', trimmedCode); // Debug log
      toast.error("Invalid coupon code", {
        description: "Please check your coupon code and try again.",
        position: "top-center",
      });
    }
  };
  
  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon('');
    setCouponDiscount(0);
    setCouponCode('');
    toast.success("Coupon removed", {
      position: "top-center",
    });
  };
  
  const handleUsbChange = (change: number) => {
    setUsbDrives(prev => {
      const newValue = prev + change;
      return newValue >= 0 ? newValue : 0;
    });
  };

  // Updated to toggle cloud backup between 0 and 1 only
  const handleCloudChange = (change: number) => {
    setCloudBackup(prev => {
      // If current is 0 and change is positive, set to 1
      if (prev === 0 && change > 0) return 1;
      // If current is 1 and change is negative, set to 0
      if (prev === 1 && change < 0) return 0;
      // Otherwise keep the same value
      return prev;
    });
  };
  
  const handleDigitizingSpeedChange = (value: string) => {
    console.log('Digitizing speed changing from', digitizingSpeed, 'to', value);
    setDigitizingSpeed(value);
  };
  
  const handleSubmit = async (values: z.infer<typeof shippingFormSchema>) => {
    console.log('🚀 Form submission started');
    console.log('📝 Form values:', values);
    
    setIsSubmitting(true);
    
    try {
      // Validate all required fields are present
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
      const missingFields = requiredFields.filter(field => !values[field as keyof typeof values] || values[field as keyof typeof values].trim() === '');
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        toast.error("Please fill in all required fields", {
          description: `Missing: ${missingFields.join(', ')}`,
          position: "top-center",
        });
        setIsSubmitting(false);
        return;
      }

      console.log('✅ All required fields validated');
      
      // Store the validated form data
      const completeFormState: FormState = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
      };
      
      console.log('💾 Setting validated form data:', completeFormState);
      setValidatedFormData(completeFormState);
      
      console.log('🎯 Showing payment form');
      setShowCardForm(true);
      
      toast.success("Information validated!", {
        description: "Proceeding to payment...",
        position: "top-center",
      });
      
      // Smooth scroll to payment section after a short delay
      setTimeout(() => {
        const paymentSection = document.getElementById('payment-section');
        if (paymentSection) {
          console.log('📍 Scrolling to payment section');
          paymentSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.warn('⚠️ Payment section not found for scrolling');
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error in form submission:', error);
      toast.error("Form submission error", {
        description: "Please try again or check your information",
        position: "top-center",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to send order details to Formspree
  const sendOrderDetailsToFormspree = async (orderInfo: any, paymentInfo?: string) => {
    try {
      console.log('🎯 CHECKOUT DEBUG - sendOrderDetailsToFormspree called');
      console.log('🎯 CHECKOUT DEBUG - orderInfo param:', orderInfo);
      console.log('🎯 CHECKOUT DEBUG - paymentInfo param:', paymentInfo);
      
      // Use customer info from orderInfo parameter
      const customerInfo = orderInfo.customerInfo;
      
      // Ensure we have all required customer info
      if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
        console.error('❌ CHECKOUT ERROR - Missing required customer information:', customerInfo);
        throw new Error('Missing required customer information');
      }
      
      const selectedDigitizingOption = getSelectedDigitizingOption();
      console.log('🎯 CHECKOUT DEBUG - Selected digitizing option:', selectedDigitizingOption);
      
      // Use the order ID that was already generated and passed in orderInfo
      const orderId = orderInfo.orderId;
      console.log('🎯 CHECKOUT DEBUG - Using existing Order ID:', orderId);
      
      // Use the discount amount that was already calculated and passed in orderInfo
      const subtotal = parseFloat(orderInfo.orderDetails.subtotal.replace('$', ''));
      const discountAmount = parseFloat(orderInfo.orderDetails.discountAmount.replace('$', ''));
      
      console.log('🎯 CHECKOUT DEBUG - Subtotal from orderInfo:', subtotal);
      console.log('🎯 CHECKOUT DEBUG - Discount amount from orderInfo:', discountAmount);
      
      const orderDetails = {
        orderId: orderId,
        customerInfo: {
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          zipCode: customerInfo.zipCode,
          fullName: customerInfo.fullName
        },
        orderDetails: {
          package: orderInfo.orderDetails.package,
          packagePrice: orderInfo.orderDetails.packagePrice,
          packageFeatures: orderInfo.orderDetails.packageFeatures,
          subtotal: orderInfo.orderDetails.subtotal,
          couponCode: orderInfo.orderDetails.couponCode,
          discountPercent: orderInfo.orderDetails.discountPercent,
          discountAmount: orderInfo.orderDetails.discountAmount,
          totalAmount: orderInfo.orderDetails.totalAmount,
          digitizingSpeed: orderInfo.orderDetails.digitizingSpeed,
          digitizingTime: orderInfo.orderDetails.digitizingTime,
          digitizingPrice: orderInfo.orderDetails.digitizingPrice,
          addOns: orderInfo.orderDetails.addOns
        },
        paymentMethod: paymentInfo || "Credit Card",
        timestamp: new Date().toISOString()
      };
      
      console.log("🎯 CHECKOUT DEBUG - Final order details object with Order ID:", JSON.stringify(orderDetails, null, 2));
      
      // Send the email with order details
      console.log("🎯 CHECKOUT DEBUG - About to call sendEmailToHeritageBox...");
      const emailResult = await sendEmailToHeritageBox(orderDetails, "Order Completed");
      
      if (emailResult) {
        console.log("✅ CHECKOUT SUCCESS - Order details sent successfully to Formspree with Order ID:", orderId);
      } else {
        console.error("❌ CHECKOUT ERROR - Failed to send email to Formspree but continuing with checkout");
      }
      
      return orderId; // Return the order ID for potential use elsewhere
      
    } catch (error) {
      console.error("❌ CHECKOUT ERROR - Failed to send order details to Formspree:", error);
      console.error("❌ CHECKOUT ERROR - Full error details:", {
        message: error.message,
        stack: error.stack,
        orderInfo,
        paymentInfo
      });
      // We don't want to show an error to the user here as the payment was successful
      // Just log the error for debugging purposes
      return null;
    }
  };

  const handlePaymentSuccess = async (token: string, details: any) => {
    setIsProcessing(true);
    
    try {
      console.log('💳 PAYMENT SUCCESS - Starting payment processing');
      console.log('💳 PAYMENT SUCCESS - Current validated form data:', validatedFormData);
      
      // Ensure we have validated form data
      if (!validatedFormData) {
        throw new Error('Missing customer information - form data not validated');
      }
      
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          amount: parseFloat(calculateTotal()),
          orderDetails: {
            package: packageType,
            usbDrives,
            cloudBackup,
            digitizingSpeed,
            customerInfo: validatedFormData
          }
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      console.log('💳 PAYMENT SUCCESS - Payment processed, now sending email and saving to Airtable');

      // Prepare order data for both email and Airtable
      const selectedDigitizingOption = getSelectedDigitizingOption();
      
      // Generate unique order ID ONCE using the same format as OrderConfirmation
      const orderId = generateOrderNumber();
      console.log('💳 PAYMENT SUCCESS - Generated single Order ID:', orderId);
      
      // Create add-ons array for legacy support
      const addOnsArray = [];
      if (usbDrives > 0) {
        addOnsArray.push(`${usbDrives} USB Drive(s) - $${(usbDrives * USB_DRIVE_PRICE).toFixed(2)}`);
      }
      if (cloudBackup > 0) {
        addOnsArray.push(`${cloudBackup} Year Cloud Backup - $0.00 (Included)`);
      }

      // Create detailed breakdown for Airtable
      const addOnDetails = {
        photoRestoration: { selected: false, cost: 0 },
        videoEnhancement: { selected: false, cost: 0 },
        digitalDelivery: { selected: false, cost: 0 },
        expressShipping: { selected: false, cost: 0 },
        storageUpgrade: { selected: usbDrives > 0, cost: usbDrives * USB_DRIVE_PRICE },
        backupCopies: { selected: cloudBackup > 0, cost: 0 } // Cloud backup is included
      };

      const speedDetails = parseSpeedDetails(`${selectedDigitizingOption.name} (${selectedDigitizingOption.time})`);

      const orderData = {
        orderId: orderId,
        customerInfo: {
          firstName: validatedFormData.firstName,
          lastName: validatedFormData.lastName,
          email: validatedFormData.email,
          phone: validatedFormData.phone,
          address: validatedFormData.address,
          city: validatedFormData.city,
          state: validatedFormData.state,
          zipCode: validatedFormData.zipCode,
          fullName: `${validatedFormData.firstName} ${validatedFormData.lastName}`
        },
        orderDetails: {
          package: packageType,
          packagePrice: `$${packageDetails.numericPrice.toFixed(2)}`,
          packageFeatures: packageDetails.features.join(", "),
          subtotal: `$${calculateSubtotal().toFixed(2)}`,
          couponCode: appliedCoupon || 'None',
          discountPercent: couponDiscount,
          discountAmount: `$${(calculateSubtotal() * (couponDiscount / 100)).toFixed(2)}`,
          totalAmount: `$${calculateTotal()}`,
          digitizingSpeed: selectedDigitizingOption.name,
          digitizingTime: selectedDigitizingOption.time,
          digitizingPrice: selectedDigitizingOption.price === 0 ? "Free" : `$${selectedDigitizingOption.price.toFixed(2)}`,
          addOns: addOnsArray,
          addOnDetails: addOnDetails,
          speedDetails: speedDetails
        },
        paymentMethod: `Credit Card (${details?.card?.brand} ending in ${details?.card?.last4})`,
        timestamp: new Date().toISOString()
      };

      console.log('💳 PAYMENT SUCCESS - Order data prepared for email:', orderData);

      // Send order details to Formspree
      await sendOrderDetailsToFormspree(orderData, "Order Completed");

      // Send order details to Airtable
      try {
        await sendOrderToAirtable(orderData);
        console.log('✅ AIRTABLE SUCCESS - Order saved to Airtable');
      } catch (airtableError) {
        console.error('❌ AIRTABLE ERROR - Failed to save to Airtable:', airtableError);
        // Don't fail the checkout process if Airtable fails
      }

      toast.success("Payment successful!", {
        description: "Thank you for your order. You will receive a confirmation email shortly.",
        position: "top-center",
      });
      
      // Pass parameters to order confirmation page including the order ID
      const params = new URLSearchParams();
      params.append('package', packageType);
      if (usbDrives > 0) {
        params.append('usbDrives', usbDrives.toString());
      }
      if (cloudBackup > 0) {
        params.append('cloudBackup', cloudBackup.toString());
      }
      params.append('digitizingSpeed', digitizingSpeed);
      
      // Navigate with both URL params and state containing the order ID and customer info
      navigate('/order-confirmation?' + params.toString(), {
        state: {
          orderNumber: orderId,
          customerInfo: {
            firstName: validatedFormData.firstName,
            lastName: validatedFormData.lastName,
            email: validatedFormData.email
          }
        }
      });
    } catch (error) {
      console.error('💳 PAYMENT ERROR:', error);
      toast.error("Payment failed", {
        description: error.message || "Please try again or use a different payment method",
        position: "top-center",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalPayment = () => {
    setIsProcessing(true);
    
    console.log('💰 PAYPAL - Starting PayPal payment processing');
    console.log('💰 PAYPAL - Current validated form data:', validatedFormData);
    
    // Ensure we have validated form data
    if (!validatedFormData) {
      setIsProcessing(false);
      toast.error("Missing customer information", {
        description: "Please fill out the shipping form first.",
        position: "top-center",
      });
      return;
    }
    
    // For demo purposes, we'll simulate a successful PayPal payment after a short delay
    console.log("Processing PayPal payment for:", validatedFormData.email);
    console.log("Amount:", calculateTotal());
    console.log("USB drives added:", usbDrives);
    console.log("Cloud backup years:", cloudBackup);
    console.log("Digitizing speed:", digitizingSpeed);
    
    setTimeout(async () => {
      console.log('💰 PAYPAL - Payment processed, now sending email and saving to Airtable');
      
      // Prepare order data for both email and Airtable
      const selectedDigitizingOption = getSelectedDigitizingOption();
      
      // Generate unique order ID ONCE using the same format as OrderConfirmation
      const orderId = generateOrderNumber();
      console.log('💰 PAYPAL - Generated single Order ID:', orderId);
      
      // Create add-ons array for legacy support
      const addOnsArray = [];
      if (usbDrives > 0) {
        addOnsArray.push(`${usbDrives} USB Drive(s) - $${(usbDrives * USB_DRIVE_PRICE).toFixed(2)}`);
      }
      if (cloudBackup > 0) {
        addOnsArray.push(`${cloudBackup} Year Cloud Backup - $0.00 (Included)`);
      }

      // Create detailed breakdown for Airtable
      const addOnDetails = {
        photoRestoration: { selected: false, cost: 0 },
        videoEnhancement: { selected: false, cost: 0 },
        digitalDelivery: { selected: false, cost: 0 },
        expressShipping: { selected: false, cost: 0 },
        storageUpgrade: { selected: usbDrives > 0, cost: usbDrives * USB_DRIVE_PRICE },
        backupCopies: { selected: cloudBackup > 0, cost: 0 } // Cloud backup is included
      };

      const speedDetails = parseSpeedDetails(`${selectedDigitizingOption.name} (${selectedDigitizingOption.time})`);

      const orderData = {
        orderId: orderId,
        customerInfo: {
          firstName: validatedFormData.firstName,
          lastName: validatedFormData.lastName,
          email: validatedFormData.email,
          phone: validatedFormData.phone,
          address: validatedFormData.address,
          city: validatedFormData.city,
          state: validatedFormData.state,
          zipCode: validatedFormData.zipCode,
          fullName: `${validatedFormData.firstName} ${validatedFormData.lastName}`
        },
        orderDetails: {
          package: packageType,
          packagePrice: `$${packageDetails.numericPrice.toFixed(2)}`,
          packageFeatures: packageDetails.features.join(", "),
          subtotal: `$${calculateSubtotal().toFixed(2)}`,
          couponCode: appliedCoupon || 'None',
          discountPercent: couponDiscount,
          discountAmount: `$${(calculateSubtotal() * (couponDiscount / 100)).toFixed(2)}`,
          totalAmount: `$${calculateTotal()}`,
          digitizingSpeed: selectedDigitizingOption.name,
          digitizingTime: selectedDigitizingOption.time,
          digitizingPrice: selectedDigitizingOption.price === 0 ? "Free" : `$${selectedDigitizingOption.price.toFixed(2)}`,
          addOns: addOnsArray,
          addOnDetails: addOnDetails,
          speedDetails: speedDetails
        },
        paymentMethod: "PayPal",
        timestamp: new Date().toISOString()
      };

      console.log('💰 PAYPAL - Order data prepared for email:', orderData);

      // Send order details to Formspree
      await sendOrderDetailsToFormspree(orderData, "Order Completed");

      // Send order details to Airtable
      try {
        await sendOrderToAirtable(orderData);
        console.log('✅ AIRTABLE SUCCESS - PayPal order saved to Airtable');
      } catch (airtableError) {
        console.error('❌ AIRTABLE ERROR - Failed to save PayPal order to Airtable:', airtableError);
        // Don't fail the checkout process if Airtable fails
      }
      
      setIsProcessing(false);
      toast.success("PayPal payment successful!", {
        description: "Thank you for your order. You will receive a confirmation email shortly.",
        position: "top-center",
      });
      
      // Pass parameters to order confirmation page including the order ID
      const params = new URLSearchParams();
      params.append('package', packageType);
      if (usbDrives > 0) {
        params.append('usbDrives', usbDrives.toString());
      }
      if (cloudBackup > 0) {
        params.append('cloudBackup', cloudBackup.toString());
      }
      params.append('digitizingSpeed', digitizingSpeed);
      
      // Navigate with both URL params and state containing the order ID and customer info
      navigate('/order-confirmation?' + params.toString(), {
        state: {
          orderNumber: orderId,
          customerInfo: {
            firstName: validatedFormData.firstName,
            lastName: validatedFormData.lastName,
            email: validatedFormData.email
          }
        }
      });
    }, 2000);
  };

  // Get text color class based on package type
  const getTextColorClass = () => {
    switch(packageDetails.color) {
      case 'primary':
        return 'text-primary';
      case 'rose-dark':
        return 'text-rose-500';
      case 'primary-light':
        return 'text-primary-light';
      case 'secondary':
        return 'text-secondary';
      default:
        return 'text-gray-900';
    }
  };

  // Get button color class based on package type
  const getButtonClass = () => {
    switch(packageDetails.color) {
      case 'primary':
        return 'bg-primary hover:bg-primary/90 text-white';
      case 'rose-dark':
        return 'bg-rose-500 hover:bg-rose-600 text-white';
      case 'primary-light':
        return 'bg-primary-light hover:bg-primary-light/90 text-white';
      case 'secondary':
        return 'bg-secondary hover:bg-secondary/90 text-primary';
      default:
        return 'bg-primary hover:bg-primary/90 text-white';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <NavBar />
      
      <main className="flex-grow pt-20 md:pt-24">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Enhanced Header Section */}
            <div className="text-center mb-8 md:mb-12">
              <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
                <Shield className="w-4 h-4" />
                Secure Checkout
              </div>
              <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Complete Your Order
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                You're just moments away from preserving your most cherished memories forever.
              </p>
            </div>
            
            {/* Enhanced Progress Indicator */}
            <div className="hidden md:flex justify-center mb-12">
              <div className="flex items-center w-full max-w-4xl bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-primary-light text-white flex items-center justify-center rounded-full shadow-lg">
                    <ShoppingBag size={20} />
                  </div>
                  <span className="text-sm mt-2 text-primary font-semibold">Package Selected</span>
                </div>
                <div className={`flex-1 h-1 mx-4 rounded-full ${showCardForm ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-gradient-to-r from-primary to-primary-light'}`}></div>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 text-white flex items-center justify-center rounded-full shadow-lg ${showCardForm ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-gradient-to-r from-primary to-primary-light'}`}>
                    <Truck size={20} />
                  </div>
                  <span className={`text-sm mt-2 font-semibold ${showCardForm ? 'text-primary' : 'text-primary'}`}>Shipping Info</span>
                </div>
                <div className={`flex-1 h-1 mx-4 rounded-full ${showCardForm ? 'bg-gradient-to-r from-primary to-primary-light' : 'bg-gray-200'}`}></div>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full ${showCardForm ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg' : 'bg-gray-200 text-gray-500'}`}>
                    <CreditCard size={20} />
                  </div>
                  <span className={`text-sm mt-2 font-medium ${showCardForm ? 'text-primary font-semibold' : 'text-gray-500'}`}>Payment</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Enhanced Checkout Form */}
              <div className="w-full lg:w-2/3 order-2 lg:order-1">
                {!showCardForm ? (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                      {/* Enhanced Shipping Information Section */}
                      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center rounded-xl">
                            <Truck size={20} />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
                            <p className="text-sm text-gray-500">Where should we send your memories?</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700">First Name *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                    placeholder="Enter your first name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700">Last Name *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                    placeholder="Enter your last name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-sm font-semibold text-gray-700">Email Address *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="email" 
                                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                    placeholder="your.email@example.com"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-sm font-semibold text-gray-700">Phone Number *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="tel" 
                                    placeholder="(555) 123-4567" 
                                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel className="text-sm font-semibold text-gray-700">Street Address *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                    placeholder="123 Main Street"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700">City *</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                    placeholder="Your City"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold text-gray-700">State *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                      placeholder="CA"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="zipCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold text-gray-700">ZIP Code *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                                      placeholder="12345"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Digitizing Time Selection */}
                      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 text-white flex items-center justify-center rounded-xl">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Digitizing Speed</h2>
                            <p className="text-sm text-gray-500">How quickly do you need your memories?</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {digitizingOptions.map((option) => (
                            <label 
                              key={option.id}
                              className={`relative flex items-center justify-between border-2 rounded-2xl p-4 md:p-6 transition-all cursor-pointer group hover:shadow-md ${
                                digitizingSpeed === option.id 
                                  ? 'border-primary bg-primary/5 shadow-md' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {option.id === 'expedited' && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                  Popular
                                </div>
                              )}
                              {option.id === 'rush' && (
                                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                  <Star size={12} />
                                  Premium
                                </div>
                              )}
                              <div className="flex items-center gap-4">
                                <input
                                  type="radio"
                                  name="digitizing-speed"
                                  value={option.id}
                                  checked={digitizingSpeed === option.id}
                                  onChange={(e) => handleDigitizingSpeedChange(e.target.value)}
                                  className="h-5 w-5 text-primary border-2 border-gray-300 focus:ring-primary"
                                />
                                <div>
                                  <div className="font-bold text-lg text-gray-900 flex flex-wrap items-center gap-2">
                                    <span>{option.name}</span>
                                    <span className="text-base text-gray-600 font-normal">({option.time})</span>
                                    {option.id === 'standard' && 
                                      <span className="bg-green-100 text-green-700 font-semibold text-sm px-2 py-1 rounded-full">Free</span>
                                    }
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {option.description}
                                  </p>
                                </div>
                              </div>
                              {option.id !== 'standard' && (
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-gray-900">
                                    ${option.price.toFixed(2)}
                                  </div>
                                  <div className="text-sm text-gray-500">one-time</div>
                                </div>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Enhanced Coupon Code Section */}
                      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center rounded-xl">
                            <Tag size={20} />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Promo Code</h2>
                            <p className="text-sm text-gray-500">Have a discount code? Apply it here</p>
                          </div>
                        </div>
                        
                        {!appliedCoupon ? (
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                              <Input
                                type="text"
                                placeholder="Enter promo code (e.g., SAVE15)"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                className="h-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:ring-0 transition-colors"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={applyCouponCode}
                              className="h-12 px-8 border-2 border-primary text-primary hover:bg-primary hover:text-white rounded-xl font-semibold transition-all"
                            >
                              Apply Code
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-500 text-white flex items-center justify-center rounded-full">
                                <Check size={16} />
                              </div>
                              <div>
                                <span className="font-bold text-green-800">{appliedCoupon}</span>
                                <span className="text-green-700 ml-2">({couponDiscount}% discount applied)</span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeCoupon}
                              className="text-green-700 hover:text-green-800 hover:bg-green-100"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <Button 
                          type="button"
                          variant="outline"
                          onClick={() => navigate(-1)}
                          className="h-12 px-8 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold"
                          disabled={isSubmitting}
                        >
                          ← Back to Package
                        </Button>
                        
                        <Button 
                          type="submit" 
                          className={`h-12 px-8 ${getButtonClass()} gap-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all`}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Continue to Payment
                              <ArrowRight className="h-5 w-5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                ) : (
                  <div id="payment-section" className="space-y-8">
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                      <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-center rounded-xl">
                            <Truck size={20} />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-gray-900">Shipping Information</h2>
                            <p className="text-sm text-gray-500">Delivery details confirmed</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          onClick={() => setShowCardForm(false)}
                          className="text-primary hover:text-primary/80 hover:bg-primary/10 rounded-xl"
                        >
                          Edit
                        </Button>
                      </div>
                      
                      {validatedFormData && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-medium text-gray-500">Full Name</div>
                              <div className="font-semibold text-gray-900">{validatedFormData.firstName} {validatedFormData.lastName}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Email Address</div>
                              <div className="font-semibold text-gray-900">{validatedFormData.email}</div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-500">Phone Number</div>
                              <div className="font-semibold text-gray-900">{validatedFormData.phone}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Shipping Address</div>
                            <div className="font-semibold text-gray-900">{validatedFormData.address}</div>
                            <div className="text-gray-700">{validatedFormData.city}, {validatedFormData.state} {validatedFormData.zipCode}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center rounded-xl">
                          <CreditCard size={20} />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900">Payment Information</h2>
                          <p className="text-sm text-gray-500">Secure payment processing</p>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <SquarePayment 
                          onSuccess={handlePaymentSuccess}
                          buttonColorClass={getButtonClass()}
                          isProcessing={isProcessing}
                          amount={`$${calculateTotal()}`}
                        />
                        
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
                          <Lock size={16} className="text-green-600" />
                          <span>Your payment information is secure and encrypted with 256-bit SSL</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Enhanced Order Summary */}
              <div className="w-full lg:w-1/3 order-1 lg:order-2">
                <div className="sticky top-8">
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-100">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                      <div className="w-10 h-10 bg-gradient-to-r from-secondary to-secondary-light text-white flex items-center justify-center rounded-xl">
                        <ShoppingBag size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                        <p className="text-sm text-gray-500">Your memory preservation package</p>
                      </div>
                    </div>
                    
                    {/* Enhanced Package Display */}
                    <div className="mb-6 bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-100">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className={`font-bold text-lg ${getTextColorClass()}`}>{packageDetails.name} Package</span>
                          {packageDetails.popular && (
                            <span className="ml-2 bg-secondary text-white text-xs font-bold px-2 py-1 rounded-full">
                              POPULAR
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-xl text-gray-900">{packageDetails.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{packageDetails.description}</p>
                      
                      <div className="space-y-2">
                        {packageDetails.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check size={16} className={`${getTextColorClass()} mt-0.5 shrink-0`} />
                            <span className="text-sm text-gray-700">{feature}</span>
                          </div>
                        ))}
                        {packageDetails.features.length > 3 && (
                          <div className="text-sm text-primary font-medium">
                            + {packageDetails.features.length - 3} more features included
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Enhanced Add-ons Section */}
                    <div className="border-t border-gray-100 py-6 mb-6">
                      <h3 className="font-bold text-lg mb-4 text-gray-900">Customize Your Order</h3>
                      
                      {/* USB Drive Add-on */}
                      <div className="mb-6 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 flex items-center justify-center rounded-lg">
                              <Usb size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Custom USB Drive</p>
                              <p className="text-xs text-gray-500">Physical backup for your memories</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-full border-2"
                              onClick={() => handleUsbChange(-1)}
                              disabled={usbDrives === 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center font-semibold">{usbDrives}</span>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-full border-2"
                              onClick={() => handleUsbChange(1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {usbDrives > 0 && (
                          <div className="flex justify-between text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
                            <span>{usbDrives} × $24.95</span>
                            <span className="font-semibold">${(usbDrives * USB_DRIVE_PRICE).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Cloud Backup Add-on */}
                      <div className="mb-6 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 text-purple-600 flex items-center justify-center rounded-lg">
                              <Cloud size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Online Gallery & Backup</p>
                              <p className="text-xs text-gray-500">1 year included, secure cloud storage</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-full border-2"
                              onClick={() => handleCloudChange(-1)}
                              disabled={cloudBackup === 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center font-semibold">{cloudBackup}</span>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8 rounded-full border-2"
                              onClick={() => handleCloudChange(1)}
                              disabled={cloudBackup === 1}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {cloudBackup > 0 && (
                          <div className="flex justify-between text-sm bg-green-50 text-green-700 p-2 rounded-lg">
                            <span>{cloudBackup} year included</span>
                            <span className="font-semibold">Free</span>
                          </div>
                        )}
                      </div>

                      {/* Digitizing Speed Summary - Updated to show current selection */}
                      <div className="p-4 rounded-2xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-100 text-orange-600 flex items-center justify-center rounded-lg">
                              <Calendar size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Processing Speed</p>
                              <p className="text-xs text-gray-500">
                                {getSelectedDigitizingOption().name} ({getSelectedDigitizingOption().time})
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {getSelectedDigitizingOption().price === 0 
                              ? <span className="text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm">Free</span> 
                              : `$${getSelectedDigitizingOption().price.toFixed(2)}`
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Pricing Summary */}
                    <div className="border-t border-gray-100 pt-6 mb-6 space-y-3">
                      <div className="flex justify-between text-gray-700">
                        <span>Subtotal</span>
                        <span className="font-semibold">${calculateSubtotal().toFixed(2)}</span>
                      </div>
                      {appliedCoupon && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center gap-2">
                            <Tag size={16} />
                            {appliedCoupon} ({couponDiscount}% off)
                          </span>
                          <span className="font-semibold">-${(calculateSubtotal() * (couponDiscount / 100)).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-700">
                        <span>Shipping</span>
                        <span className="text-green-600 font-semibold">Free</span>
                      </div>
                    </div>
                    
                    {/* Enhanced Total */}
                    <div className="border-t-2 border-gray-200 pt-4 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-gray-900">${calculateTotal()}</span>
                      </div>
                    </div>
                    
                    {/* Enhanced Trust Indicators */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="w-8 h-8 bg-green-500 text-white flex items-center justify-center rounded-full">
                          <Truck size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-green-800 text-sm">Free Shipping Both Ways</div>
                          <div className="text-xs text-green-600">We handle all shipping costs</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="w-8 h-8 bg-blue-500 text-white flex items-center justify-center rounded-full">
                          <Shield size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-blue-800 text-sm">100% Secure & Insured</div>
                          <div className="text-xs text-blue-600">Your memories are protected</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="w-8 h-8 bg-purple-500 text-white flex items-center justify-center rounded-full">
                          <Award size={16} />
                        </div>
                        <div>
                          <div className="font-semibold text-purple-800 text-sm">Professional Quality</div>
                          <div className="text-xs text-purple-600">Expert digitization service</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Checkout;
