import React, { useId } from 'react';

interface BulletIconProps {
  active?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

export const BulletIcon: React.FC<BulletIconProps> = ({
  active = true,
  className = '',
  size = 'md',
  style,
}) => {
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const copperId = `copper-${rawId}`;
  const brassId = `brass-${rawId}`;
  const rimId = `rim-${rawId}`;
  const shineId = `shine-${rawId}`;

  // Dimensions
  const dimensions = {
    sm: 'w-3 h-7 sm:w-3.5 sm:h-8',
    md: 'w-4 h-9 sm:w-4.5 sm:h-10',
    lg: 'w-6 h-14',
  }[size];

  if (!active) {
    return (
      <svg
        viewBox="0 0 20 48"
        style={style}
        className={`${dimensions} transition-all duration-300 opacity-20 filter grayscale ${className}`}
        aria-hidden="true"
      >
        {/* Spent / Empty Cartridge Outline */}
        <path
          d="M 10 1.5 C 6.5 1.8 4.2 7 4.2 15 L 15.8 15 C 15.8 7 13.5 1.8 10 1.5 Z"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="1"
        />
        <rect x="4.2" y="15" width="11.6" height="1.5" fill="#0f172a" />
        <rect
          x="3.6"
          y="16.5"
          width="12.8"
          height="23"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="1"
        />
        <rect x="4.8" y="39.5" width="10.4" height="2.5" fill="#0f172a" />
        <rect
          x="3.2"
          y="42"
          width="13.6"
          height="4"
          rx="1"
          fill="#1e293b"
          stroke="#475569"
          strokeWidth="1"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 20 48"
      style={style}
      className={`${dimensions} transition-all duration-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.55)] ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Copper / Bronze Ogive Bullet Head */}
        <linearGradient id={copperId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="18%" stopColor="#9a3412" />
          <stop offset="38%" stopColor="#ea580c" />
          <stop offset="55%" stopColor="#fed7aa" />
          <stop offset="72%" stopColor="#ea580c" />
          <stop offset="90%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>

        {/* Polished Brass Cartridge Casing */}
        <linearGradient id={brassId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#713f12" />
          <stop offset="16%" stopColor="#a16207" />
          <stop offset="36%" stopColor="#ca8a04" />
          <stop offset="52%" stopColor="#fef08a" />
          <stop offset="68%" stopColor="#eab308" />
          <stop offset="86%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        {/* Extractor Rim */}
        <linearGradient id={rimId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#713f12" />
          <stop offset="25%" stopColor="#ca8a04" />
          <stop offset="50%" stopColor="#fef08a" />
          <stop offset="75%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>

        {/* Vertical Specular Highlight Beam */}
        <linearGradient id={shineId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="85%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* 1. Bullet Head (Copper Ogive) */}
      <path
        d="M 10 1.2 C 6.5 1.5 4.2 7 4.2 15 L 15.8 15 C 15.8 7 13.5 1.5 10 1.2 Z"
        fill={`url(#${copperId})`}
      />

      {/* Bullet Head Curved Specular Reflection */}
      <path
        d="M 10 2.2 C 8.2 2.5 6.6 6.8 6.4 14.5 L 8.4 14.5 C 8.6 7.2 9.4 3.2 10 2.2 Z"
        fill="white"
        opacity="0.45"
      />

      {/* 2. Cannelure / Seating Groove */}
      <rect x="4.2" y="14.8" width="11.6" height="1.6" fill="#451a03" />

      {/* 3. Brass Casing Body */}
      <rect
        x="3.6"
        y="16.4"
        width="12.8"
        height="23.2"
        fill={`url(#${brassId})`}
        stroke="#78350f"
        strokeWidth="0.4"
      />

      {/* Specular Highlight Streak running vertically down the casing */}
      <rect
        x="6.4"
        y="16.8"
        width="2"
        height="22.4"
        fill={`url(#${shineId})`}
        rx="0.5"
      />

      {/* Casing shoulder line accent */}
      <line
        x1="3.8"
        y1="18.2"
        x2="16.2"
        y2="18.2"
        stroke="#fef08a"
        strokeWidth="0.5"
        opacity="0.65"
      />

      {/* 4. Extractor Groove (Recessed slot near base) */}
      <rect x="4.8" y="39.6" width="10.4" height="2.4" fill="#3b1704" />
      <line x1="4.8" y1="40" x2="15.2" y2="40" stroke="#1f0901" strokeWidth="0.6" />

      {/* 5. Extractor Rim Flange */}
      <rect
        x="3.2"
        y="42"
        width="13.6"
        height="3.8"
        rx="0.8"
        fill={`url(#${rimId})`}
        stroke="#78350f"
        strokeWidth="0.4"
      />

      {/* Primer / Rim edge line */}
      <line
        x1="3.4"
        y1="45.2"
        x2="16.6"
        y2="45.2"
        stroke="#451a03"
        strokeWidth="0.6"
      />
    </svg>
  );
};
