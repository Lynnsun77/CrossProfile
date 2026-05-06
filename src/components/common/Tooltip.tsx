import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
  // Backward compatible: prefer `position`, allow `placement` alias.
  position?: 'top' | 'bottom' | 'left' | 'right';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  maxWidth = 360,
  position = 'top',
  placement,
  disabled = false,
  delay = 0,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [positionStyles, setPositionStyles] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const delayTimerRef = useRef<number>();

  const resolvedPosition = placement ?? position;

  useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let top = 0;
      let left = 0;

      switch (resolvedPosition) {
        case 'top':
          top = -tooltipRect.height - 8;
          left = containerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = containerRect.height + 8;
          left = containerRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = containerRect.height / 2 - tooltipRect.height / 2;
          left = -tooltipRect.width - 8;
          break;
        case 'right':
          top = containerRect.height / 2 - tooltipRect.height / 2;
          left = containerRect.width + 8;
          break;
      }

      setPositionStyles({ top, left });
    }
  }, [isVisible, resolvedPosition]);

  useEffect(() => {
    return () => {
      if (delayTimerRef.current) {
        window.clearTimeout(delayTimerRef.current);
      }
    };
  }, []);

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => {
        if (delayTimerRef.current) {
          window.clearTimeout(delayTimerRef.current);
        }
        if (delay > 0) {
          delayTimerRef.current = window.setTimeout(() => setIsVisible(true), delay);
        } else {
          setIsVisible(true);
        }
      }}
      onMouseLeave={() => {
        if (delayTimerRef.current) {
          window.clearTimeout(delayTimerRef.current);
        }
        setIsVisible(false);
      }}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-[9999] px-3 py-2 bg-text-1 text-white text-sm rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 pointer-events-none"
          style={{
            maxWidth,
            top: positionStyles.top,
            left: positionStyles.left,
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
          role="tooltip"
        >
          {content}
          {/* 箭头 */}
          <div
            className="absolute w-2 h-2 bg-text-1 transform rotate-45"
            style={{
              [resolvedPosition]: '-4px',
              left: resolvedPosition === 'top' || resolvedPosition === 'bottom' ? '50%' : undefined,
              top: resolvedPosition === 'left' || resolvedPosition === 'right' ? '50%' : undefined,
              marginLeft: resolvedPosition === 'top' || resolvedPosition === 'bottom' ? '-4px' : undefined,
              marginTop: resolvedPosition === 'left' || resolvedPosition === 'right' ? '-4px' : undefined,
            }}
          />
        </div>
      )}
    </div>
  );
};
