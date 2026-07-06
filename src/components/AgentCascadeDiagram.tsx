'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AgentCascadeDiagram() {
  const [activeStage, setActiveStage] = useState(0); // 0 = Screener, 1 = Forensic, 2 = Judge
  const [reducedMotion, setReducedMotion] = useState(false);
  // Only set after mount to avoid SSR/client mismatch on window.innerWidth
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timer = setTimeout(() => {
      setReducedMotion(mediaQuery.matches);
      // Detect desktop after mount — safe from SSR
      setIsDesktop(window.innerWidth >= 768);
    }, 0);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    mediaQuery.addEventListener('change', onMotionChange);
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % 3);
    }, 1000);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  const pulseVariant = {
    animate: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  // Dot travel direction — horizontal on desktop, vertical on mobile
  // Both values are safe because this only renders client-side (after mount)
  const dotInitial = isDesktop
    ? { left: '0%', top: '50%', y: '-50%', x: 0 }
    : { top: '0%', left: '50%', x: '-50%', y: 0 };
  const dotAnimate = isDesktop
    ? { left: '100%', top: '50%', y: '-50%', x: 0 }
    : { top: '100%', left: '50%', x: '-50%', y: 0 };

  const getScreenerStyle = () => {
    if (reducedMotion) return 'border-green bg-green/5 shadow-[0_0_15px_rgba(0,255,136,0.1)]';
    return activeStage === 0
      ? 'border-green bg-green/10 shadow-[0_0_20px_rgba(0,255,136,0.2)]'
      : 'border-border bg-surface';
  };

  const getForensicStyle = () => {
    if (reducedMotion) return 'border-yellow bg-yellow/5 shadow-[0_0_15px_rgba(245,197,24,0.1)]';
    return activeStage === 1
      ? 'border-yellow bg-yellow/10 shadow-[0_0_20px_rgba(245,197,24,0.2)]'
      : 'border-border bg-surface';
  };

  const getJudgeStyle = () => {
    if (reducedMotion) return 'border-red bg-red/5 shadow-[0_0_15px_rgba(255,59,59,0.1)]';
    return activeStage === 2
      ? 'border-red bg-red/10 shadow-[0_0_20px_rgba(255,59,59,0.2)]'
      : 'border-border bg-surface';
  };

  return (
    <div className="w-full py-10 select-none">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 relative max-w-[1000px] mx-auto">

        {/* NODE 1: SCREENER */}
        <motion.div
          variants={pulseVariant}
          animate={reducedMotion ? {} : 'animate'}
          className={`w-full md:w-[280px] p-6 border transition-all duration-300 flex flex-col justify-between min-h-[200px] relative z-10 ${getScreenerStyle()}`}
        >
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-widest text-zinc-400 font-bold uppercase">AGENT 01</div>
            <h3 className="mb-2 font-sans text-lg font-bold text-white">Real-Time Screener</h3>
            <span className="inline-block border border-green/30 bg-green/5 text-green px-2 py-0.5 font-mono text-[10px] mb-3">
              DeepSeek V4 Flash · via BTL
            </span>
            <p className="font-sans text-xs text-zinc-300 leading-relaxed">
              Screens incoming blocks for transfer size, volume spikes, and wallet shifts at near-zero cost.
            </p>
          </div>
          <div className="mt-4 border-t border-border pt-2.5 font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
            Trigger: Every Batch · Output: Flag
          </div>
        </motion.div>

        {/* CONNECTION LINE 1 */}
        <div className="w-2 md:w-auto md:flex-1 h-12 md:h-1 relative flex items-center justify-center">
          <div className="absolute left-1/2 md:left-0 top-0 md:top-1/2 -translate-x-1/2 md:translate-x-0 -translate-y-1/2 w-0.5 md:w-full h-full md:h-0.5 bg-border" />
          {/* Only render animated dot after mount (client-only) */}
          {!reducedMotion && activeStage === 0 && isDesktop !== undefined && (
            <motion.div
              key={`dot1-${activeStage}`}
              initial={dotInitial}
              animate={dotAnimate}
              transition={{ duration: 1, ease: 'linear' as const }}
              className="absolute h-2 w-2 rounded-full bg-green shadow-[0_0_8px_#00ff88]"
            />
          )}
        </div>

        {/* NODE 2: FORENSIC */}
        <motion.div
          variants={pulseVariant}
          animate={reducedMotion ? {} : 'animate'}
          className={`w-full md:w-[280px] p-6 border transition-all duration-300 flex flex-col justify-between min-h-[200px] relative z-10 ${getForensicStyle()}`}
        >
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-widest text-zinc-400 font-bold uppercase">AGENT 02</div>
            <h3 className="mb-2 font-sans text-lg font-bold text-white">Forensic Analyst</h3>
            <span className="inline-block border border-yellow/30 bg-yellow/5 text-yellow px-2 py-0.5 font-mono text-[10px] mb-3">
              GPT-4o mini · via BTL
            </span>
            <p className="font-sans text-xs text-zinc-300 leading-relaxed">
              Traces deployer wallet history, locked liquidity, token approval signatures, and known rug patterns.
            </p>
          </div>
          <div className="mt-4 border-t border-border pt-2.5 font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
            Trigger: Screener Flag · Output: Matrix
          </div>
        </motion.div>

        {/* CONNECTION LINE 2 */}
        <div className="w-2 md:w-auto md:flex-1 h-12 md:h-1 relative flex items-center justify-center">
          <div className="absolute left-1/2 md:left-0 top-0 md:top-1/2 -translate-x-1/2 md:translate-x-0 -translate-y-1/2 w-0.5 md:w-full h-full md:h-0.5 bg-border" />
          {!reducedMotion && activeStage === 1 && isDesktop !== undefined && (
            <motion.div
              key={`dot2-${activeStage}`}
              initial={dotInitial}
              animate={dotAnimate}
              transition={{ duration: 1, ease: 'linear' as const }}
              className="absolute h-2 w-2 rounded-full bg-yellow shadow-[0_0_8px_#f5c518]"
            />
          )}
        </div>

        {/* NODE 3: JUDGE */}
        <motion.div
          variants={pulseVariant}
          animate={reducedMotion ? {} : 'animate'}
          className={`w-full md:w-[280px] p-6 border transition-all duration-300 flex flex-col justify-between min-h-[200px] relative z-10 ${getJudgeStyle()}`}
        >
          <div>
            <div className="mb-2 font-mono text-[10px] tracking-widest text-zinc-400 font-bold uppercase">AGENT 03</div>
            <h3 className="mb-2 font-sans text-lg font-bold text-white">Tactical Judge</h3>
            <span className="inline-block border border-red/30 bg-red/5 text-red px-2 py-0.5 font-mono text-[10px] mb-3">
              DeepSeek V4 Pro · via BTL
            </span>
            <p className="font-sans text-xs text-zinc-300 leading-relaxed">
              Consolidates forensics findings, resolves risk scores, writes verdict summaries, and triggers alert webhooks.
            </p>
          </div>
          <div className="mt-4 border-t border-border pt-2.5 font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
            Trigger: Critical Threat · Output: Verdict
          </div>
        </motion.div>

      </div>
    </div>
  );
}
