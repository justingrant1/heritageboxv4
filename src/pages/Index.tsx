import { useEffect } from 'react';
import NavBar from '@/components/NavBar';
import Hero from '@/components/Hero';
import CountdownTimer from '@/components/CountdownTimer';
import HowItWorks from '@/components/HowItWorks';
import PackageComparison from '@/components/PackageComparison';
import About from '@/components/About';
import Testimonials, { getTestimonialsSchema } from '@/components/Testimonials';
import FAQ, { getFAQSchema } from '@/components/FAQ';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import EmailPopup from '@/components/EmailPopup';
import EmailSignup from '@/components/EmailSignup';
import SEOHelmet from '@/components/SEOHelmet';

const Index = () => {
  // Handle scrolling to sections when coming from other pages
  useEffect(() => {
    const scrollTarget = window.sessionStorage.getItem('scrollTarget');
    if (scrollTarget) {
      setTimeout(() => {
        const element = document.querySelector(`#${scrollTarget}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        window.sessionStorage.removeItem('scrollTarget');
      }, 100);
    }
  }, []);
  
  // Create custom schema list for homepage with enhanced structured data
  const homepageSchema = [
    // FAQ schema
    getFAQSchema(),
    // Testimonials schema with detailed review information
    getTestimonialsSchema(),
    // Product schema with aggregate rating
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "HeritageBox Memory Digitization Services",
      "description": "Professional digitization services for VHS tapes, photos, slides, and other legacy media formats.",
      "brand": {
        "@type": "Brand",
        "name": "HeritageBox"
      },
      "image": "https://heritagebox.com/lovable-uploads/dff425b2-3ade-48c8-acd8-e56366b3516d.png",
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "129.99",
        "highPrice": "299.99",
        "priceCurrency": "USD",
        "offerCount": "3"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "1000",
        "bestRating": "5"
      }
    },
    // BreadcrumbList schema
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://heritagebox.com/"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen">
      <SEOHelmet 
        title="HeritageBox® | Professional Memory Digitization Services"
        description="Don't let your precious memories fade away! HeritageBox® transforms your VHS tapes, photos, and slides into modern digital formats that will last for generations."
        keywords="memory preservation, digitize vhs, photo scanning, family archives, home videos, slide scanning, professional digitization"
        image="/lovable-uploads/dff425b2-3ade-48c8-acd8-e56366b3516d.png"
        canonical="https://heritagebox.com/"
        schema={homepageSchema}
      />
      <EmailPopup />
      <NavBar />
      <main>
        <Hero />
        <CountdownTimer />
        <HowItWorks />
        <PackageComparison />
        <About />
        <Testimonials />
        <EmailSignup />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
