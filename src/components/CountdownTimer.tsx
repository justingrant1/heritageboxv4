
import { useState, useEffect } from 'react';
import { Clock, Zap, Gift } from 'lucide-react';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const calculateTimeLeft = (): TimeLeft => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0); // Next midnight
      
      const difference = midnight.getTime() - now.getTime();
      
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      
      return { hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Initialize immediately
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number): string => {
    return time.toString().padStart(2, '0');
  };

  if (!isVisible) return null;

  return (
    <div className="relative mx-4 my-6 md:my-8">
      <div className="bg-gradient-to-r from-secondary via-secondary-light to-secondary rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden border border-secondary/20">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-secondary-light/90"></div>
        <div className="absolute top-0 right-0 w-32 h-32 md:w-40 md:h-40 bg-white/20 rounded-full -translate-y-16 md:-translate-y-20 translate-x-16 md:translate-x-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 md:w-32 md:h-32 bg-white/10 rounded-full translate-y-12 md:translate-y-16 -translate-x-12 md:-translate-x-16"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-full animate-pulse delay-1000"></div>
        
        <div className="relative z-10">
          {/* Enhanced header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="bg-white/30 p-2 md:p-3 rounded-full backdrop-blur-sm">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
              </div>
              <div>
                <span className="text-white font-bold text-base md:text-lg uppercase tracking-wider block">
                  Flash Sale
                </span>
                <span className="text-white/80 text-xs md:text-sm">Ends at midnight</span>
              </div>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white transition-colors text-xl md:text-2xl font-light w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 touch-manipulation"
            >
              ×
            </button>
          </div>

          {/* Enhanced main content */}
          <div className="text-center space-y-4 md:space-y-6">
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Gift className="w-6 h-6 md:w-8 md:h-8 text-white" />
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                  Save 15% on Everything!
                </h3>
              </div>
              
              <div className="inline-flex items-center gap-2 md:gap-3 bg-white/25 backdrop-blur-md rounded-xl md:rounded-2xl px-4 md:px-6 py-2 md:py-3 border border-white/30">
                <span className="text-white text-sm md:text-lg font-medium">Use promo code:</span>
                <div className="bg-white text-secondary font-bold px-3 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl text-sm md:text-lg tracking-wider shadow-lg">
                  SAVE15
                </div>
              </div>
            </div>

            {/* Enhanced countdown display - improved mobile layout */}
            <div className="flex justify-center items-center gap-2 md:gap-6 px-2">
              <div className="bg-white/25 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-6 flex-1 max-w-[90px] md:max-w-[100px] border border-white/30 shadow-lg">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">
                  {formatTime(timeLeft.hours)}
                </div>
                <div className="text-xs md:text-sm text-white/90 uppercase tracking-wide font-medium">
                  Hours
                </div>
              </div>
              
              <div className="text-white/80 text-xl md:text-2xl lg:text-3xl font-light animate-pulse">:</div>
              
              <div className="bg-white/25 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-6 flex-1 max-w-[90px] md:max-w-[100px] border border-white/30 shadow-lg">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tabular-nums mb-1">
                  {formatTime(timeLeft.minutes)}
                </div>
                <div className="text-xs md:text-sm text-white/90 uppercase tracking-wide font-medium">
                  Minutes
                </div>
              </div>
              
              <div className="text-white/80 text-xl md:text-2xl lg:text-3xl font-light animate-pulse">:</div>
              
              <div className="bg-white/25 backdrop-blur-md rounded-xl md:rounded-2xl p-3 md:p-6 flex-1 max-w-[90px] md:max-w-[100px] border border-white/30 shadow-lg">
                <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tabular-nums animate-pulse mb-1">
                  {formatTime(timeLeft.seconds)}
                </div>
                <div className="text-xs md:text-sm text-white/90 uppercase tracking-wide font-medium">
                  Seconds
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
