
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Check, ArrowRight, Star, Gift, Clock, Shield, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

const PackageSelected = () => {
  const [searchParams] = useSearchParams();
  const packageType = searchParams.get('package') || 'Popular';
  
  // Define all packages
  const allPackages = [
    {
      name: "Starter",
      price: "$69",
      description: "Perfect for a small collection of memories",
      color: "primary",
      tapeCount: "3",
      photoCount: "75",
      features: [
        "High-quality digital conversion",
        "Online access to digital files",
        "Free shipping both ways",
        "Online Backup (1 Year Free)",
        "Professional quality guarantee"
      ]
    },
    {
      name: "Popular",
      price: "$179",
      description: "Our most popular package for families",
      color: "secondary",
      tapeCount: "10",
      photoCount: "250",
      popular: true,
      features: [
        "High-quality digital conversion", 
        "Online access to digital files",
        "Free shipping both ways",
        "Online Backup (1 Year Free)",
        "Professional quality guarantee",
        "Priority processing"
      ]
    },
    {
      name: "Dusty Rose",
      price: "$349",
      description: "Great for larger collections",
      color: "rose-dark",
      tapeCount: "20",
      photoCount: "500",
      features: [
        "High-quality digital conversion",
        "Online access to digital files",
        "Free shipping both ways",
        "Online Backup (1 Year Free)",
        "Professional quality guarantee",
        "Priority processing"
      ]
    },
    {
      name: "Eternal",
      price: "$599",
      description: "For preserving a lifetime of memories",
      color: "primary-light",
      tapeCount: "40",
      photoCount: "1000",
      features: [
        "High-quality digital conversion",
        "Online access to digital files",
        "Free shipping both ways",
        "Online Backup (1 Year Free)",
        "Professional quality guarantee",
        "Priority processing",
        "Dedicated support specialist"
      ]
    }
  ];
  
  // Function to get the currently selected package details
  const getPackageDetails = () => {
    const selectedPackage = allPackages.find(pkg => pkg.name === packageType);
    return selectedPackage || allPackages[1]; // Default to Popular if not found
  };

  const packageDetails = getPackageDetails();
  
  // Get background color class based on package type
  const getBgColorClass = () => {
    switch(packageDetails.color) {
      case 'primary':
        return 'bg-primary/5';
      case 'rose-dark':
        return 'bg-rose-500/5';
      case 'primary-light':
        return 'bg-blue-400/5';
      case 'secondary':
        return 'bg-secondary/5';
      default:
        return 'bg-gray-50';
    }
  };
  
  // Get text color class based on package type
  const getTextColorClass = () => {
    switch(packageDetails.color) {
      case 'primary':
        return 'text-primary';
      case 'rose-dark':
        return 'text-rose-500';
      case 'primary-light':
        return 'text-blue-400';
      case 'secondary':
        return 'text-secondary';
      default:
        return 'text-gray-900';
    }
  };
  
  // Get button color class based on package type
  const getButtonClass = () => {
    switch(packageDetails.color) {
      case 'primary':
        return 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl';
      case 'rose-dark':
        return 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-xl';
      case 'primary-light':
        return 'bg-blue-400 hover:bg-blue-500 text-white shadow-lg hover:shadow-xl';
      case 'secondary':
        return 'bg-secondary hover:bg-secondary/90 text-primary shadow-lg hover:shadow-xl';
      default:
        return 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl';
    }
  };

  const handlePackageSwitch = (newPackage: string) => {
    toast(`You've switched to the ${newPackage} package!`, {
      description: "Your new selection has been updated.",
      position: "top-center",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50/50 to-white">
      <NavBar />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
          {/* Hero Section with Trust Indicators */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Check className="w-4 h-4" />
              Great choice! You're almost done
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
              Thank You for Choosing Our <br />
              <span className={`${getTextColorClass()} relative`}>
                {packageDetails.name} Package
                {packageDetails.popular && <Star className="inline w-6 h-6 ml-2 fill-current" />}
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              You're one step closer to preserving your cherished memories for generations to come.
            </p>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 mt-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                100% Satisfaction Guarantee
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Free Shipping Both Ways
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Fast Turnaround Time
              </div>
            </div>
          </div>
          
          {/* Main Package Display */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12 border border-gray-100">
            <div className={`${getBgColorClass()} p-8 md:p-12 relative overflow-hidden`}>
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-4 -translate-x-4"></div>
              
              <div className="relative">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className={`${getTextColorClass()} text-4xl md:text-5xl font-bold`}>
                        {packageDetails.name}
                      </h2>
                      {packageDetails.popular && (
                        <div className="bg-gradient-to-r from-secondary to-secondary-light text-primary px-4 py-2 text-sm font-bold rounded-full flex items-center gap-1">
                          <Star className="w-4 h-4 fill-current" />
                          Most Popular
                        </div>
                      )}
                    </div>
                    <p className="text-xl text-gray-700 mb-6 leading-relaxed">{packageDetails.description}</p>
                    
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`${getTextColorClass()} bg-white/50 rounded-lg p-2`}>
                            <Gift className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Digitize Content</p>
                            <p className="text-gray-600">Up to {packageDetails.tapeCount} tapes OR {packageDetails.photoCount} photos</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={`${getTextColorClass()} bg-white/50 rounded-lg p-2`}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">Quality Guarantee</p>
                            <p className="text-gray-600">Professional-grade conversion</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center lg:text-right">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                      <p className="text-gray-600 mb-2">Total Price</p>
                      <span className="text-5xl md:text-6xl font-bold text-gray-900">{packageDetails.price}</span>
                      <p className="text-gray-500 mt-1">one-time payment</p>
                      
                      {/* Primary CTA */}
                      <Button 
                        className={`w-full mt-6 text-lg py-4 h-auto ${getButtonClass()} transition-all duration-300`}
                        asChild
                      >
                        <Link to={`/checkout?package=${encodeURIComponent(packageType)}`}>
                          <Gift className="w-5 h-5 mr-2" />
                          Complete Your Order
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Features Section */}
            <div className="p-8 md:p-12">
              <h3 className="text-2xl font-bold mb-8 text-center">Everything Included in Your Package</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {packageDetails.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                    <span className={`${getTextColorClass()} mt-1 shrink-0 bg-white rounded-full p-1`}>
                      <Check size={16} className="stroke-[3]" />
                    </span>
                    <span className="text-gray-700 leading-relaxed font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Package Change Section - Improved Layout */}
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-12 border border-gray-100">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-4">Want to Change Your Package?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Compare all our packages below and switch to the one that best fits your needs.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allPackages.map((pkg) => (
                <Link
                  key={pkg.name}
                  to={`/package-selected?package=${encodeURIComponent(pkg.name)}`}
                  onClick={() => handlePackageSwitch(pkg.name)}
                  className={`block transition-all duration-300 ${
                    pkg.name === packageType 
                      ? 'opacity-60 cursor-not-allowed pointer-events-none transform scale-95' 
                      : 'hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  <Card className={`h-full relative ${
                    pkg.name === packageType 
                      ? 'border-2 border-gray-300 bg-gray-50' 
                      : 'border-2 border-transparent hover:border-gray-200 bg-white'
                  }`}>
                    {pkg.popular && pkg.name !== packageType && (
                      <div className="absolute top-0 right-0 bg-secondary text-primary px-3 py-1 text-xs font-bold rounded-bl-lg">
                        Popular
                      </div>
                    )}
                    {pkg.name === packageType && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                        Selected
                      </div>
                    )}
                    
                    <CardHeader className="pb-4">
                      <h3 className={`text-xl font-bold ${
                        pkg.popular && pkg.name !== packageType ? 'text-secondary' : 
                        pkg.name === packageType ? 'text-gray-500' : `text-${pkg.color}`
                      }`}>
                        {pkg.name}
                      </h3>
                      <p className="text-3xl font-bold text-gray-900">{pkg.price}</p>
                      <div className="text-sm text-gray-600 mt-2 leading-tight">
                        Up to {pkg.tapeCount} tapes OR {pkg.photoCount} photos
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">{pkg.description}</p>
                      <div className={`text-sm font-medium flex items-center justify-center py-2 rounded-lg ${
                        pkg.name !== packageType 
                          ? 'text-blue-600 bg-blue-50' 
                          : 'text-gray-500 bg-gray-100'
                      }`}>
                        {pkg.name !== packageType ? (
                          <>Switch to this package <ArrowRight size={14} className="ml-1" /></>
                        ) : (
                          <>Current selection <Check size={14} className="ml-1" /></>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Process Steps - Enhanced Design */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-8 md:p-12 mb-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Happens Next?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Follow these simple steps to get your memories digitized and preserved forever.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  step: 1,
                  title: "Complete Your Order",
                  description: "Fill out your shipping information and payment details to complete your order.",
                  icon: <Gift className="w-8 h-8" />
                },
                {
                  step: 2,
                  title: "Receive Your Kit",
                  description: "We'll send you a secure, prepaid shipping kit to safely package your memories.",
                  icon: <Truck className="w-8 h-8" />
                },
                {
                  step: 3,
                  title: "Ship Back Your Memories",
                  description: "Use the prepaid shipping label to send your memories to our digitization lab.",
                  icon: <ArrowRight className="w-8 h-8" />
                },
                {
                  step: 4,
                  title: "Enjoy Your Digitized Memories",
                  description: "We'll carefully digitize your items and return both the originals and digital copies.",
                  icon: <Star className="w-8 h-8" />
                }
              ].map((item, index) => (
                <div key={index} className="text-center">
                  <div className={`${getBgColorClass()} ${getTextColorClass()} rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                    {item.icon}
                  </div>
                  <div className={`${getTextColorClass()} text-2xl font-bold mb-2`}>{item.step}</div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Final CTA Section */}
          <div className="text-center bg-white rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Preserve Your Memories?</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Complete your order now and take the first step toward preserving your family's legacy.
            </p>
            
            <Button 
              className={`text-xl py-6 px-12 h-auto ${getButtonClass()} transition-all duration-300 transform hover:scale-105`}
              asChild
            >
              <Link to={`/checkout?package=${encodeURIComponent(packageType)}`}>
                <Gift className="w-6 h-6 mr-3" />
                Complete Your Order
                <ArrowRight className="w-6 h-6 ml-3" />
              </Link>
            </Button>
            
            <p className="mt-6 text-gray-500">
              Have questions? <Link to="/" className={`${getTextColorClass()} hover:underline font-medium`}>Contact our customer support</Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default PackageSelected;
