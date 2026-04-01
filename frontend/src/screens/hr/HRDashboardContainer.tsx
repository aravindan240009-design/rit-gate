import React, { useState, useEffect, useCallback } from 'react';
import { View, BackHandler } from 'react-native';
import { HR, ScreenName } from '../../types';
import NewHRDashboard from './NewHRDashboard';
import HRExitsScreen from './HRExitsScreen';
import ProfileScreen from '../shared/ProfileScreen';
import GuestPreRequestScreen from '../shared/GuestPreRequestScreen';

interface HRDashboardContainerProps {
  hr: HR;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'HOME' | 'GUEST' | 'EXITS' | 'PROFILE';

const HRDashboardContainer: React.FC<HRDashboardContainerProps> = ({
  hr,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('HOME');

  // Back on non-HOME tab → HOME; HOME → App.tsx handles (exit modal)
  useEffect(() => {
    const onBack = () => {
      if (activeTab !== 'HOME') {
        setActiveTab('HOME');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeTab]);

  const handleNavigate = (screen: ScreenName) => {
    switch (screen) {
      case 'PROFILE': setActiveTab('PROFILE'); break;
      default: onNavigate(screen); break;
    }
  };

  const handleTabChange = useCallback((tab: InternalTab) => {
    setActiveTab(tab);
  }, []);

  switch (activeTab) {
    case 'GUEST':
      return (
        <View style={{ flex: 1 }}>
          <GuestPreRequestScreen
            creatorRole="HR"
            creatorStaffCode={hr.hrCode}
            creatorName={hr.hrName || hr.name}
            creatorDepartment={hr.department}
            onBack={() => setActiveTab('HOME')}
          />
          <HRBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </View>
      );
    case 'EXITS':
      return (
        <HRExitsScreen
          hr={hr}
          onBack={() => setActiveTab('HOME')}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      );
    case 'PROFILE':
      return (
        <View style={{ flex: 1 }}>
          <ProfileScreen
            user={hr}
            userType="HR"
            onBack={() => setActiveTab('HOME')}
            onLogout={onLogout}
          />
          <HRBottomNav activeTab={activeTab} onTabChange={handleTabChange} />
        </View>
      );
    default:
      return (
        <View style={{ flex: 1 }}>
          <NewHRDashboard
            hr={hr}
            onLogout={onLogout}
            onNavigate={handleNavigate}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </View>
      );
  }
};

export default HRDashboardContainer;
