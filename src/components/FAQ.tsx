
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Export faqs array for use in schema markup
export const faqs = [
  {
    question: "What types of media can HeritageBox digitize?",
    answer: "We can digitize VHS tapes, VHS-C, Betamax, MiniDV, Hi8, Digital8, slides, negatives, photos, and audio cassettes."
  },
  {
    question: "How long does the digitization process take?",
    answer: "Typically, the entire process takes 3-4 weeks from the time we receive your media. This includes digitization, quality control, and return shipping."
  },
  {
    question: "Is my original media returned to me?",
    answer: "Yes, we return all your original media along with the digital copies. We take great care to ensure everything is safely returned to you."
  },
  {
    question: "How do I access my digitized memories?",
    answer: "Depending on your package, you'll receive your digitized memories via secure online access, a custom USB drive, or both. You can easily view, download, and share your memories."
  },
  {
    question: "Is there a limit to how much you can fit in the box?",
    answer: "Each package specifies the number of items we can digitize. If you have more items than your package allows, you can purchase additional digitization services."
  },
  {
    question: "What if my media is damaged?",
    answer: "We have extensive experience working with damaged media. While we can't guarantee recovery in all cases, our technicians use specialized equipment to salvage as much content as possible from damaged items."
  }
];

// Generate FAQPage Schema markup
export const getFAQSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

const FAQ = () => {

  return (
    <section id="faq" className="section-padding bg-cream">
      <div className="container mx-auto container-padding">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our services and processes.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-medium text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
