
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { sendEmailToHeritageBox } from '@/utils/emailUtils';

const EmailSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        page: window.location.pathname,
        fullUrl: window.location.href
      }, 'newsletter-signup');
      
      // Show success message
      toast.success("Thanks for signing up! You'll receive updates about our services.");
      
      // Reset the form
      setEmail('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(`Problem sending your request: ${error instanceof Error ? error.message : 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-cream py-16">
      <div className="container mx-auto container-padding">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold font-serif mb-4 text-primary">Stay Updated</h2>
          <p className="text-lg mb-6 text-gray-700">
            Sign up for our newsletter to receive updates and special offers.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow"
              required
              disabled={isSubmitting}
            />
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary-light whitespace-nowrap"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Sign Up"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default EmailSignup;
