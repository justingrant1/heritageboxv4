import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendEmailToHeritageBox } from '@/utils/emailUtils';

const EmailPopup = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if the user has seen the popup before
    const hasSeenPopup = localStorage.getItem('hasSeenEmailPopup');
    console.log('EmailPopup: hasSeenPopup =', hasSeenPopup);
    
    if (!hasSeenPopup) {
      console.log('EmailPopup: Setting timer to show popup in 2 seconds');
      // Wait a moment before showing the popup
      const timer = setTimeout(() => {
        console.log('EmailPopup: Showing popup now');
        setOpen(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else {
      console.log('EmailPopup: User has already seen popup, not showing');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send email to info@heritagebox.com using our utility function
      await sendEmailToHeritageBox({ 
        email, 
        referrer: document.referrer,
        pageUrl: window.location.href
      }, 'welcome-popup');
      
      // Mark that the user has seen the popup
      localStorage.setItem('hasSeenEmailPopup', 'true');
      
      // Show success message
      toast.success("Thank you! Your 15% discount code has been sent to your email.");
      
      // Close the dialog
      setOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Problem sending your request: ${error instanceof Error ? error.message : 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999998]"
          onClick={() => {
            localStorage.setItem('hasSeenEmailPopup', 'true');
            setOpen(false);
          }}
        />
      )}
      
      {/* Popup Content */}
      {open && (
        <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
          <div className="relative bg-gradient-to-br from-cream to-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-secondary/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-rose-300/30 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('hasSeenEmailPopup', 'true');
                setOpen(false);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-primary/60 hover:text-primary hover:bg-white/80 transition-all duration-200 z-50 min-w-[44px] min-h-[44px] flex items-center justify-center backdrop-blur-sm"
              aria-label="Close popup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative p-8 pt-12">
              {/* Header Section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/20 rounded-full mb-4">
                  <span className="text-2xl">🎁</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif text-primary leading-tight mb-3">
                  Exclusive 15% Off
                </h2>
                <p className="text-base text-primary/70 leading-relaxed max-w-sm mx-auto">
                  Join our heritage community and receive an instant discount on your first order
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="popup-email" className="text-primary font-medium">Email Address</Label>
                  <Input 
                    id="popup-email"
                    type="email" 
                    placeholder="your@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 border-2 border-primary/20 rounded-xl focus:border-secondary focus:ring-0 bg-white/80 backdrop-blur-sm transition-all duration-200"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-gradient-to-r from-secondary to-secondary hover:from-secondary-light hover:to-secondary text-primary font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:transform-none"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        Claiming Discount...
                      </div>
                    ) : (
                      "Claim My 15% Discount"
                    )}
                  </Button>
                  
                  <button 
                    type="button"
                    onClick={() => {
                      localStorage.setItem('hasSeenEmailPopup', 'true');
                      setOpen(false);
                    }}
                    className="w-full text-sm text-primary/60 hover:text-primary/80 transition-colors duration-200 py-2"
                    disabled={isSubmitting}
                  >
                    Continue without discount
                  </button>
                </div>
              </form>
              
              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-primary/10">
                <div className="flex items-center justify-center gap-4 text-xs text-primary/50">
                  <span>✓ No spam, ever</span>
                  <span>✓ Unsubscribe anytime</span>
                  <span>✓ Secure & private</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmailPopup;
