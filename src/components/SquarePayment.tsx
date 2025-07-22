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
  // Get from Vite environment variables
  const appId = import.meta.env.VITE_SQUARE_APP_ID;
  const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;
  const environment = import.meta.env.VITE_SQUARE_ENVIRONMENT || 'sandbox';

  if (!appId || !locationId) {
    console.error("Square configuration is missing. Check your .env file for VITE_SQUARE_APP_ID and VITE_SQUARE_LOCATION_ID");
    return { appId: '', locationId: '', jsUrl: 'https://web.squarecdn.com/v1/square.js' };
  }
  
  console.log('Square Config:', { appId, locationId, environment });
  
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
            minHeight: '120px' // Reduced height for less empty space
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
    <div className="bg-white max-w-md mx-auto">
      {/* Security Badge */}
      <div className="flex items-center gap-3 mb-8 p-3 bg-gray-50 rounded-2xl">
        <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={16} />
        </div>
        <span className="text-gray-700 font-medium">Secure payment processing</span>
      </div>

      {/* Card Information Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-slate-700 text-white flex items-center justify-center rounded-2xl flex-shrink-0">
          <CardIcon size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">Card Information</h3>
          <p className="text-gray-500">Enter your card details below</p>
        </div>
      </div>
      
      {/* Credit Card Logos */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <img src="/mastercard.svg" alt="Mastercard" className="h-8 w-auto" />
        <img src="/visa.svg" alt="Visa" className="h-8 w-auto" />
        <img src="/amex.svg" alt="American Express" className="h-8 w-auto" />
      </div>
      
      {/* Card Input Container */}
      <div className="mb-6">
        {renderCardContainer()}
      </div>
      
      {/* Credit Cards Accepted */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <CardIcon size={16} className="text-gray-400" />
        <span className="text-gray-500">All major credit cards accepted</span>
      </div>
      
      {/* Pay Button */}
      <Button
        onClick={handlePaymentSubmit}
        className="w-full h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 mb-8"
        disabled={isProcessing || !card || !!error}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg">Processing Payment...</span>
          </>
        ) : (
          <>
            <span>Pay {amount}</span>
            <ShieldCheck className="w-5 h-5" />
          </>
        )}
      </Button>
      
      {/* Security Badges */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1">
            <ShieldCheck size={16} />
          </div>
          <span className="text-xs text-gray-500 font-medium">SSL Secured</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1">
            <ShieldCheck size={16} />
          </div>
          <span className="text-xs text-gray-500 font-medium text-center">Powered by<br/>Square</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-1">
            <ShieldCheck size={16} />
          </div>
          <span className="text-xs text-gray-500 font-medium">PCI Compliant</span>
        </div>
      </div>
    </div>
  );
};

export default SquarePayment;
