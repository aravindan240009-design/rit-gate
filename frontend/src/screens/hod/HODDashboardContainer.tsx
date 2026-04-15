import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { HOD, ScreenName } from '../../types';
import NewHODDashboard from './NewHODDashboard';
import HODMyRequestsScreen from './HODMyRequestsScreen';
import ProfileScreen from '../shared/ProfileScreen';

interface HODDashboardContainerProps {
  hod: HOD;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE' | 'MY_REQUESTS';

const HODDashboardContainer: React.FC<HODDashboardContainerProps> = ({
  hod,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('DASHBOARD');

  useEffect(() => {
    const onBack = () => {
      if (activeTab !== 'DASHBOARD') {
        setActiveTab('DASHBOARD');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeTab]);

  const handleNavigate = (screen: ScreenName) => {
    if (screen === 'PROFILE') setActiveTab('PROFILE');
    else if ((screen as any) === 'HOD_MY_REQUESTS') setActiveTab('MY_REQUESTS');
    else onNavigate(screen);
  };

  if (activeTab === 'PROFILE') {
    return (
      <ProfileScreen
        user={hod}
        userType="HOD"
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
      <HODMyRequestsScreen
        user={hod}
        onBack={() => setActiveTab('DASHBOARD')}
        onNavigate={(screen) => {
          if (screen === 'HOME') setActiveTab('DASHBOARD');
          else if (screen === 'PROFILE') setActiveTab('PROFILE');
          else if (screen === 'NEW_PASS') { setActiveTab('DASHBOARD'); onNavigate('HOD_GATE_PASS_REQUEST' as any); }
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NewHODDashboard
        hod={hod}
        onLogout={onLogout}
        onNavigate={handleNavigate}
      />
    </View>
  );
};

export default HODDashboardContainer;
