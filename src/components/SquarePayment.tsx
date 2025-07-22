import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CreditCard as CardIcon, ShieldCheck, Lock } from 'lucide-react';

// Define types for the Square SDK
interface Square {
  payments: (applicationId: string, locationId: string, options?: any) => SquarePayments;
}

interface SquarePayments {
  card: (options?: CardOptions) => Promise<SquareCard>;
}

interface CardOptions {
  style?: {
    '.input-container'?: {
      borderRadius?: string;
      borderColor?: string;
      borderWidth?: string;
      backgroundColor?: string;
      fontSize?: string;
      color?: string;
      fontFamily?: string;
      padding?: string;
    };
    '.input-container.is-focus'?: {
      borderColor?: string;
      backgroundColor?: string;
    };
    '.input-container.is-error'?: {
      borderColor?: string;
    };
    '.message-text'?: {
      color?: string;
      fontSize?: string;
    };
    '.message-link'?: {
      color?: string;
    };
    '.message-icon'?: {
      color?: string;
    };
    'input'?: {
      fontSize?: string;
      fontFamily?: string;
      color?: string;
    };
    '::placeholder'?: {
      color?: string;
      fontWeight?: string;
    };
  };
}

interface SquareCard {
  attach: (selector: string, options?: any) => Promise<void>;
  tokenize: () => Promise<{
    status: string;
    token?: string;
    details?: {
      card?: {
        brand: string;
        last4: string;
        expMonth: number;
        expYear: number;
      };
    };
  }>;
  destroy?: () => void;
}

interface SquarePaymentProps {
  onSuccess: (token: string, details: any) => void;
  buttonColorClass: string;
  isProcessing: boolean;
  amount: string;
}

declare global {
  interface Window { Square: Square; }
}

// Environment-aware configuration
const getSquareConfig = () => {
  // Use window global instead of import.meta.env for better compatibility
  const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  let appId;
  let locationId;

  // Try to get from env variables, fallback to sandbox values for development
  if (typeof window !== 'undefined') {
    // In production, these should be set via build process
    appId = (window as any).__SQUARE_APP_ID__ || 'sq0idp-1Zchx5RshtaZ74spcf2w0A';
    locationId = (window as any).__SQUARE_LOCATION_ID__ || 'LPFZYDYB5G5GM';
  } else {
    // Fallback values
    appId = 'sq0idp-1Zchx5RshtaZ74spcf2w0A';
    locationId = 'LPFZYDYB5G5GM';
  }

  if (!appId || !locationId) {
    console.error("Square configuration is missing.");
    return { appId: '', locationId: '', jsUrl: 'https://web.squarecdn.com/v1/square.js' };
  }
  
  console.log('Square Config:', { appId, locationId, isProduction });
  
  return {
    appId,
    locationId,
    jsUrl: 'https://web.squarecdn.com/v1/square.js'
  };
};

const SquarePayment = ({ onSuccess, buttonColorClass, isProcessing, amount }: SquarePaymentProps) => {
  const [loaded, setLoaded] = useState(false);
  const [card, setCard] = useState<SquareCard | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config] = useState(getSquareConfig());

  // Cleanup function to destroy card instance
  const cleanupCard = () => {
    if (card && typeof card.destroy === 'function') {
      try {
        card.destroy();
      } catch (e) {
        console.warn("Error destroying card instance:", e);
      }
    }
  };

  useEffect(() => {
    // Clean up any previous script instances to prevent conflicts
    const existingScript = document.getElementById('square-script');
    if (existingScript) {
      document.body.removeChild(existingScript);
    }

    // Load the Square Web Payments SDK
    const script = document.createElement('script');
    script.id = 'square-script';
    script.src = config.jsUrl;
    script.async = true;
    script.onload = () => {
      console.log("Square SDK loaded successfully");
      setLoaded(true);
    };
    script.onerror = (e) => {
      console.error("Failed to load Square SDK:", e);
      setError("Failed to load payment processor");
      toast.error("Failed to load payment processor", {
        description: "Please refresh the page and try again",
      });
    };
    document.body.appendChild(script);

    return () => {
      cleanupCard();
      const scriptToRemove = document.getElementById('square-script');
      if (scriptToRemove) {
        try {
          document.body.removeChild(scriptToRemove);
        } catch (e) {
          console.warn("Script already removed:", e);
        }
      }
    };
  }, [config.jsUrl]);

  useEffect(() => {
    if (!loaded || card) return;

    async function initializeCard() {
      if (!config.appId || !config.locationId) {
        const errorMessage = "Payment provider is not configured. Please contact support.";
        console.error(errorMessage);
        setError(errorMessage);
        toast.error("Payment Error", {
          description: errorMessage,
        });
        return;
      }
      
      if (!window.Square) {
        console.error("Square SDK not available");
        setError("Payment processor not available");
        toast.error("Payment processor not available", {
          description: "Please refresh the page and try again",
        });
        return;
      }

      try {
        setCardLoading(true);
        console.log("Initializing Square Payments:", config);

        // Wait for container to be in DOM before proceeding
        const waitForContainer = () => {
          return new Promise((resolve, reject) => {
            const checkContainer = () => {
              const container = document.getElementById('card-container');
              if (container) {
                resolve(container);
              } else {
                setTimeout(checkContainer, 100);
              }
            };
            checkContainer();
            
            // Timeout after 5 seconds to avoid infinite waiting
            setTimeout(() => reject(new Error('Container timeout')), 5000);
          });
        };

        await waitForContainer();

        // Initialize with environment-aware configuration
        const payments = window.Square.payments(config.appId, config.locationId);

        console.log("Creating card instance");
        
        // Card styling with Square SDK supported properties only
        const cardOptions: CardOptions = {
          style: {
            '.input-container': {
              borderRadius: '8px',
              borderColor: '#D1D5DB',
              borderWidth: '1px'
            },
            '.input-container.is-focus': {
              borderColor: '#3B82F6'
            },
            '.input-container.is-error': {
              borderColor: '#EF4444'
            },
            '.message-text': {
              color: '#EF4444'
            }
          }
        };

        const cardInstance = await payments.card(cardOptions);

        // Double-check container is still available
        const container = document.getElementById('card-container');
        if (!container) {
          throw new Error('Card container not found in DOM');
        }

        console.log("Attaching card to container");
        await cardInstance.attach('#card-container');
        console.log("Card attached successfully");

        setCard(cardInstance);
        setError(null);
      } catch (e) {
        console.error("Square initialization error:", e);
        setError("Failed to initialize payment form");
        toast.error("Failed to initialize payment form", {
          description: "Please try again or use a different payment method",
        });
      } finally {
        setCardLoading(false);
      }
    }

    // Small delay to ensure DOM is ready
    setTimeout(initializeCard, 100);
  }, [loaded, card, config]);

  const handlePaymentSubmit = async () => {
    if (!card) {
      toast.error("Payment form not ready", {
        description: "Please wait for the payment form to load and try again",
      });
      return;
    }

    try {
      const result = await card.tokenize();
      if (result.status === 'OK' && result.token) {
        onSuccess(result.token, result.details);
      } else {
        toast.error("Payment processing failed", {
          description: "Please check your card details and try again",
        });
      }
    } catch (e) {
      console.error("Square payment error:", e);
      toast.error("Payment processing error", {
        description: "Please try again or use a different card",
      });
    }
  };

  const renderCardContainer = () => {
    const showLoadingState = (cardLoading && !card) || !loaded;
    const showErrorState = error && !cardLoading;
    
    return (
      <div className="space-y-4">
        {/* Card container */}
        <div 
          id="card-container" 
          className="relative"
          style={{
            display: showLoadingState || showErrorState ? 'none' : 'block',
            minHeight: '200px' // Accommodate card number, expiry, and CVV fields
          }}
        />
        
        {/* Loading state overlay */}
        {showLoadingState && (
          <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border-2 border-gray-200">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading secure payment...</span>
          </div>
        )}

        {/* Error state overlay */}
        {showErrorState && (
          <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-xl border-2 border-red-200">
            <p className="font-medium text-red-800">{error}</p>
            <p className="text-sm mt-2 text-center text-red-600">
              Please refresh the page or try a different browser
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4"
            >
              Refresh Page
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white max-w-2xl mx-auto">
      {/* Premium Header Section */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 rounded-2xl border border-blue-100 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck size={24} />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Secure Payment</h2>
            <p className="text-blue-600 font-medium text-sm">Protected by 256-bit SSL encryption</p>
          </div>
        </div>
      </div>

      {/* Credit Card Logos - Premium Layout */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
        <div className="flex items-center justify-center gap-6 mb-4">
          <img src="/visa.svg" alt="Visa" className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity" />
          <img src="/mastercard.svg" alt="Mastercard" className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity" />
          <img src="/amex.svg" alt="American Express" className="h-12 w-auto opacity-80 hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <CardIcon size={18} className="text-gray-600" />
          <span className="text-gray-600 font-medium">We accept all major credit cards</span>
        </div>
      </div>
      
      {/* Card Information Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 mb-8 border-2 border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-700 text-white flex items-center justify-center rounded-2xl shadow-lg">
            <CardIcon size={28} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h3>
            <p className="text-gray-600 text-lg">Enter your card information securely</p>
          </div>
        </div>
        
        {/* Card Input Container - Enhanced */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-inner">
          {renderCardContainer()}
        </div>
      </div>
      
      {/* Payment Button - Premium Design */}
      <div className="mb-8">
        <Button
          onClick={handlePaymentSubmit}
          className="w-full h-16 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white font-bold text-xl rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-4 transform hover:scale-[1.02] active:scale-[0.98]"
          disabled={isProcessing || !card || !!error}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Processing Your Payment...</span>
            </>
          ) : (
            <>
              <Lock className="w-6 h-6" />
              <span>Pay {amount} Securely</span>
              <ShieldCheck className="w-6 h-6" />
            </>
          )}
        </Button>
        
        {/* Instant confirmation text */}
        <div className="text-center mt-4 text-gray-600">
          <p className="text-sm">🚀 <strong>Instant confirmation</strong> • No hidden fees • Cancel anytime</p>
        </div>
      </div>
      
      {/* Trust Indicators - Premium Layout */}
      <div className="bg-gradient-to-r from-green-50 via-blue-50 to-purple-50 rounded-2xl p-6 border border-gray-100">
        <h4 className="text-center text-lg font-bold text-gray-800 mb-6">Your Security is Our Priority</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center mb-3 shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <h5 className="font-bold text-gray-900 mb-1">SSL Encrypted</h5>
            <p className="text-sm text-gray-600">256-bit encryption protects your data</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center mb-3 shadow-lg">
              <Lock size={28} />
            </div>
            <h5 className="font-bold text-gray-900 mb-1">PCI Compliant</h5>
            <p className="text-sm text-gray-600">Meets highest security standards</p>
          </div>
          
          <div className="flex flex-col items-center text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full flex items-center justify-center mb-3 shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <h5 className="font-bold text-gray-900 mb-1">Powered by Square</h5>
            <p className="text-sm text-gray-600">Trusted by millions worldwide</p>
          </div>
        </div>
        
        {/* Final Security Message */}
        <div className="flex items-center justify-center gap-3 mt-6 p-4 bg-white/80 rounded-xl border border-gray-200">
          <Lock size={20} className="text-green-600" />
          <span className="text-gray-700 font-medium">We never store your card details • Processed securely by Square</span>
        </div>
      </div>
    </div>
  );
};

export default SquarePayment;
