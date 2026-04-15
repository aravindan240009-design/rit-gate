import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { HR, ScreenName } from '../../types';
import NewHRDashboard from './NewHRDashboard';
import HRExitsScreen from './HRExitsScreen';
import HRSinglePassScreen from './HRSinglePassScreen';
import HRMyRequestsScreen from './HRMyRequestsScreen';
import ProfileScreen from '../shared/ProfileScreen';
import PassTypeBottomSheet from '../../components/PassTypeBottomSheet';

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
  const [showPassSheet, setShowPassSheet] = useState(false);

  useEffect(() => {
    const onBack = () => {
      if (showPassSheet) { setShowPassSheet(false); return true; }
      if (activeTab !== 'DASHBOARD') { setActiveTab('DASHBOARD'); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeTab, showPassSheet]);

  const openPassSheet = () => setShowPassSheet(true);

  const handleNavigate = (screen: ScreenName) => {
    if (screen === 'PROFILE') setActiveTab('PROFILE');
    else if (screen === 'HR_EXITS') setActiveTab('EXITS');
    else if (screen === 'NEW_PASS_REQUEST') setActiveTab('NEW_PASS');
    else if (screen === 'MY_REQUESTS') setActiveTab('MY_REQUESTS');
    else onNavigate(screen);
  };

  const renderScreen = () => {
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
            else if (tab === 'NEW_PASS') openPassSheet();
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
      return (
        <HRMyRequestsScreen
          hr={hr}
          onBack={() => setActiveTab('DASHBOARD')}
          onNavigate={(screen) => {
            if (screen === 'HOME') setActiveTab('DASHBOARD');
            else if (screen === 'PROFILE') setActiveTab('PROFILE');
            else if (screen === 'NEW_PASS') openPassSheet();
          }}
        />
      );
    }

    return (
      <NewHRDashboard
        hr={hr}
        onLogout={onLogout}
        onNavigate={handleNavigate}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}
      {/* HR only has single pass + guest — no bulk */}
      <PassTypeBottomSheet
        visible={showPassSheet}
        onClose={() => setShowPassSheet(false)}
        onSelectSingle={() => {
          setShowPassSheet(false);
          setActiveTab('NEW_PASS');
        }}
        onSelectGuest={() => {
          setShowPassSheet(false);
          onNavigate('GUEST_PRE_REQUEST' as any);
        }}
      />
    </View>
  );
};

export default HRDashboardContainer;
