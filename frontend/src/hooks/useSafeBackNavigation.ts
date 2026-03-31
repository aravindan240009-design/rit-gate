import { useCallback, useState } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

interface SafeBackNavigationOptions {
  /** The name of the root home screen for your stack */
  homeRouteName?: string;
  /** Whether to show a confirmation dialog when pressing back on the Home screen */
  requireExitConfirmation?: boolean;
  /** Provide an array of active root tabs or screens where back should exit app */
  rootScreens?: string[];
  /** Callback to trigger a custom exit modal rather than native Alert */
  onShowExitConfirm?: () => void;
}

/**
 * Hook to safely control the hardware back button or React Navigation swipe-back.
 * - If on any screen besides Root/Home, it intercepts the hardware back button and routes to `homeRouteName`.
 * - If on a Root/Home screen, it attempts to exit the app (optionally prompting a confirmation modal).
 * 
 * Note: React Navigation handles iOS swipe back natively. To prevent the swipe back 
 * from popping the stack, use `gestureEnabled: true` paired with `beforeRemove` listeners in your Stack configuration.
 */
export const useSafeBackNavigation = (options?: SafeBackNavigationOptions) => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  
  const homeRouteName = options?.homeRouteName || 'Home';
  const rootScreens = options?.rootScreens || [homeRouteName];
  const requireExitConfirmation = options?.requireExitConfirmation ?? true;

  const [isExitModalVisible, setIsExitModalVisible] = useState(false);

  const handleBackPress = useCallback(() => {
    const isRootScreen = rootScreens.includes(route.name);

    if (isRootScreen) {
      if (requireExitConfirmation) {
        if (options?.onShowExitConfirm) {
          options.onShowExitConfirm();
        } else {
          setIsExitModalVisible(true);
        }
        return true; // Block default exit
      }

      // Exit immediately
      BackHandler.exitApp();
      return true;
    }

    // If not on root, safely route back to the home route
    // Using navigate instead of goBack() ensures stack integrity.
    if (navigation.canGoBack()) {
      // Just go back if that's the desired default, or force navigate to home:
      // navigation.navigate(homeRouteName);
      
      // We will follow the strategy: redirect to Home if we are deep
      navigation.navigate(homeRouteName);
    } else {
      navigation.replace(homeRouteName);
    }
    
    return true; // Block default system back action
  }, [route.name, rootScreens, navigation, homeRouteName, requireExitConfirmation, options]);

  useFocusEffect(
    useCallback(() => {
      // Listen for hardware back button on Android
      const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => subscription.remove();
    }, [handleBackPress])
  );

  return {
    isExitModalVisible,
    showExitModal: () => setIsExitModalVisible(true),
    hideExitModal: () => setIsExitModalVisible(false),
    confirmExit: () => BackHandler.exitApp(),
    handleBackPress,
  };
};
