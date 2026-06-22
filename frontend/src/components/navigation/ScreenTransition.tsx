import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Pass-through wrapper around the current screen.
 *
 * This used to cross-fade whenever `screenKey` changed, but on fast switches
 * the outgoing fade left the new screen semi-transparent, so the previous
 * page / background ghosted through (visible overlap). The fade is removed:
 * children now render instantly as a hard cut, which eliminates any overlap.
 *
 * The component and its props are kept so the existing call sites don't change.
 */
interface ScreenTransitionProps {
  /** Identity of the current screen. Unused now — kept for call-site compatibility. */
  screenKey?: string;
  /** Override the background. Unused now — kept for call-site compatibility. */
  backgroundColor?: string;
  /** Fade duration. Unused now — kept for call-site compatibility. */
  duration?: number;
  children: React.ReactNode;
}

const ScreenTransition: React.FC<ScreenTransitionProps> = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default ScreenTransition;
