
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle smooth scrolling for hash links only when on the homepage
  useEffect(() => {
    if (hash && pathname === '/') {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [pathname, hash]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Handle anchor links on the homepage
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    if (pathname === '/') {
      // We're on the homepage, use smooth scrolling
      e.preventDefault();
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // We're not on homepage, navigate to homepage with hash
      // No need to prevent default - let normal navigation happen
    }
    
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  return (
    <header className={`fixed w-full z-[9999] transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'}`}>
      <div className="container mx-auto flex justify-between items-center container-padding">
        <Link to="/" className="flex items-center gap-2">
          <h1 className={`text-primary font-serif font-bold text-2xl`}>
            Heritage<span className="text-secondary">Box</span><sup className="text-xs align-super">®</sup>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {pathname === '/' ? (
            // On homepage, use smooth scroll for these sections
            <>
              <a href="#how-it-works" onClick={(e) => handleAnchorClick(e, "#how-it-works")} className="text-primary hover:text-secondary transition-colors">How It Works</a>
              <a href="#packages" onClick={(e) => handleAnchorClick(e, "#packages")} className="text-primary hover:text-secondary transition-colors">Packages</a>
              <Link to="/about-us" className="text-primary hover:text-secondary transition-colors">About Us</Link>
              <a href="#faq" onClick={(e) => handleAnchorClick(e, "#faq")} className="text-primary hover:text-secondary transition-colors">FAQ</a>
            </>
          ) : (
            // On other pages, use direct links instead of hash links
            <>
              <Link to="/" onClick={() => window.sessionStorage.setItem('scrollTarget', 'how-it-works')} className="text-primary hover:text-secondary transition-colors">How It Works</Link>
              <Link to="/" onClick={() => window.sessionStorage.setItem('scrollTarget', 'packages')} className="text-primary hover:text-secondary transition-colors">Packages</Link>
              <Link to="/about-us" className="text-primary hover:text-secondary transition-colors">About Us</Link>
              <Link to="/" onClick={() => window.sessionStorage.setItem('scrollTarget', 'faq')} className="text-primary hover:text-secondary transition-colors">FAQ</Link>
            </>
          )}
          <Link to="/contact" className="text-primary hover:text-secondary transition-colors">Contact</Link>
          <Link to="/package-selected?package=Popular">
            <Button className="btn-secondary">Get Started</Button>
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-primary" onClick={toggleMenu} aria-label="Toggle menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden bg-white w-full shadow-lg animate-fade-in z-[9999]">
          <div className="container mx-auto py-4 flex flex-col space-y-4 container-padding">
            {pathname === '/' ? (
              // On homepage, use smooth scroll for these sections
              <>
                <a href="#how-it-works" onClick={(e) => handleAnchorClick(e, "#how-it-works")} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">How It Works</a>
                <a href="#packages" onClick={(e) => handleAnchorClick(e, "#packages")} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">Packages</a>
                <Link to="/about-us" onClick={() => setIsMenuOpen(false)} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">About Us</Link>
                <a href="#faq" onClick={(e) => handleAnchorClick(e, "#faq")} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">FAQ</a>
              </>
            ) : (
              // On other pages, use direct links instead of hash links
              <>
                <Link to="/" onClick={() => {setIsMenuOpen(false); window.sessionStorage.setItem('scrollTarget', 'how-it-works');}} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">How It Works</Link>
                <Link to="/" onClick={() => {setIsMenuOpen(false); window.sessionStorage.setItem('scrollTarget', 'packages');}} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">Packages</Link>
                <Link to="/about-us" onClick={() => setIsMenuOpen(false)} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">About Us</Link>
                <Link to="/" onClick={() => {setIsMenuOpen(false); window.sessionStorage.setItem('scrollTarget', 'faq');}} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">FAQ</Link>
              </>
            )}
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="text-primary hover:text-secondary transition-colors py-2 border-b border-gray-100">Contact</Link>
            <Link to="/package-selected?package=Popular" onClick={() => setIsMenuOpen(false)}>
              <Button className="btn-secondary w-full">Get Started</Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default NavBar;
