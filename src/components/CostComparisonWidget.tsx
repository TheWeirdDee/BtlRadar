'use client';

import { useState, useEffect } from 'react';

export default function CostComparisonWidget() {
  const [withoutCost, setWithoutCost] = useState(0);
  const [withCost, setWithCost] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timer = setTimeout(() => {
      setReducedMotion(mediaQuery.matches);
    }, 0);
    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', listener);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(() => {
        setWithoutCost(150.0);
        setWithCost(1.5);
      }, 0);
      return () => clearTimeout(timer);
    }

    const intervalTime = 50; // 50ms ticks
    const duration = 8000; // 8 seconds cycle
    const totalTicks = duration / intervalTime;

    const maxWithout = 150.0;
    const maxWith = 1.5;

    const stepWithout = maxWithout / totalTicks;
    const stepWith = maxWith / totalTicks;

    let currentTick = 0;

    const timer = setInterval(() => {
      currentTick++;

      if (currentTick >= totalTicks) {
        // Reset cycle
        setWithoutCost(0);
        setWithCost(0);
        currentTick = 0;
      } else {
        setWithoutCost(currentTick * stepWithout);
        setWithCost(currentTick * stepWith);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [reducedMotion]);

  // Compute visual width percentages (max width for red bar is 100%, green bar is 1% at end)
  const maxBarWidth = 100;
  const currentWithoutWidth = Math.min((withoutCost / 150.0) * maxBarWidth, 100);
  const currentWithWidth = Math.min((withCost / 150.0) * maxBarWidth, 100);

  return (
    <section className="py-16 px-6 md:px-12 max-w-[1100px] mx-auto border-b border-border select-none">
      <div className="border border-border bg-surface/40 p-8 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm">
        
        {/* Left Side: Copy */}
        <div className="flex-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-3">
            Real-Time Cost Simulator
          </span>
          <h3 className="font-sans text-2xl font-bold text-white mb-4">
            Watch the Cost Gap Widen
          </h3>
          <p className="font-sans text-sm text-zinc-300 leading-relaxed font-normal max-w-[480px]">
            Without BTL Runtime, every transaction screens against a full reasoning model. 
            BTL channels only flagged events to deep reasoning, yielding a 99% reduction in API spend.
          </p>
        </div>

        {/* Right Side: Bars and numbers */}
        <div className="w-full md:w-[480px] bg-black/40 border border-border p-6 flex flex-col gap-6 font-mono text-xs">
          
          {/* Without BTL Column */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-red font-semibold uppercase tracking-wider text-[10px]">
              <span>Without BTL Runtime (Raw Endpoint)</span>
              <span className="text-sm font-bold">${withoutCost.toFixed(2)}</span>
            </div>
            {/* Red Bar container */}
            <div className="h-2 w-full bg-zinc-900 border border-zinc-800">
              <div 
                className="h-full bg-red transition-all duration-75"
                style={{ width: `${currentWithoutWidth}%` }}
              />
            </div>
          </div>

          {/* With BTL Column */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-green font-semibold uppercase tracking-wider text-[10px]">
              <span>With BTL Radar (Cascading Pipeline)</span>
              <span className="text-sm font-bold text-mustard">${withCost.toFixed(2)}</span>
            </div>
            {/* Green Bar container */}
            <div className="h-2 w-full bg-zinc-900 border border-zinc-800">
              <div 
                className="h-full bg-green transition-all duration-75"
                style={{ width: `${Math.max(currentWithWidth, 1.5)}%` }} // keep a tiny visual sliver
              />
            </div>
          </div>

          {/* Visual indicator details */}
          <div className="border-t border-border pt-3 flex justify-between items-center text-[10px] text-zinc-500">
            <span>SAVINGS DELTA: ${(withoutCost - withCost).toFixed(2)}</span>
            <span className="text-mustard font-bold uppercase">
              {withoutCost > 0 ? `${((1 - withCost / withoutCost) * 100).toFixed(1)}% SAVED` : '99.0% SAVED'}
            </span>
          </div>

        </div>

      </div>
    </section>
  );
}
