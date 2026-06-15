import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface ProfileContextType {
  profileImage: string | null;
  loading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

interface ProfileProviderProps {
  children: ReactNode;
  /** Current logged-in user's unique ID (regNo / staffCode / hodCode etc.) */
  userId: string | null;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children, userId }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch the profile photo from the database whenever the user changes
  useEffect(() => {
    let cancelled = false;

    const fetchProfilePhoto = async () => {
      if (!userId) {
        setProfileImage(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const photoUrl = await apiService.getProfilePhoto(userId);
        if (!cancelled) {
          setProfileImage(photoUrl);
        }
      } catch (error) {
        console.error('Error fetching profile photo:', error);
        if (!cancelled) {
          setProfileImage(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfilePhoto();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <ProfileContext.Provider value={{ profileImage, loading }}>
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
