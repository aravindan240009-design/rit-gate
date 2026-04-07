import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { NonTeachingFaculty, ScreenName } from '../../types';
import NCIDashboard from './NCIDashboard';
import ProfileScreen from '../shared/ProfileScreen';

interface NCIDashboardContainerProps {
  nci: NonTeachingFaculty;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const NCIDashboardContainer: React.FC<NCIDashboardContainerProps> = ({ nci, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PROFILE'>('DASHBOARD');

  useEffect(() => {
    const onBack = () => {
      if (activeTab !== 'DASHBOARD') { setActiveTab('DASHBOARD'); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeTab]);

  const handleNavigate = (screen: ScreenName) => {
    if (screen === 'PROFILE') setActiveTab('PROFILE');
    else onNavigate(screen);
  };

  if (activeTab === 'PROFILE') {
    return (
      <ProfileScreen
        user={nci as any}
        userType="STAFF"
        onBack={() => setActiveTab('DASHBOARD')}
        onLogout={onLogout}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NCIDashboard nci={nci} onLogout={onLogout} onNavigate={handleNavigate} />
    </View>
  );
};

export default NCIDashboardContainer;
