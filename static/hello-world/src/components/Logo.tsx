import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, showText = false, className = '' }) => {
  return (
    <div className={`parallelos-logo-container ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.45)) drop-shadow(0 0 10px rgba(16, 185, 129, 0.45))' }}
      >
        <defs>
          <linearGradient id="pOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="100%" stopColor="#ea580c" />
          </linearGradient>
          <linearGradient id="pGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="pGlowGrad" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.5" />
          </linearGradient>
        </defs>

        {/* Ambient Ring */}
        <circle cx="24" cy="24" r="22" stroke="url(#pGlowGrad)" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7" />

        {/* Left Track (Orange Branch) */}
        <path
          d="M14 38V22C14 16 18 12 24 12"
          stroke="url(#pOrangeGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Right Track (Green Branch) */}
        <path
          d="M34 38V22C34 16 30 12 24 12"
          stroke="url(#pGreenGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Center Branch Stem */}
        <path
          d="M24 12V6"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Parallel Baseline Tracks */}
        <line x1="18" y1="26" x2="18" y2="38" stroke="url(#pOrangeGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <line x1="30" y1="26" x2="30" y2="38" stroke="url(#pGreenGrad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

        {/* Cross Quantum Bridge */}
        <path d="M14 26H34" stroke="url(#pGlowGrad)" strokeWidth="1.5" strokeDasharray="2 2" />

        {/* Scenario Future Nodes */}
        <circle cx="14" cy="38" r="3.5" fill="#f97316" />
        <circle cx="18" cy="38" r="2" fill="#fb923c" />
        <circle cx="30" cy="38" r="2" fill="#34d399" />
        <circle cx="34" cy="38" r="3.5" fill="#10b981" />
        <circle cx="24" cy="12" r="3.5" fill="#ffffff" />
        <circle cx="24" cy="6" r="2" fill="#34d399" />
      </svg>
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ 
            fontSize: `${size * 0.58}px`, 
            fontWeight: 800, 
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #f97316 0%, #fb923c 40%, #34d399 75%, #10b981 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1
          }}>
            ParallelOS
          </span>
          <span style={{ 
            fontSize: `${Math.max(9, size * 0.28)}px`, 
            color: '#10b981', 
            fontWeight: 600, 
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Digital Twin OS
          </span>
        </div>
      )}
    </div>
  );
};
