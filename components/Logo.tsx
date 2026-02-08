
import React from 'react';
import { Play, Mic, BookOpen, Circle } from 'lucide-react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  light?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "", showTagline = false, light = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* De iconische "E" blok */}
      <div className="relative w-12 h-12 bg-brand-green rounded-sm flex flex-col justify-between p-1 shadow-sm overflow-hidden shrink-0">
        {/* Witte swoosh in het midden */}
        <div className="absolute top-1/2 left-[-10%] w-[120%] h-[2px] bg-white/40 -rotate-6 transform -translate-y-1/2"></div>
        
        {/* Bovenste bar iconen */}
        <div className="flex justify-center items-center h-1/3">
          <div className="bg-white rounded-full p-0.5">
             <Circle size={10} className="text-brand-green fill-brand-green" />
          </div>
        </div>

        {/* Onderste bar iconen */}
        <div className="flex justify-around items-center h-1/3 px-0.5">
          <Mic size={10} className="text-white" />
          <BookOpen size={10} className="text-white" />
          <Play size={10} className="text-white fill-white" />
        </div>
      </div>

      {/* Tekst Branding */}
      <div className="flex flex-col leading-none">
        <div className="text-2xl font-black tracking-tight">
          <span className="text-brand-green">Elftal</span>
          <span className={light ? "text-white" : "text-brand-dark"}>manager</span>
        </div>
        {showTagline && (
          <div className={`text-[8px] font-bold tracking-[0.2em] mt-1 ${light ? "text-white/70" : "text-slate-500"}`}>
            TRAINING. ARTIKELEN. PODCAST.
          </div>
        )}
      </div>
    </div>
  );
};

export default Logo;
