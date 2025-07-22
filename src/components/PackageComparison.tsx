
import { Check, Star, Sparkles, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "react-router-dom";

interface PackageProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  color: string;
  tapeCount?: string;
  photoCount?: string;
}

const Package = ({ name, price, description, features, popular, color, tapeCount, photoCount }: PackageProps) => {
  // Create a button class based on the package type
  const getButtonClass = () => {
    if (popular) {
      return 'bg-secondary hover:bg-secondary-light text-primary font-semibold shadow-lg hover:shadow-xl';
    }
    
    // Map the color to specific button variants
    switch (color) {
      case 'primary':
        return 'bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl';
      case 'rose-dark':
        return 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg hover:shadow-xl';
      case 'primary-light':
        return 'bg-blue-400 hover:bg-blue-500 text-white shadow-lg hover:shadow-xl';
      default:
        return `bg-${color} hover:bg-${color}/90 text-white shadow-lg hover:shadow-xl`;
    }
  };

  // Get button variant based on package type
  const getButtonVariant = () => {
    if (popular) return "secondary";
    if (color === "rose-dark") return "rose-dark";
    if (color === "primary-light") return "primary-light";
    return "default";
  };

  return (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${popular ? 'transform-gpu scale-105 shadow-2xl border-2 border-secondary ring-4 ring-secondary/20' : 'hover:border-primary-light shadow-lg'} bg-white`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-secondary to-secondary-light text-primary px-6 py-2 text-sm font-bold rounded-bl-2xl shadow-lg flex items-center gap-1">
          <Sparkles className="w-4 h-4" />
          Most Popular
        </div>
      )}
      
      <CardHeader className={`pb-4 ${popular ? 'bg-gradient-to-br from-secondary/5 to-secondary-light/5' : ''} relative`}>
        {popular && (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent"></div>
        )}
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-2xl font-bold ${popular ? 'text-secondary' : color === 'rose-dark' ? 'text-rose-500' : color === 'primary-light' ? 'text-blue-400' : `text-${color}`}`}>
              {name}
            </h3>
            {popular && <Star className="w-5 h-5 fill-secondary text-secondary" />}
          </div>
          
          <div className="mb-3">
            <span className="text-5xl font-bold text-gray-900">{price}</span>
            <span className="text-gray-500 ml-1">one-time</span>
          </div>
          
          <p className="text-gray-600 leading-relaxed">{description}</p>
          
          {(tapeCount || photoCount) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-1">What's included:</p>
              <p className="text-sm text-gray-600">
                {tapeCount && `Up to ${tapeCount} tapes`}
                {tapeCount && photoCount && ' OR '}
                {photoCount && `up to ${photoCount} photos`}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-2 pb-8">
        <ul className="space-y-4 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className={`${popular ? 'text-secondary' : color === 'rose-dark' ? 'text-rose-500' : color === 'primary-light' ? 'text-blue-400' : `text-${color}`} mt-0.5 shrink-0`}>
                <Check size={20} className="stroke-[2.5]" />
              </span>
              <span className="text-gray-700 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button 
          variant={getButtonVariant()}
          className={`w-full text-lg py-6 ${getButtonClass()} transition-all duration-300`}
          asChild
        >
          <Link to={`/package-selected?package=${encodeURIComponent(name)}`}>
            Choose {name} Package
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const PackageComparison = () => {
  const packages = [
    {
      name: "Starter",
      price: "$69",
      description: "Perfect for a small collection of precious memories",
      color: "primary",
      tapeCount: "3",
      photoCount: "75",
      features: [
        "High-quality digital conversion",
        "Online access to digital files",
        "Free shipping both ways",
        "Online backup (1 year free)",
        "Professional quality guarantee"
      ]
    },
    {
      name: "Popular",
      price: "$179",
      description: "Our most popular package for growing families",
      color: "secondary",
      tapeCount: "10",
      photoCount: "250",
      popular: true,
      features: [
        "High-quality digital conversion",
        "Online access to digital files", 
        "Free shipping both ways",
        "Online backup (1 year free)",
        "Professional quality guarantee",
        "Priority processing"
      ]
    },
    {
      name: "Dusty Rose",
      price: "$349",
      description: "Great for larger collections and family archives",
      color: "rose-dark",
      tapeCount: "20",
      photoCount: "500",
      features: [
        "High-quality digital conversion",
        "Online access to digital files",
        "Free shipping both ways", 
        "Online backup (1 year free)",
        "Professional quality guarantee",
        "Priority processing"
      ]
    },
    {
      name: "Eternal",
      price: "$599",
      description: "For preserving a lifetime of cherished memories",
      color: "primary-light",
      tapeCount: "40",
      photoCount: "1000",
      features: [
        "High-quality digital conversion",
        "Online access to digital files",
        "Free shipping both ways",
        "Online backup (1 year free)", 
        "Professional quality guarantee",
        "Priority processing",
        "Dedicated support specialist"
      ]
    }
  ];

  return (
    <section id="packages" className="bg-gradient-to-b from-cream/50 to-white py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-secondary" />
            <span className="text-secondary font-medium">Choose Your Package</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary">Preserve Your Legacy</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Select the perfect package to preserve your cherished memories for generations to come. Every package includes our quality guarantee.
          </p>
        </div>

        {/* Conversion Info Banner */}
        <div className="mb-12">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-2 shrink-0">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Mix & Match Your Items</h3>
                <p className="text-blue-800 leading-relaxed">
                  Want to combine tapes and photos? <strong>1 tape = 25 photos</strong> in your package allowance. 
                  For example, if you have a 10-tape package, you could digitize 5 tapes + 125 photos instead.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 relative">
          {packages.map((pkg, index) => (
            <Package
              key={index}
              name={pkg.name}
              price={pkg.price}
              description={pkg.description}
              features={pkg.features}
              popular={pkg.popular}
              color={pkg.color}
              tapeCount={pkg.tapeCount}
              photoCount={pkg.photoCount}
            />
          ))}
        </div>
        
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 bg-primary/5 rounded-full px-6 py-3 border border-primary/10">
            <span className="text-primary font-medium">✨ All packages include our 100% satisfaction guarantee</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PackageComparison;
