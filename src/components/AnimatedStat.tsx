'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface AnimatedStatProps {
  targetValue: number;
  prefix?: string;
  suffix?: string;
  label: string;
}

export default function AnimatedStat({ targetValue, prefix = '', suffix = '', label }: AnimatedStatProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animatedRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const startAnimation = useCallback(() => {
    const duration = 1200; // 1.2 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOutProgress * targetValue);

      setValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setValue(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }, [targetValue]);

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
        setValue(targetValue);
      }, 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true;
          startAnimation();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [targetValue, reducedMotion, startAnimation]);

  return (
    <div ref={ref} className="border-r border-border p-6 last:border-r-0 flex flex-col justify-center min-h-[110px] hover:bg-white/[0.01] transition-colors">
      <span className="block font-mono text-4xl font-black text-white mb-1.5">
        {prefix}{value}{suffix}
      </span>
      <span className="font-mono text-xs uppercase tracking-widest text-zinc-400 font-bold">{label}</span>
    </div>
  );
}
