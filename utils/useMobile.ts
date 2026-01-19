
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook to detect if the device is mobile/touch-enabled
 */
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

/**
 * Hook for touch-enabled pan and pinch-zoom gestures
 */
export const useTouchGestures = (
  initialPosition: { x: number; y: number },
  initialScale: number,
  minScale = 0.3,
  maxScale = 1.5
) => {
  const [position, setPosition] = useState(initialPosition);
  const [scale, setScale] = useState(initialScale);

  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);
  const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getTouchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.min(Math.max(prev + (e.deltaY > 0 ? -0.05 : 0.05), minScale), maxScale));
  }, [minScale, maxScale]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - start drag
      isDragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      };
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch zoom
      isDragging.current = false;
      lastTouchDistance.current = getTouchDistance(e.touches);
      lastTouchCenter.current = getTouchCenter(e.touches);
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging.current) {
      // Single touch - drag/pan
      setPosition({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y
      });
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom and pan
      const newDistance = getTouchDistance(e.touches);
      const newCenter = getTouchCenter(e.touches);

      if (lastTouchDistance.current !== null) {
        // Calculate scale change
        const scaleDelta = (newDistance - lastTouchDistance.current) * 0.005;
        setScale(prev => Math.min(Math.max(prev + scaleDelta, minScale), maxScale));
      }

      if (lastTouchCenter.current !== null) {
        // Pan while zooming
        const dx = newCenter.x - lastTouchCenter.current.x;
        const dy = newCenter.y - lastTouchCenter.current.y;
        setPosition(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
      }

      lastTouchDistance.current = newDistance;
      lastTouchCenter.current = newCenter;
    }
  }, [minScale, maxScale]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      isDragging.current = false;
      lastTouchDistance.current = null;
      lastTouchCenter.current = null;
    } else if (e.touches.length === 1) {
      // Transition from pinch to drag
      isDragging.current = true;
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      };
      lastTouchDistance.current = null;
      lastTouchCenter.current = null;
    }
  }, [position]);

  return {
    position,
    setPosition,
    scale,
    setScale,
    isDragging,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
      onWheel: handleWheel,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    }
  };
};

/**
 * Hook for haptic feedback on supported devices
 */
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  return { vibrate };
};
