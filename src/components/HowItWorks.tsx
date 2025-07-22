
import { Package, Upload, Archive, ArrowRight } from 'lucide-react';

const StepCard = ({ 
  number, 
  title, 
  description, 
  icon: Icon,
  isLast = false
}: { 
  number: number; 
  title: string; 
  description: string; 
  icon: any;
  isLast?: boolean;
}) => {
  return (
    <div className="flex flex-col items-center text-center relative">
      {/* Improved connection line */}
      {!isLast && (
        <div className="hidden lg:block absolute top-10 left-1/2 w-full h-px bg-gradient-to-r from-secondary/50 via-secondary to-secondary/50 z-0">
          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2">
            <ArrowRight className="w-5 h-5 text-secondary bg-white rounded-full p-1 shadow-sm" />
          </div>
        </div>
      )}
      
      <div className="relative z-10 mb-6">
        <div className="bg-gradient-to-br from-secondary via-secondary-light to-secondary/80 rounded-3xl w-20 h-20 flex items-center justify-center mb-4 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-secondary/20">
          <Icon size={32} className="text-primary drop-shadow-sm" />
        </div>
        <div className="bg-gradient-to-br from-primary to-primary-light text-white rounded-full w-8 h-8 flex items-center justify-center -mt-10 ml-12 shadow-lg font-bold text-sm border-2 border-white">
          {number}
        </div>
      </div>
      
      <div className="space-y-4 max-w-sm">
        <h3 className="text-2xl font-bold text-primary leading-tight">{title}</h3>
        <p className="text-gray-600 leading-relaxed text-base">{description}</p>
      </div>
    </div>
  );
};

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Pack Your Memories",
      description: "Select your package, then gather and pack your media in our custom secure box with tracking.",
      icon: Package
    },
    {
      number: 2,
      title: "We Digitize Everything",
      description: "Our expert technicians carefully handle and digitize your precious memories using professional equipment.",
      icon: Upload
    },
    {
      number: 3,
      title: "Enjoy & Share Forever",
      description: "Access your digitized memories online and through included media. Share with family and friends easily.",
      icon: Archive
    }
  ];

  return (
    <section id="how-it-works" className="section-padding bg-gradient-to-b from-white to-cream/30">
      <div className="container mx-auto container-padding">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-secondary/10 rounded-full px-6 py-3 mb-6 border border-secondary/20">
            <span className="text-secondary font-semibold">Simple Process</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Preserving your memories is easy with our simple 3-step process. We handle everything with care and precision.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8 relative max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <StepCard 
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
        
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-3 bg-primary/5 rounded-full px-8 py-4 border border-primary/10 shadow-sm">
            <span className="text-2xl">🔒</span>
            <span className="text-primary font-medium">Your memories are safe with us - fully insured shipping both ways</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
