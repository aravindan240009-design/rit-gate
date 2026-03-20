import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

interface ProfileContextType {
  profileImage: string | null;
  captureImage: (source: 'camera' | 'gallery') => Promise<void>;
  clearProfileImage: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    loadProfileImage();
  }, []);

  const loadProfileImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('profile_image');
      if (savedImage) {
        setProfileImage(savedImage);
      }
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
          if (!canAskAgain) {
            openAppSettings();
          } else {
            Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
          }
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        // On Android 13+ (API 33+), READ_MEDIA_IMAGES is used.
        // On Android 14+ (API 34+), limited photo access may be granted.
        // expo-image-picker handles the picker UI natively — we just need to
        // check if we can ask, and if permanently denied, send user to Settings.
        const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
          if (!canAskAgain) {
            // Permanently denied — must go to Settings
            openAppSettings();
          } else {
            Alert.alert(
              'Permission Required',
              'Photo library access is needed to set your profile picture.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Allow',
                  onPress: async () => {
                    const retry = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (retry.status !== 'granted') {
                      if (!retry.canAskAgain) openAppSettings();
                    } else {
                      await launchGallery();
                    }
                  },
                },
              ]
            );
          }
          return;
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem('profile_image', imageUri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const launchGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        await AsyncStorage.setItem('profile_image', imageUri);
      }
    } catch (error) {
      console.error('Error launching gallery:', error);
    }
  };

  const clearProfileImage = async () => {
    try {
      setProfileImage(null);
      await AsyncStorage.removeItem('profile_image');
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
