import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<any>;
  children: React.ReactNode;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const PULL_THRESHOLD = 65;
  const MAX_PULL = 90;
  const startXRef = useRef(0);
  const isHorizontalScrollRef = useRef(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled || isRefreshing) return;

    // Do not hijack touches on buttons, links, inputs, selects, or horizontal scroll tab containers
    const target = e.target as HTMLElement;
    if (target && target.closest('button, a, input, select, textarea, .orders-tab-scroll, .filter-pills-row, .orders-kpi-grid, [role="tab"]')) {
      isDraggingRef.current = false;
      return;
    }

    const container = containerRef.current;
    // Only allow pull to refresh when scrolled at the very top
    if (container && container.scrollTop <= 2) {
      startXRef.current = e.touches[0].clientX;
      startYRef.current = e.touches[0].clientY;
      isDraggingRef.current = true;
      isHorizontalScrollRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || disabled || isRefreshing) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = Math.abs(currentX - startXRef.current);
    const diffY = currentY - startYRef.current;

    // If movement is predominantly horizontal, cancel pull-to-refresh
    if (diffX > Math.abs(diffY) && diffX > 8) {
      isHorizontalScrollRef.current = true;
      isDraggingRef.current = false;
      setPullDistance(0);
      setIsPulling(false);
      return;
    }

    if (isHorizontalScrollRef.current) return;

    const container = containerRef.current;
    // Require a minimum deliberate downward pull (12px) before engaging pull state
    if (container && container.scrollTop <= 2 && diffY > 12) {
      // Damped rubber-band effect
      const dampedDistance = Math.min((diffY - 12) * 0.42, MAX_PULL);
      setPullDistance(dampedDistance);
      setIsPulling(true);

      // Prevent native overscroll bouncing when pulling down
      if (e.cancelable && diffY > 20) {
        e.preventDefault();
      }
    } else if (diffY <= 0) {
      setPullDistance(0);
      setIsPulling(false);
      isDraggingRef.current = false;
    }
  };

  const triggerRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsPulling(false);
    setPullDistance(52); // Keep loading badge visible during refresh

    try {
      await onRefresh();
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setIsRefreshing(false);
        setPullDistance(0);
      }, 600);
    } catch (err) {
      console.warn('Pull-to-refresh notice:', err);
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [onRefresh]);

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      triggerRefresh();
    } else {
      setIsPulling(false);
      setPullDistance(0);
    }
  };

  const progressPercent = Math.min((pullDistance / PULL_THRESHOLD) * 100, 100);

  return (
    <div
      ref={containerRef}
      className="pull-to-refresh-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        minWidth: 0,
        height: '100%'
      }}
    >
      {/* Pull To Refresh Top Indicator Bar */}
      {(pullDistance > 0 || isRefreshing) && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 99,
            height: pullDistance,
            maxHeight: MAX_PULL,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))',
            borderBottom: pullDistance >= PULL_THRESHOLD ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.2)',
            boxShadow: pullDistance >= PULL_THRESHOLD ? '0 4px 15px rgba(56, 189, 248, 0.25)' : 'none',
            overflow: 'hidden',
            transition: isDraggingRef.current ? 'none' : 'height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.4rem 1rem' }}>
            {/* Icon Status */}
            {isSuccess ? (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <Check size={16} />
              </div>
            ) : isRefreshing ? (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                <RefreshCw size={15} className="spin-animation" style={{ animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: pullDistance >= PULL_THRESHOLD ? 'rgba(56, 189, 248, 0.25)' : 'rgba(148, 163, 184, 0.15)',
                  border: pullDistance >= PULL_THRESHOLD ? '1px solid #38bdf8' : '1px solid #475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: pullDistance >= PULL_THRESHOLD ? '#38bdf8' : '#94a3b8',
                  transform: `rotate(${pullDistance >= PULL_THRESHOLD ? 180 : (progressPercent * 1.8)}deg)`,
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                <ArrowDown size={15} />
              </div>
            )}

            {/* Status Text */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: pullDistance >= PULL_THRESHOLD || isRefreshing ? '#38bdf8' : '#cbd5e1' }}>
                {isSuccess
                  ? 'Data Updated Successfully'
                  : isRefreshing
                  ? 'Syncing Live Orders...'
                  : pullDistance >= PULL_THRESHOLD
                  ? 'Release to Refresh'
                  : 'Pull Down to Refresh'}
              </span>
              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                {isRefreshing ? 'Re-fetching Supabase database' : 'Sync latest orders & statuses'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, paddingBottom: 'calc(76px + env(safe-area-inset-bottom))' }}>
        {children}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
