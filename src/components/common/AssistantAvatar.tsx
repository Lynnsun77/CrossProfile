import React from 'react';

interface AssistantAvatarProps {
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

export const AssistantAvatar: React.FC<AssistantAvatarProps> = ({
  size = 'medium',
  animated = true,
}) => {
  const sizeClasses = {
    small: 'w-7 h-7',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const svgSize = {
    small: 28,
    medium: 48,
    large: 64,
  };

  return (
    <div className={`${sizeClasses[size]} ${animated ? 'animate-breathe' : ''}`}>
      <svg width={svgSize[size]} height={svgSize[size]} viewBox="0 0 120 120" fill="none">
        {/* Body */}
        <rect x="15" y="15" width="90" height="90" rx="25" fill="var(--assistant-shell-fill)" stroke="var(--assistant-shell-stroke)" strokeWidth="3"/>
        
        {/* Face */}
        <rect x="28" y="28" width="64" height="64" rx="20" fill="var(--assistant-face-fill)" stroke="var(--assistant-shell-stroke)" strokeWidth="2"/>
        
        {/* Glasses */}
        <rect x="36" y="42" width="48" height="28" rx="12" fill="var(--assistant-panel-fill)" stroke="var(--assistant-shell-stroke)" strokeWidth="2"/>
        <circle cx="52" cy="56" r="8" fill="var(--assistant-eye-fill)"/>
        <circle cx="68" cy="56" r="8" fill="var(--assistant-eye-fill)"/>
        <circle cx="54" cy="54" r="3" fill="white"/>
        <circle cx="70" cy="54" r="3" fill="white"/>
        
        {/* Nose */}
        <path d="M60 58 L56 70 L64 70 Z" fill="var(--assistant-panel-fill)" stroke="var(--assistant-shell-stroke)" strokeWidth="1.5"/>
        
        {/* Smile */}
        <path d="M48 76 Q60 86 72 76" stroke="var(--assistant-shell-stroke)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        
        {/* Left arm */}
        <path d="M15 60 Q5 60 5 70 L8 90 L28 88" stroke="var(--assistant-shell-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <ellipse cx="8" cy="92" rx="10" ry="8" fill="var(--assistant-limb-fill)" stroke="var(--assistant-shell-stroke)" strokeWidth="2"/>
        
        {/* Right arm (waving) */}
        <path d="M105 50 Q118 45 115 30" stroke="var(--assistant-shell-stroke)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <ellipse cx="116" cy="28" rx="8" ry="10" fill="var(--assistant-limb-fill)" stroke="var(--assistant-shell-stroke)" strokeWidth="2"/>
        
        {/* Fingers on right hand */}
        <path d="M110 18 Q108 10 112 6" stroke="var(--assistant-shell-stroke)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M116 16 Q116 8 120 6" stroke="var(--assistant-shell-stroke)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M122 20 Q124 14 122 10" stroke="var(--assistant-shell-stroke)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        
        {/* Legs */}
        <rect x="38" y="102" width="18" height="12" rx="6" fill="var(--assistant-limb-fill)" stroke="var(--assistant-shell-stroke)" strokeWidth="2"/>
        <rect x="64" y="102" width="18" height="12" rx="6" fill="var(--assistant-limb-fill)" stroke="var(--assistant-shell-stroke)" strokeWidth="2"/>
      </svg>
    </div>
  );
};
