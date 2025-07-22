import { Facebook, Instagram, Twitter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handlePackagesClick = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.querySelector("#packages");
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleHowItWorksClick = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.querySelector("#how-it-works");
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleFAQClick = () => {
    navigate("/");
    setTimeout(() => {
      const element = document.querySelector("#faq");
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 container-padding">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">HeritageBox<sup className="text-xs align-super">®</sup></h3>
            <p className="text-gray-300 mb-4">
              Preserving your precious memories for generations to come. 
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/people/HeritageBox/100083540474473/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-secondary transition-colors" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/heritagebox_/" target="_blank" rel="noopener noreferrer" className="text-white hover:text-secondary transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-white hover:text-secondary transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><button onClick={handleHowItWorksClick} className="text-gray-300 hover:text-secondary transition-colors text-left">How It Works</button></li>
              <li><button onClick={handlePackagesClick} className="text-gray-300 hover:text-secondary transition-colors text-left">Packages</button></li>
              <li><Link to="/about-us" className="text-gray-300 hover:text-secondary transition-colors">About Us</Link></li>
              <li><button onClick={handleFAQClick} className="text-gray-300 hover:text-secondary transition-colors text-left">FAQ</button></li>
            </ul>
          </div>
          
          {/* Support */}
          <div>
            <h4 className="text-lg font-bold mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-gray-300 hover:text-secondary transition-colors">Contact Us</Link></li>
              <li><Link to="/terms-of-service" className="text-gray-300 hover:text-secondary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="text-gray-300 hover:text-secondary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
          
          {/* Contact Info - Enhanced structure */}
          <div>
            <h4 className="text-lg font-bold mb-4">Contact Us</h4>
            <address className="not-italic text-gray-300 space-y-2">
              <p>7934 West Drive, Unit 1005</p>
              <p>North Bay Village, FL 33141</p>
              <p className="pt-2">Email: <a href="mailto:info@heritagebox.com" className="hover:text-secondary transition-colors">info@heritagebox.com</a></p>
              <p>Phone: <a href="tel:+19176980202" className="hover:text-secondary transition-colors">(917) 698-0202</a></p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 container-padding">
          <p>&copy; {currentYear} HeritageBox<sup className="text-xs align-super">®</sup>. All rights reserved.</p>
          <div className="mt-2 flex justify-center space-x-4">
            <Link to="/privacy-policy" className="hover:text-secondary transition-colors">Privacy Policy</Link>
            <span>|</span>
            <Link to="/terms-of-service" className="hover:text-secondary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
