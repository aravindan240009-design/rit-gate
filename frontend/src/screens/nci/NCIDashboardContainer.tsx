import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { NonTeachingFaculty, ScreenName } from '../../types';
import NCIDashboard from './NCIDashboard';
import NCIMyRequestsScreen from './NCIMyRequestsScreen';
import ProfileScreen from '../shared/ProfileScreen';

interface NCIDashboardContainerProps {
  nci: NonTeachingFaculty;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE' | 'MY_REQUESTS';

const NCIDashboardContainer: React.FC<NCIDashboardContainerProps> = ({ nci, onLogout, onNavigate }) => {
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
    else if ((screen as any) === 'NCI_MY_REQUESTS') setActiveTab('MY_REQUESTS');
    else onNavigate(screen);
  };

  if (activeTab === 'PROFILE') {
    return (
      <ProfileScreen
        user={nci as any}
        userType="STAFF"
        onBack={() => setActiveTab('DASHBOARD')}
        onLogout={onLogout}
        showBottomNav={true}
        onTabChange={(tab) => {
          if (tab === 'HOME') setActiveTab('DASHBOARD');
          else if (tab === 'REQUESTS') setActiveTab('MY_REQUESTS');
          else if (tab === 'NEW_PASS') setActiveTab('DASHBOARD');
        }}
      />
    );
  }

  if (activeTab === 'MY_REQUESTS') {
    return (
      <NCIMyRequestsScreen
        user={nci}
        onBack={() => setActiveTab('DASHBOARD')}
        onNavigate={(screen) => {
          if (screen === 'HOME') setActiveTab('DASHBOARD');
          else if (screen === 'PROFILE') setActiveTab('PROFILE');
          else if (screen === 'NEW_PASS') { setActiveTab('DASHBOARD'); onNavigate('NEW_PASS_REQUEST' as any); }
        }}
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
