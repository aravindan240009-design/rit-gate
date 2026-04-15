import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { NonTeachingFaculty, ScreenName } from '../../types';
import NTFDashboard from './NTFDashboard';
import ProfileScreen from '../shared/ProfileScreen';

interface NTFDashboardContainerProps {
  ntf: NonTeachingFaculty;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE';

const NTFDashboardContainer: React.FC<NTFDashboardContainerProps> = ({ ntf, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('DASHBOARD');

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
        user={ntf as any}
        userType="STAFF"
        onBack={() => setActiveTab('DASHBOARD')}
        onLogout={onLogout}
        showBottomNav={true}
        onTabChange={(tab) => {
          if (tab === 'HOME') setActiveTab('DASHBOARD');
          else if (tab === 'REQUESTS') onNavigate('NTF_MY_REQUESTS' as any);
          else if (tab === 'NEW_PASS') setActiveTab('DASHBOARD');
          else if (tab === 'PROFILE') { /* already here */ }
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NTFDashboard ntf={ntf} onLogout={onLogout} onNavigate={handleNavigate} />
    </View>
  );
};

export default NTFDashboardContainer;
