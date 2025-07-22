
import { Button } from "@/components/ui/button";
import { Package, ArrowRight, Gift } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  const scrollToPackages = () => {
    const element = document.querySelector('#packages');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="section-padding bg-gradient-to-br from-primary via-primary-light to-primary relative overflow-hidden">
      <div className="container mx-auto container-padding relative z-10">
        <div className="bg-white rounded-3xl p-8 md:p-16 shadow-2xl border border-white/20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-4 py-2">
                  <Gift className="w-4 h-4 text-secondary" />
                  <span className="text-secondary font-medium text-sm">Limited Time Offer</span>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold text-primary leading-tight">
                  Ready to Preserve Your Memories?
                </h2>
                
                <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                  Get started today and save 15% on your first order. Let us help you digitize and preserve your irreplaceable memories for future generations.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/package-selected?package=Popular">
                  <Button className="bg-secondary hover:bg-secondary-light text-primary text-lg px-8 py-4 h-auto flex items-center gap-3 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Package size={20} />
                    Get Your Box
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white text-lg px-8 py-4 h-auto transition-all duration-300"
                  onClick={scrollToPackages}
                >
                  View All Packages
                </Button>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-cream to-cream/80 rounded-2xl p-8 shadow-lg border border-cream/50">
              <div className="text-center space-y-4">
                <div className="bg-secondary/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-secondary" />
                </div>
                
                <h3 className="text-2xl font-bold text-primary">Save 15% Today!</h3>
                
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <p className="text-gray-600 mb-2">Use promo code:</p>
                  <div className="bg-secondary text-primary font-bold text-xl px-4 py-2 rounded-lg tracking-wider">
                    SAVE15
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 leading-relaxed">
                  *Valid for new customers only. Offer expires daily at midnight and resets automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-secondary/40 to-rose/30 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-primary-light/40 to-secondary/40 rounded-full filter blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-white/10 rounded-full filter blur-2xl"></div>
    </section>
  );
};

export default CTA;
