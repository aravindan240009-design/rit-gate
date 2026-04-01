import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import GradientText from './GradientText';

type ThemedTextVariant = 'default' | 'primary' | 'secondary';

type Props = TextProps & {
  variant?: ThemedTextVariant;
  children: React.ReactNode;
  ignoreGradient?: boolean;
};

const ThemedText: React.FC<Props> = ({ variant = 'default', children, style, ignoreGradient = false, ...rest }) => {
  const { theme, textStyleMode } = useTheme();

  const colors =
    variant === 'primary'
      ? theme.gradients.primary
      : variant === 'secondary'
        ? theme.gradients.secondary
        : theme.gradients.primary;

  const childText = typeof children === 'string' ? children : null;

  // Flatten styles to inspect explicit color overrides
  const flattenedStyle = (StyleSheet.flatten(style) as TextStyle) || {};
  const explicitColor = flattenedStyle.color?.toString().toLowerCase() || '';
  
  // High-contrast colors like pure white or pure black that are typically used 
  // on active badges, buttons, and avatars. These should not be transformed into gradients.
  const isContrastColor = explicitColor === '#fff' || 
                          explicitColor === '#ffffff' || 
                          explicitColor === 'white' ||
                          explicitColor === '#000' ||
                          explicitColor === '#000000' ||
                          explicitColor === 'black';

  // Apply gradient broadly when enabled, but only for plain string nodes.
  // If this Text contains nested nodes, fall back to normal Text to preserve layout.
  const shouldGradient = textStyleMode === 'gradient' && childText !== null && !ignoreGradient && !isContrastColor;

  if (shouldGradient) {
    return <GradientText text={childText} colors={colors} style={style as any} />;
  }

  return (
    <Text {...rest} style={style}>
      {children}
    </Text>
  );
};

export default ThemedText;

