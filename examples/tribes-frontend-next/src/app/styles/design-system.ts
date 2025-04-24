// Astrix Design System

// Helper function for HSL colors
export function hsl(value: string): string {
  return `hsl(${value})`;
}

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  enhanced: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 3,
  },
};

// Blurs
export const blurs = {
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// Animations
export const animations = {
  default: {
    duration: 200,
    easing: 'ease-in-out',
  },
  slow: {
    duration: 400,
    easing: 'ease-in-out',
  },
  float: {
    duration: 6000,
    easing: 'ease-in-out',
  },
}; 

// Typography
export const typography = {
  fonts: {
    base: 'Inter',
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeights: {
    tight: 1.25,
    base: 1.5,
    relaxed: 1.75,
  },
  styles: {
    h1: {
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 1.25,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 1.25,
    },
    h3: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 1.5,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 1.5,
    },
  },
};

// Colors
export const colors = {
  // Theme Colors
  background: hsl('224 71% 4%'),
  foreground: hsl('0 0% 98%'),
  card: hsl('222 84% 5%'),
  cardForeground: hsl('0 0% 98%'),
  popover: hsl('224 71% 4%'),
  popoverForeground: hsl('0 0% 98%'),
  primary: hsl('220 14% 96%'),
  primaryForeground: hsl('0 0% 9%'),
  secondary: hsl('0 0% 14.9%'),
  secondaryForeground: hsl('0 0% 98%'),
  muted: hsl('0 0% 14.9%'),
  mutedForeground: hsl('0 0% 63.9%'),
  accent: hsl('84 60% 71%'),
  accentForeground: hsl('0 0% 98%'),
  destructive: hsl('0 62.8% 30.6%'),
  destructiveForeground: hsl('0 0% 98%'),
  border: hsl('0 0% 14.9%'),
  input: hsl('0 0% 14.9%'),
  ring: hsl('0 0% 83.1%'),

  // Chart Colors
  chart: {
    1: hsl('220 70% 50%'),
    2: hsl('160 60% 45%'),
    3: hsl('30 80% 55%'),
    4: hsl('280 65% 60%'),
    5: hsl('340 75% 55%'),
  },

  // Status Colors
  status: {
    success: {
      bg: 'rgba(176, 230, 129, 0.2)',
      text: '#B0E681',
    },
    warning: {
      bg: 'rgba(234, 179, 8, 0.2)',
      text: '#EAB308',
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.2)',
      text: '#EF4444',
    },
    info: {
      bg: 'rgba(59, 130, 246, 0.2)',
      text: '#3B82F6',
    },
  },
};

// Gradients
export const gradients = {
  page: 'radial-gradient(circle at top right, hsl(217, 91%, 8%), hsl(222, 84%, 4%), hsl(224, 71%, 2%))',
  card: 'linear-gradient(to bottom right, hsl(222, 84%, 5%), hsl(222, 84%, 4%), hsl(222, 84%, 3%))',
  glow: 'radial-gradient(circle at center, hsla(220, 14%, 96%, 0.15), transparent 50%)',
  hover: 'linear-gradient(to bottom right, hsla(84, 60%, 71%, 0.1), hsla(84, 60%, 71%, 0.05))',
}; 