import React from 'react';
import { Text, TextProps, TextStyle, View, ViewProps, ViewStyle, useWindowDimensions, PixelRatio } from 'react-native';

// Base dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 390;
const TABLET_WIDTH = 600;

// Calculate scale based on screen width
const useScaleFactor = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_WIDTH;
  const widthScale = width / BASE_WIDTH;
  
  // For tablets, apply a boost for better readability
  const fontScale = isTablet 
    ? Math.min(widthScale * 1.3, 1.8) 
    : Math.min(widthScale, 1.2);
    
  const spaceScale = isTablet
    ? Math.min(widthScale * 1.15, 1.5)
    : Math.min(widthScale, 1.1);
    
  return { fontScale, spaceScale, isTablet };
};

// Scaled Text Component
interface ScaledTextProps extends TextProps {
  children: React.ReactNode;
  style?: TextStyle | TextStyle[];
}

export const ScaledText: React.FC<ScaledTextProps> = ({ children, style, ...props }) => {
  const { fontScale } = useScaleFactor();
  
  const scaledStyle = React.useMemo(() => {
    if (!style) return {};
    
    const styleObj = Array.isArray(style) 
      ? Object.assign({}, ...style.filter(Boolean)) 
      : style;
    
    const scaled: TextStyle = { ...styleObj };
    
    if (scaled.fontSize) {
      scaled.fontSize = Math.round(PixelRatio.roundToNearestPixel(scaled.fontSize * fontScale));
    }
    if (scaled.lineHeight) {
      scaled.lineHeight = Math.round(scaled.lineHeight * fontScale);
    }
    
    return scaled;
  }, [style, fontScale]);
  
  return <Text {...props} style={scaledStyle}>{children}</Text>;
};

// Hook for scaling values in StyleSheet
export const useResponsiveScale = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_WIDTH;
  const widthScale = width / BASE_WIDTH;
  
  const fontScale = isTablet 
    ? Math.min(widthScale * 1.3, 1.8) 
    : Math.min(widthScale, 1.2);
    
  const spaceScale = isTablet
    ? Math.min(widthScale * 1.15, 1.5)
    : Math.min(widthScale, 1.1);
  
  // Scale font size
  const fs = (size: number): number => {
    return Math.round(PixelRatio.roundToNearestPixel(size * fontScale));
  };
  
  // Scale spacing (padding, margin, gap)
  const sp = (size: number): number => {
    return Math.round(size * spaceScale);
  };
  
  // Scale size (width, height, borderRadius)
  const sz = (size: number): number => {
    return Math.round(size * spaceScale);
  };
  
  // Scale icon size
  const icon = (size: number): number => {
    return Math.round(size * fontScale);
  };
  
  return { fs, sp, sz, icon, isTablet, fontScale, spaceScale };
};

export default { ScaledText, useResponsiveScale };
