import React, { useRef, useState, useEffect } from 'react';
import { Opportunity } from '../../types';
import { Tooltip } from './Tooltip';
import { formatLargeNumber, formatCurrency } from '../../lib/format';

interface OpportunityCardProps {
  opp: Opportunity;
  onClick?: (opp: Opportunity) => void;
}

const priorityConfig = {
  high: {
    bg: 'bg-[rgba(239,68,68,.10)]',
    fg: 'text-[#EF4444]',
    label: '高',
    dotBg: 'bg-[#EF4444]',
  },
  mid: {
    bg: 'bg-[rgba(245,158,11,.10)]',
    fg: 'text-[#F59E0B]',
    label: '中',
    dotBg: 'bg-[#F59E0B]',
  },
  low: {
    bg: 'bg-[rgba(16,185,129,.10)]',
    fg: 'text-[#10B981]',
    label: '低',
    dotBg: 'bg-[#10B981]',
  },
};

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opp, onClick }) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const [isTitleTruncated, setIsTitleTruncated] = useState(false);
  const [isDescTruncated, setIsDescTruncated] = useState(false);
  
  // 兼容旧数据结构
  const priority = opp.priority || opp.urgency || 'mid';
  const config = priorityConfig[priority as keyof typeof priorityConfig];
  const recommenderName = opp.recommender?.name || opp.owner_suggest || '';
  const recommenderRole = opp.recommender?.role || '';

  useEffect(() => {
    // 检测文本是否被截断
    const checkTruncation = () => {
      if (titleRef.current) {
        setIsTitleTruncated(titleRef.current.scrollWidth > titleRef.current.clientWidth);
      }
      if (descRef.current) {
        setIsDescTruncated(descRef.current.scrollHeight > descRef.current.clientHeight);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [opp.title, opp.description]);

  const getPriorityTooltipContent = () => {
    let content = `优先级: ${config.label}`;
    if (opp.estimatedRevenue) {
      content += ` / 预计收益 ${formatCurrency(opp.estimatedRevenue)}`;
    }
    if (opp.validUntil) {
      content += ` / 时效窗口 7d`;
    }
    return content;
  };

  return (
    <div
      role="article"
      aria-labelledby={`opp-title-${opp.id}`}
      onClick={() => onClick?.(opp)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(opp);
        }
      }}
      className="
        relative
        cursor-pointer
        transition-all duration-200
        hover:-translate-y-0.5
        hover:shadow-[0_8px_24px_rgba(16,24,40,.06)]
        focus:outline-none
        focus:ring-2
        focus:ring-gradient-brand
      "
    >
      {/* 双层 Grid 布局 */}
      <div
        className="
          grid
          grid-cols-[1fr_32px]
          grid-rows-[auto_auto_auto]
          gap-x-3
          gap-y-2
          p-4
          rounded-[10px]
          border
          border-border
          bg-surface
        "
      >
        {/* 隐藏完整文本用于屏幕阅读器 */}
        <span id={`opp-title-full-${opp.id}`} className="sr-only">
          {opp.title}
        </span>
        <span id={`opp-desc-full-${opp.id}`} className="sr-only">
          {opp.description}
        </span>

        {/* 标题 - 只占左列 */}
        <div
          id={`opp-title-${opp.id}`}
          ref={titleRef}
          aria-describedby={isTitleTruncated ? `opp-title-full-${opp.id}` : undefined}
          className="
            col-start-1 col-end-2 row-start-1
            text-[16px] font-semibold text-text-1 leading-[1.4]
            line-clamp-1
            break-words
            overflow-anywhere
            min-w-0
          "
        >
          <Tooltip content={opp.title} disabled={!isTitleTruncated} maxWidth={360} position="top">
            <span className="cursor-default">{opp.title}</span>
          </Tooltip>
        </div>

        {/* 优先级徽章 - 固定右列 */}
        <div className="
          col-start-2 col-end-3 row-start-1
          justify-self-end self-start
        ">
          {/* 响应式徽章：<768px 显示圆点，≥768px 显示完整徽章 */}
          <>
            {/* 圆点版 - mobile */}
            <div
              className={`
                hidden sm:hidden
                w-1.5 h-1.5 rounded-full ${config.dotBg}
                mt-2
              `}
            />
            
            {/* 完整徽章 - desktop */}
            <Tooltip content={getPriorityTooltipContent()} maxWidth={280} position="top">
              <div
                aria-label={`优先级: ${config.label}`}
                className={`
                  hidden sm:block
                  w-8 h-5 rounded-full
                  text-[12px] leading-5 text-center
                  flex-shrink-0
                  ${config.bg} ${config.fg}
                `}
              >
                {config.label}
              </div>
            </Tooltip>
          </>
        </div>

        {/* 描述 - 跨两列 */}
        <div className="col-start-1 col-end-3 row-start-2">
          <p
            ref={descRef}
            aria-describedby={isDescTruncated ? `opp-desc-full-${opp.id}` : undefined}
            className="
              text-[13px] text-text-2 leading-[1.6]
              line-clamp-2
              break-words
              overflow-anywhere
              md:line-clamp-2
              sm:line-clamp-1
            "
          >
            <Tooltip content={opp.description} disabled={!isDescTruncated} maxWidth={360} position="bottom">
              <span className="cursor-default">{opp.description}</span>
            </Tooltip>
          </p>
        </div>

        {/* 底部信息行 - 跨两列 */}
        <div className="
          col-start-1 col-end-3 row-start-3
          flex justify-between items-center
          text-[12px] text-text-3
        ">
          {/* 左侧：人群数 */}
          <span className="min-w-0 flex-shrink-1">
            人群: {formatLargeNumber(opp.crowd_size)}
          </span>

          {/* 右侧：推荐人 */}
          <span className="
            min-w-0 flex-shrink-1
            max-w-40 truncate
            text-right
          ">
            推荐: {recommenderName}
            {recommenderRole && <span className="text-text-4 ml-1">({recommenderRole})</span>}
          </span>
        </div>
      </div>

      {/* 响应式样式补充 */}
      <style>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .break-words {
          word-break: break-word;
        }
        .overflow-anywhere {
          overflow-wrap: anywhere;
        }
        @media (max-width: 1024px) {
          .sm\\:line-clamp-1 {
            -webkit-line-clamp: 1 !important;
          }
        }
        @media (max-width: 768px) {
          .sm\\:hidden {
            display: block !important;
          }
          .hidden.sm\\:block {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};
