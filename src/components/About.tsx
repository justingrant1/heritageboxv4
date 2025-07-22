
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <section id="about" className="bg-primary text-white py-20 md:py-32">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-gradient">About HeritageBox<sup className="text-xs align-super">®</sup></h2>
            <p className="mb-6 text-lg font-light">
              HeritageBox<sup className="text-xs align-super">®</sup> was founded with a simple mission: to help people preserve and share their most precious memories for generations to come.
            </p>
            <p className="mb-6 text-base font-light">
              We understand that your old photos, VHS tapes, film reels, and slides aren't just media—they're irreplaceable treasures that tell your family's unique story. That's why our team of skilled technicians treats every item with the utmost care and attention.
            </p>
            <p className="mb-8 text-base font-light">
              With decades of combined experience in media preservation and digital conversion, we've helped thousands of families across America save their memories from deterioration and make them accessible for future generations.
            </p>
            <Link to="/about-us">
              <Button className="bg-secondary text-primary hover:bg-secondary-light font-medium px-8 py-6 h-auto text-base">
                Learn More About Us
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300">
                <AspectRatio ratio={4/3}>
                  <img 
                    src="/lovable-uploads/49950c00-87a9-4b47-ab2b-ac89e4f79cb3.png" 
                    alt="Photo collection protected by security shield" 
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300">
                <AspectRatio ratio={4/3}>
                  <img 
                    src="/lovable-uploads/c9c3910b-c1ef-4cb5-9a7e-e1df6afdf7f3.png" 
                    alt="Family looking at photo album together" 
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
            </div>
            <div className="space-y-4 mt-8">
              <div className="rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300">
                <AspectRatio ratio={4/3}>
                  <img 
                    src="/lovable-uploads/ddab1909-1056-4ba3-b659-01c0cd97369f.png" 
                    alt="VHS tape and photographs" 
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
              <div className="rounded-lg overflow-hidden shadow-lg transition-transform hover:scale-105 duration-300">
                <AspectRatio ratio={4/3}>
                  <img 
                    src="/lovable-uploads/b448b3fc-ae42-4ba5-b66a-caecc548b7dc.png" 
                    alt="Technician digitizing media" 
                    className="object-cover w-full h-full"
                  />
                </AspectRatio>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
