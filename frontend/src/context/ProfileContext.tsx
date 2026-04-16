import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImagePicker from '../utils/safeImagePicker';
import { Alert, Linking } from 'react-native';

interface ProfileContextType {
  profileImage: string | null;
  captureImage: (source: 'camera' | 'gallery') => Promise<void>;
  clearProfileImage: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

/** Storage key namespaced by userId so each user has their own profile picture */
const storageKey = (userId: string | null) =>
  userId ? `profile_image_${userId}` : 'profile_image_guest';

interface ProfileProviderProps {
  children: ReactNode;
  /** Current logged-in user's unique ID (regNo / staffCode / hodCode etc.) */
  userId: string | null;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children, userId }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Reload image whenever the logged-in user changes
  useEffect(() => {
    loadProfileImage();
  }, [userId]);

  const loadProfileImage = async () => {
    try {
      const saved = await AsyncStorage.getItem(storageKey(userId));
      setProfileImage(saved ?? null);
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const openAppSettings = () => {
    Alert.alert(
      'Permission Required',
      'Please enable photo access in your device Settings to use this feature.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  };

  const captureImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          if (!canAskAgain) openAppSettings();
          else Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'] as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permResult.status !== 'granted' && !permResult.canAskAgain) {
          openAppSettings();
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'] as any,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem(storageKey(userId), imageUri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to open image picker. Please try again.');
    }
  };

  const clearProfileImage = async () => {
    try {
      setProfileImage(null);
      await AsyncStorage.removeItem(storageKey(userId));
    } catch (error) {
      console.error('Error clearing profile image:', error);
    }
  };

  return (
    <ProfileContext.Provider value={{ profileImage, captureImage, clearProfileImage }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
