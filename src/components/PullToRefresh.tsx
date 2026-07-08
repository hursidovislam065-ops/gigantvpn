import { useState, useRef, useCallback } from 'react';
import { hapticFeedback } from '../utils/haptic';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.5, 100));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      hapticFeedback('medium');
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch {}
      hapticFeedback('success');
      setIsRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, isRefreshing, onRefresh]);

  const showIndicator = pullDistance > 10 || isRefreshing;
  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Pull indicator */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        left: '50%',
        transform: `translateX(-50%) translateY(${pullDistance}px)`,
        opacity: showIndicator ? 1 : 0,
        transition: isRefreshing ? 'none' : 'opacity 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'rgba(0,212,255,0.15)',
        border: '1px solid rgba(0,212,255,0.2)',
      }}>
        <svg
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          style={{
            transform: isRefreshing ? 'rotate(360deg)' : `rotate(${progress * 180}deg)`,
            transition: isRefreshing ? 'transform 0.8s linear' : 'none',
            animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
          }}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Content */}
      <div style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isRefreshing ? 'none' : 'transform 0.3s ease',
      }}>
        {children}
      </div>
    </div>
  );
}
