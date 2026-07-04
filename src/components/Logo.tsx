import React from 'react';

export default function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Concentric radar sweeping arcs */}
      <path d="M4.93 4.93a10 10 0 0 1 14.14 0" className="text-mustard opacity-40" />
      <path d="M8.46 8.46a5 5 0 0 1 7.07 0" className="text-mustard opacity-75" />
      
      {/* Center target circle */}
      <circle cx="12" cy="12" r="1.5" className="fill-mustard stroke-mustard" />
      
      {/* Vertical & Horizontal crosshair targeting guides */}
      <line x1="12" y1="2" x2="12" y2="22" className="stroke-mustard/20" />
      <line x1="2" y1="12" x2="22" y2="12" className="stroke-mustard/20" />
    </svg>
  );
}
