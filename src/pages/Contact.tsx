
import NavBar from "@/components/NavBar";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import SEOHelmet from "@/components/SEOHelmet";

const ContactPage = () => {
  return (
    <div className="min-h-screen">
      <SEOHelmet 
        title="Contact HeritageBox® | Get Help With Your Memory Preservation"
        description="Have questions about preserving your family memories? Our team of digitization experts is ready to help you transform your VHS tapes, photos, and slides into digital treasures."
        keywords="contact heritagebox, memory digitization help, photo scanning questions, vhs conversion support, digitization customer service"
        canonical="https://heritagebox.com/contact" // Explicit canonical URL
      />
      <NavBar />
      <main>
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
