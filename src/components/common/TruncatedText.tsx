import React, { useEffect, useRef, useState } from 'react';
import { Tooltip } from './Tooltip';

interface TruncatedTextProps {
  text: string;
  lines?: number; // 1 = 单行省略, 2+ = 多行 clamp
  tooltipPlacement?: 'top' | 'bottom' | 'left' | 'right';
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  delay?: number; // tooltip 延迟，默认 300ms
}

/**
 * FIX-M18: 智能截断文本组件
 * - 实际发生截断时才显示 Tooltip
 * - 未截断时不显示，避免多余噪音
 */
export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  lines = 1,
  tooltipPlacement = 'top',
  as: Component = 'span',
  className = '',
  delay = 300,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [canHover, setCanHover] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (lines === 1) {
        setIsOverflowing(el.scrollWidth > el.clientWidth);
      } else {
        setIsOverflowing(el.scrollHeight > el.clientHeight);
      }
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, [text, lines]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    setCanHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  const multilineStyle =
    lines > 1
      ? {
          display: '-webkit-box',
          WebkitLineClamp: lines,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }
      : undefined;

  const baseClasses = lines === 1 ? 'block min-w-0 truncate whitespace-nowrap' : 'block min-w-0';

  const content = (
    <span ref={containerRef} className="block min-w-0">
      <Component
        className={`${baseClasses} ${className}`}
        style={multilineStyle}
        title={isOverflowing ? undefined : text}
        aria-label={text}
      >
        {text}
      </Component>
    </span>
  );

  if (isOverflowing && canHover) {
    return (
      <Tooltip content={text} placement={tooltipPlacement} delay={delay}>
        {content}
      </Tooltip>
    );
  }

  return content;
};
