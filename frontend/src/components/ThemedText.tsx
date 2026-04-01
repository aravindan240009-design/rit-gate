import React from 'react';
import { Text, TextProps } from 'react-native';

type ThemedTextVariant = 'default' | 'primary' | 'secondary';

type Props = TextProps & {
  variant?: ThemedTextVariant;
  children: React.ReactNode;
  ignoreGradient?: boolean; // kept for backward compat — no-op now
};

const ThemedText: React.FC<Props> = ({ children, style, ignoreGradient: _ig, variant: _v, ...rest }) => {
  return (
    <Text {...rest} style={style}>
      {children}
    </Text>
  );
};

export default ThemedText;
