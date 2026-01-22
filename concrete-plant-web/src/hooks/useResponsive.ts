import { useState, useEffect, useCallback } from 'react';

// Breakpoint definitions matching our CSS
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1280,
  hd: 1920,
  uhd: 2560,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface ResponsiveState {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isHD: boolean;
  isUHD: boolean;
  isLargeScreen: boolean;
  isControlPanel: boolean;
}

/**
 * Hook to track responsive breakpoints and screen dimensions
 * Optimized for industrial control panel displays
 */
export function useResponsive(): ResponsiveState {
  const getBreakpoint = useCallback((width: number): BreakpointKey => {
    if (width >= BREAKPOINTS.uhd) return 'uhd';
    if (width >= BREAKPOINTS.hd) return 'hd';
    if (width >= BREAKPOINTS.desktop) return 'desktop';
    if (width >= BREAKPOINTS.tablet) return 'tablet';
    return 'mobile';
  }, []);

  const getState = useCallback((): ResponsiveState => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);

    return {
      width,
      height,
      breakpoint,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isDesktop: breakpoint === 'desktop' || breakpoint === 'hd' || breakpoint === 'uhd',
      isHD: breakpoint === 'hd' || breakpoint === 'uhd',
      isUHD: breakpoint === 'uhd',
      isLargeScreen: width >= BREAKPOINTS.hd,
      isControlPanel: width >= BREAKPOINTS.hd && height >= 900,
    };
  }, [getBreakpoint]);

  const [state, setState] = useState<ResponsiveState>(getState);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      // Debounce resize events for performance
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setState(getState());
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [getState]);

  return state;
}

/**
 * Hook to check if screen matches a minimum breakpoint
 */
export function useBreakpoint(minBreakpoint: BreakpointKey): boolean {
  const { width } = useResponsive();
  return width >= BREAKPOINTS[minBreakpoint];
}

/**
 * Hook for fullscreen mode (control panel displays)
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (err) {
      console.error('Failed to enter fullscreen:', err);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      await document.exitFullscreen();
      setIsFullscreen(false);
    } catch (err) {
      console.error('Failed to exit fullscreen:', err);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}

/**
 * Get responsive component sizes based on current breakpoint
 */
export function useComponentSizes() {
  const { breakpoint, isHD, isUHD } = useResponsive();

  const sizes = {
    // Bin sizes
    binWidth: isUHD ? 200 : isHD ? 160 : 120,
    binHeight: isUHD ? 280 : isHD ? 220 : 160,
    
    // Silo sizes
    siloWidth: isUHD ? 180 : isHD ? 140 : 100,
    siloHeight: isUHD ? 360 : isHD ? 280 : 200,
    
    // Mixer sizes
    mixerWidth: isUHD ? 500 : isHD ? 400 : 300,
    mixerHeight: isUHD ? 260 : isHD ? 200 : 150,
    
    // Scale sizes
    scaleWidth: isUHD ? 180 : isHD ? 140 : 100,
    scaleHeight: isUHD ? 100 : isHD ? 80 : 60,
    
    // Tank sizes
    tankWidth: isUHD ? 120 : isHD ? 100 : 80,
    tankHeight: isUHD ? 180 : isHD ? 150 : 120,
    
    // Font sizes
    labelFontSize: isUHD ? 16 : isHD ? 14 : 12,
    valueFontSize: isUHD ? 24 : isHD ? 20 : 16,
    titleFontSize: isUHD ? 20 : isHD ? 18 : 14,
    
    // Spacing
    componentGap: isUHD ? 32 : isHD ? 24 : 16,
    sectionGap: isUHD ? 48 : isHD ? 32 : 24,
  };

  return { sizes, breakpoint };
}

export default useResponsive;
