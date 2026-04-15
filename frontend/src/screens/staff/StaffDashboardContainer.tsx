import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { Staff, ScreenName } from '../../types';
import NewStaffDashboard from './NewStaffDashboard';
import ProfileScreen from '../shared/ProfileScreen';

interface StaffDashboardContainerProps {
  staff: Staff;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE';

const StaffDashboardContainer: React.FC<StaffDashboardContainerProps> = ({
  staff,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('DASHBOARD');

  // Profile sub-screen goes back to DASHBOARD; DASHBOARD lets App.tsx handle (exit modal)
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
    if (screen === 'PROFILE') {
      setActiveTab('PROFILE');
    } else {
      onNavigate(screen);
    }
  };

  if (activeTab === 'PROFILE') {
    return (
      <ProfileScreen
        user={staff}
        userType="STAFF"
        onBack={() => setActiveTab('DASHBOARD')}
        onLogout={onLogout}
        showBottomNav={true}
        onTabChange={(tab) => {
          if (tab === 'HOME') setActiveTab('DASHBOARD');
          else if (tab === 'REQUESTS') onNavigate('MY_REQUESTS' as any);
          else if (tab === 'NEW_PASS') setActiveTab('DASHBOARD'); // dashboard has the new pass button
          else if (tab === 'PROFILE') { /* already here */ }
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NewStaffDashboard
        staff={staff}
        onLogout={onLogout}
        onNavigate={handleNavigate}
      />
    </View>
  );
};

export default StaffDashboardContainer;
