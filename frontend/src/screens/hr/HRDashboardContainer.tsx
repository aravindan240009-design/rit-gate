import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { HR, ScreenName } from '../../types';
import NewHRDashboard from './NewHRDashboard';
import HRExitsScreen from './HRExitsScreen';
import ProfileScreen from '../shared/ProfileScreen';
import GatePassRequestScreen from '../student/GatePassRequestScreen';

interface HRDashboardContainerProps {
  hr: HR;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE' | 'EXITS' | 'NEW_PASS';

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
    else onNavigate(screen);
  };

  if (activeTab === 'PROFILE') {
    return (
      <ProfileScreen
        user={hr}
        userType="HR"
        onBack={() => setActiveTab('DASHBOARD')}
        onLogout={onLogout}
      />
    );
  }

  if (activeTab === 'EXITS') {
    return (
      <HRExitsScreen
        hr={hr}
        onBack={() => setActiveTab('DASHBOARD')}
      />
    );
  }

  if (activeTab === 'NEW_PASS') {
    return (
      <GatePassRequestScreen
        user={{ ...(hr as any), staffCode: hr.hrCode, staffName: hr.hrName || hr.name }}
        onBack={() => setActiveTab('DASHBOARD')}
      />
    );
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
