import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { HR, ScreenName } from '../../types';
import NewHRDashboard from './NewHRDashboard';
import HRExitsScreen from './HRExitsScreen';
import HRSinglePassScreen from './HRSinglePassScreen';
import HRMyRequestsScreen from './HRMyRequestsScreen';
import ProfileScreen from '../shared/ProfileScreen';

interface HRDashboardContainerProps {
  hr: HR;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE' | 'EXITS' | 'NEW_PASS' | 'MY_REQUESTS';

const HRDashboardContainer: React.FC<HRDashboardContainerProps> = ({
  hr,
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
    else if (screen === 'HR_EXITS') setActiveTab('EXITS');
    else if (screen === 'NEW_PASS_REQUEST') setActiveTab('NEW_PASS');
    else if (screen === 'MY_REQUESTS') setActiveTab('MY_REQUESTS');
    else onNavigate(screen);
  };

  if (activeTab === 'PROFILE') {
    return (
      <ProfileScreen
        user={hr}
        userType="HR"
        onBack={() => setActiveTab('DASHBOARD')}
        onLogout={onLogout}
        showBottomNav={true}
        onTabChange={(tab) => {
          if (tab === 'HOME') setActiveTab('DASHBOARD');
          else if (tab === 'REQUESTS') setActiveTab('MY_REQUESTS');
          else if (tab === 'NEW_PASS') setActiveTab('DASHBOARD');
          else if (tab === 'PROFILE') { /* already here */ }
        }}
      />
    );
  }

  if (activeTab === 'EXITS') {
    return <HRExitsScreen hr={hr} onBack={() => setActiveTab('DASHBOARD')} />;
  }

  if (activeTab === 'NEW_PASS') {
    return <HRSinglePassScreen hr={hr} onBack={() => setActiveTab('DASHBOARD')} />;
  }

  if (activeTab === 'MY_REQUESTS') {
    return <HRMyRequestsScreen hr={hr} onBack={() => setActiveTab('DASHBOARD')} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <NewHRDashboard
        hr={hr}
        onLogout={onLogout}
        onNavigate={handleNavigate}
      />
    </View>
  );
};

export default HRDashboardContainer;
