import React from 'react';
import { Text, TextProps } from 'react-native';

type Props = TextProps & {
  variant?: string; // legacy — ignored
  children: React.ReactNode;
};

/**
 * App-wide text wrapper. Caps OS font scaling at 1.3× so users with larger
 * system font sizes get readable text without overflowing fixed-height cards
 * and badges. Callers can still override maxFontSizeMultiplier per-instance.
 */
const ThemedText: React.FC<Props> = ({ children, style, variant: _v, maxFontSizeMultiplier, ...rest }) => {
  return (
    <Text maxFontSizeMultiplier={maxFontSizeMultiplier ?? 1.3} {...rest} style={style}>
      {children}
    </Text>
  );
};

export default ThemedText;
