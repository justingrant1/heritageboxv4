
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendEmailToHeritageBox } from "@/utils/emailUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type ContactFormData = {
  name: string;
  email: string;
  message: string;
};

const ContactForm = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill out all fields");
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Send contact form data to HeritageBox email using our utility function
      await sendEmailToHeritageBox({
        ...formData,
        page: window.location.pathname,
        url: window.location.href
      }, 'contact-form');
      
      // Show success message
      toast.success("Thank you! Your message has been sent. We'll be in touch soon.");
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        message: ""
      });
    } catch (error) {
      console.error('Error sending contact form:', error);
      toast.error(`Problem sending your message: ${error instanceof Error ? error.message : 'Please try again'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 text-primary">Send Us a Message</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input 
            type="text" 
            id="name" 
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            disabled={isSubmitting}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input 
            type="email" 
            id="email" 
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-md" 
            disabled={isSubmitting}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
          <textarea 
            id="message" 
            rows={4} 
            value={formData.message}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            disabled={isSubmitting}
          ></textarea>
        </div>
        <Button 
          className="w-full" 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </form>
    </div>
  );
};

export default ContactForm;
