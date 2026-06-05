import { useEffect, useRef, memo } from 'react';

function EconomicCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear the container to prevent multiple script injections during re-renders
    containerRef.current.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container__widget';
    wrapper.style.height = '100%';
    wrapper.style.width = '100%';
    
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "450",
      locale: "th-TH",
      importanceFilter: "-1,0,1", // High and Medium importance
      countryFilter: "us,eu,gb,jp,au,ca,nz,ch" // Major economies for Forex
    });

    containerRef.current.appendChild(wrapper);
    containerRef.current.appendChild(script);

  }, []);

  return (
    <div className="w-full bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg mt-6">
      <div className="p-3 border-b border-slate-700 bg-slate-800/80">
        <h3 className="text-sm font-bold text-slate-300 flex items-center">
          📅 Economic Calendar
          <span className="ml-2 text-[10px] font-normal text-slate-500">Check for High Impact news before trading</span>
        </h3>
      </div>
      <div 
        className="tradingview-widget-container" 
        ref={containerRef} 
        style={{ height: '450px', width: '100%' }}
      >
      </div>
    </div>
  );
}

export default memo(EconomicCalendar);
