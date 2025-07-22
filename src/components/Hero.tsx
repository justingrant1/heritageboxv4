
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "react-router-dom";
import { Star, Shield, Award } from "lucide-react";

const Hero = () => {
  return (
    <section className="pt-20 pb-16 bg-gradient-to-br from-cream via-cream to-cream/80 relative overflow-hidden">
      <div className="container mx-auto container-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="z-10 space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-secondary/10 backdrop-blur-sm rounded-full px-4 py-2 border border-secondary/20">
                <Award className="w-4 h-4 text-secondary" />
                <span className="text-sm font-medium text-secondary">Trusted by 10,000+ families</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-primary">
                Preserve Your <br />
                <span className="text-secondary relative">
                  Precious Memories
                  <div className="absolute -bottom-2 left-0 w-full h-3 bg-secondary/20 -skew-x-12 -z-10"></div>
                </span>
                <br />Forever
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed max-w-xl">
                We digitize your VHS tapes, photos, and other media to keep your memories safe for generations to come.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/package-selected?package=Popular" className="inline-block">
                <Button className="bg-primary text-white hover:bg-primary/90 text-lg px-8 py-4 h-auto touch-manipulation select-none active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Get Started Today
                </Button>
              </Link>
              <Link to="/#how-it-works" className="inline-block">
                <Button 
                  variant="outline"
                  className="border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-white text-lg px-8 py-4 h-auto touch-manipulation select-none active:scale-95 transition-all duration-200"
                >
                  See How It Works
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-secondary to-secondary-light border-3 border-white shadow-lg"></div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light border-3 border-white shadow-lg"></div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose to-rose-dark border-3 border-white shadow-lg"></div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-secondary text-secondary" />
                    ))}
                    <span className="ml-2 font-semibold text-gray-900">4.9/5</span>
                  </div>
                  <p className="text-gray-600 font-medium">10,000+ happy customers</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-primary">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">100% Secure & Insured</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-primary/20 rounded-3xl transform rotate-3 scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-tl from-rose/20 to-secondary/20 rounded-3xl transform -rotate-2 scale-95"></div>
            <div className="relative bg-white p-8 rounded-3xl shadow-2xl backdrop-blur-sm border border-white/50">
              <div className="rounded-2xl mb-6 overflow-hidden shadow-lg">
                <AspectRatio ratio={16/9} className="bg-gray-100">
                  <img 
                    src="/lovable-uploads/ad279416-58a2-4b0d-8d54-d7ef25d60e52.png" 
                    alt="Family gathered around TV watching digitized memories from HeritageBox conversion service" 
                    className="object-cover w-full h-full"
                    loading="eager" 
                    fetchPriority="high"
                  />
                </AspectRatio>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <AspectRatio ratio={1/1}>
                    <img 
                      src="/lovable-uploads/2d60a6ef-6368-475b-9e4f-86789351e721.png" 
                      alt="Vintage VHS tape labeled Summer '94 ready for digitization service" 
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      loading="eager"
                    />
                  </AspectRatio>
                </div>
                <div className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <AspectRatio ratio={1/1}>
                    <img 
                      src="/lovable-uploads/f857465b-320f-4fe1-b778-9a8b0e233ce3.png" 
                      alt="Collection of vintage family photographs ready for professional scanning and preservation" 
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      loading="eager"
                    />
                  </AspectRatio>
                </div>
                <div className="overflow-hidden rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                  <AspectRatio ratio={1/1}>
                    <img 
                      src="/lovable-uploads/f089a63b-496c-42fc-97d1-fd43f38c9525.png" 
                      alt="Professional digitization process showing VHS conversion to digital format using specialized equipment" 
                      className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                      loading="eager"
                    />
                  </AspectRatio>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced decorative elements */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-gradient-to-br from-secondary/30 to-rose/20 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-primary/20 to-secondary/30 rounded-full filter blur-3xl"></div>
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-rose/20 rounded-full filter blur-2xl"></div>
    </section>
  );
};

export default Hero;
