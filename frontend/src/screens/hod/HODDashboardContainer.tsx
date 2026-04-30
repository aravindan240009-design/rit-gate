import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { HOD, ScreenName, RITGateEvent } from '../../types';
import NewHODDashboard from './NewHODDashboard';
import HODMyRequestsScreen from './HODMyRequestsScreen';
import ProfileScreen from '../shared/ProfileScreen';
import PassTypeBottomSheet from '../../components/PassTypeBottomSheet';
import HODEventListScreen from './HODEventListScreen';
import HODCreateEventScreen from './HODCreateEventScreen';
import HODAssignCoordinatorsScreen from './HODAssignCoordinatorsScreen';

interface HODDashboardContainerProps {
  hod: HOD;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE' | 'MY_REQUESTS' | 'EVENT_LIST' | 'CREATE_EVENT' | 'ASSIGN_COORDINATORS';

const HODDashboardContainer: React.FC<HODDashboardContainerProps> = ({
  hod,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('DASHBOARD');
  const [showPassSheet, setShowPassSheet] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RITGateEvent | null>(null);

  useEffect(() => {
    const onBack = () => {
      if (showPassSheet) { setShowPassSheet(false); return true; }
      if (activeTab === 'ASSIGN_COORDINATORS') { setActiveTab('EVENT_LIST'); return true; }
      if (activeTab === 'CREATE_EVENT') { setActiveTab('EVENT_LIST'); return true; }
      if (activeTab === 'EVENT_LIST') { setActiveTab('DASHBOARD'); return true; }
      if (activeTab !== 'DASHBOARD') { setActiveTab('DASHBOARD'); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeTab, showPassSheet]);

  const openPassSheet = () => setShowPassSheet(true);

  const handleNavigate = (screen: ScreenName) => {
    if (screen === 'PROFILE') setActiveTab('PROFILE');
    else if ((screen as any) === 'HOD_MY_REQUESTS') setActiveTab('MY_REQUESTS');
    else if (screen === 'HOD_EVENT_LIST') setActiveTab('EVENT_LIST');
    else onNavigate(screen);
  };

  const renderScreen = () => {
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
            else if (tab === 'NEW_PASS') openPassSheet();
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
            else if (screen === 'NEW_PASS') openPassSheet();
          }}
        />
      );
    }

    if (activeTab === 'EVENT_LIST') {
      return (
        <HODEventListScreen
          hod={hod}
          onBack={() => setActiveTab('DASHBOARD')}
          onCreateEvent={() => setActiveTab('CREATE_EVENT')}
          onSelectEvent={(event) => { setSelectedEvent(event); setActiveTab('ASSIGN_COORDINATORS'); }}
        />
      );
    }

    if (activeTab === 'CREATE_EVENT') {
      return (
        <HODCreateEventScreen
          hod={hod}
          onBack={() => setActiveTab('EVENT_LIST')}
          onCreated={() => setActiveTab('EVENT_LIST')}
        />
      );
    }

    if (activeTab === 'ASSIGN_COORDINATORS' && selectedEvent) {
      return (
        <HODAssignCoordinatorsScreen
          hod={hod}
          event={selectedEvent}
          onBack={() => setActiveTab('EVENT_LIST')}
        />
      );
    }

    return (
      <NewHODDashboard
        hod={hod}
        onLogout={onLogout}
        onNavigate={handleNavigate}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen()}
      <PassTypeBottomSheet
        visible={showPassSheet}
        onClose={() => setShowPassSheet(false)}
        onSelectSingle={() => {
          setShowPassSheet(false);
          onNavigate('HOD_GATE_PASS_REQUEST' as any);
        }}
        onSelectBulk={() => {
          setShowPassSheet(false);
          onNavigate('HOD_BULK_GATE_PASS' as any);
        }}
        onSelectGuest={() => {
          setShowPassSheet(false);
          onNavigate('GUEST_PRE_REQUEST' as any);
        }}
      />
    </View>
  );
};

export default HODDashboardContainer;
