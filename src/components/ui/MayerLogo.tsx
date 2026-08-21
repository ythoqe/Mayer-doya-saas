import React from 'react';

interface MayerLogoProps {
  size?: number;
  className?: string;
  variant?: 'color' | 'white';
}

export const MayerLogo: React.FC<MayerLogoProps> = ({ size = 38, className = '', variant = 'color' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform transition-transform duration-300 hover:rotate-6"
      >
        <defs>
          <linearGradient id="mayerTealGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0B9FA5" />
            <stop offset="50%" stopColor="#16B8B0" />
            <stop offset="100%" stopColor="#8178F2" />
          </linearGradient>
          <linearGradient id="mayerWaveGrad" x1="12" y1="14" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DDF4F3" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>
          <filter id="mayerGlow" x="0" y="0" width="48" height="48" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Dye Flow */}
        <rect x="4" y="4" width="40" height="40" rx="14" fill="url(#mayerTealGrad)" />
        
        {/* Soft textile weave ripple path */}
        <path
          d="M14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24C34 29.5228 29.5228 34 24 34C18.4772 34 14 29.5228 14 24Z"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />

        {/* Dynamic Water & Dye Swirl Wave */}
        <path
          d="M16 26C18.5 22 21.5 22 24 25C26.5 28 29.5 28 32 24"
          stroke={variant === 'white' ? '#FFFFFF' : '#FFFFFF'}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M18 19C20.5 16.5 23 16.5 25 18.5C27 20.5 29.5 20.5 31 18"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Concentric Center Drop */}
        <circle cx="24" cy="30" r="2.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
