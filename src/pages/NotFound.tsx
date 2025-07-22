
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEOHelmet from "@/components/SEOHelmet";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHelmet 
        title="Page Not Found | HeritageBox®"
        description="We couldn't find the page you were looking for. Please return to our homepage to continue preserving your memories."
        canonical="https://heritagebox.com/404" // Explicit canonical URL for 404 page
      />
      
      <NavBar />
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center px-4 py-10 max-w-lg">
          <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            We're sorry, the page you're looking for doesn't exist or has been moved.
            Let's get you back on track to preserving your memories.
          </p>
          <Button asChild className="bg-secondary text-primary hover:bg-secondary/90">
            <Link to="/">
              Return to Homepage
            </Link>
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
