// Design System - MSIP Brand Colors and Styles
export const colors = {
  // Mastercard Brand Colors
  background: 'hsl(0, 0%, 100%)',
  foreground: 'hsl(220, 26%, 14%)',
  primary: 'hsl(14, 100%, 57%)',        // Mastercard Orange
  primaryGlow: 'hsl(14, 100%, 67%)',
  secondary: 'hsl(220, 26%, 14%)',      // Navy Corporate

  // Semantic Colors
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 84%, 60%)',

  // UI Elements
  card: 'hsl(0, 0%, 100%)',
  border: 'hsl(220, 13%, 91%)',
  muted: 'hsl(220, 13%, 95%)',
  mutedForeground: 'hsl(220, 9%, 46%)',

  // Gradients
  gradient: 'linear-gradient(to bottom right, hsl(0, 0%, 100%), hsl(220, 13%, 97%))',
  cardGradient: 'linear-gradient(135deg, hsl(30, 41%, 18%), hsl(15, 23%, 10%))',
};

export const typography = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export const styles = {
  card: {
    backgroundColor: colors.card,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 4px 20px -2px rgba(51, 65, 85, 0.08)',
    overflow: 'hidden' as const,
  },

  header: {
    borderBottom: `1px solid ${colors.border}`,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)',
    padding: '16px 48px',
  },

  badge: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 600,
      border: '1.5px solid',
    },
    warning: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      color: colors.warning,
      borderColor: colors.warning,
    },
    destructive: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      color: colors.destructive,
      borderColor: colors.destructive,
    },
    success: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      color: colors.success,
      borderColor: colors.success,
    },
    primary: {
      backgroundColor: 'rgba(255, 107, 0, 0.1)',
      color: colors.primary,
      borderColor: colors.primary,
    },
  },

  progressBar: {
    container: {
      height: '12px',
      background: colors.muted,
      borderRadius: '9999px',
      overflow: 'hidden' as const,
    },
    fill: {
      background: `linear-gradient(90deg, ${colors.primary}, ${colors.primaryGlow})`,
      boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
      height: '100%',
      borderRadius: '9999px',
    },
  },
};
