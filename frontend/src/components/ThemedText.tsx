import React from 'react';
import { Text, TextProps } from 'react-native';

type Props = TextProps & {
  variant?: string; // legacy — ignored
  children: React.ReactNode;
};

const ThemedText: React.FC<Props> = ({ children, style, variant: _v, ...rest }) => {
  return (
    <Text {...rest} style={style}>
      {children}
    </Text>
  );
};

export default ThemedText;
