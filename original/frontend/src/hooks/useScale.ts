import { useWindowDimensions, PixelRatio } from 'react-native';

// Base dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Tablet threshold
const TABLET_WIDTH = 600;

export function useScale() {
  const { width, height } = useWindowDimensions();
  
  // Determine if device is a tablet
  const isTablet = width >= TABLET_WIDTH;
  
  // Calculate scale factors
  const widthScale = width / BASE_WIDTH;
  const heightScale = height / BASE_HEIGHT;
  
  // Use width scale as primary, capped for tablets to avoid oversizing
  const baseScale = Math.min(widthScale, heightScale);
  
  // For tablets, apply a boost factor for better readability
  // but cap it to prevent elements from getting too large
  const tabletBoost = isTablet ? 1.25 : 1;
  const scale = Math.min(baseScale * tabletBoost, 1.8);
  
  // Font scale - slightly more aggressive for tablets
  const fontScale = isTablet 
    ? Math.min(baseScale * 1.35, 2.0) 
    : Math.min(baseScale, 1.3);
  
  // Moderate scale for spacing/padding
  const moderateScale = (size: number, factor = 0.5) => {
    return size + (scale - 1) * factor * size;
  };
  
  // Scale function for general sizes
  const s = (size: number): number => {
    return Math.round(size * scale);
  };
  
  // Font scale function
  const fs = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel(size * fontScale));
  };
  
  // Moderate scale function (for padding/margins - less aggressive)
  const ms = (size: number, factor = 0.5): number => {
    return Math.round(moderateScale(size, factor));
  };
  
  // Vertical scale (based on height)
  const vs = (size: number): number => {
    return Math.round(size * heightScale);
  };
  
  return {
    scale,
    fontScale,
    isTablet,
    width,
    height,
    s,      // Scale
    fs,     // Font scale
    ms,     // Moderate scale
    vs,     // Vertical scale
  };
}

// Static scale utilities for non-hook contexts
export const getScale = (width: number, height: number) => {
  const isTablet = width >= TABLET_WIDTH;
  const widthScale = width / BASE_WIDTH;
  const heightScale = height / BASE_HEIGHT;
  const baseScale = Math.min(widthScale, heightScale);
  const tabletBoost = isTablet ? 1.25 : 1;
  return Math.min(baseScale * tabletBoost, 1.8);
};
