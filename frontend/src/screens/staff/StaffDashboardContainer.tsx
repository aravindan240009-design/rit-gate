import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { Staff, ScreenName, RITGateEvent, EventPassRow } from '../../types';
import NewStaffDashboard from './NewStaffDashboard';
import MyRequestsScreen from './MyRequestsScreen';
import ProfileScreen from '../shared/ProfileScreen';
import PassTypeBottomSheet from '../../components/PassTypeBottomSheet';
import StaffEventListScreen from './StaffEventListScreen';
import EventCsvUploadScreen from './EventCsvUploadScreen';
import EventCsvPreviewScreen from './EventCsvPreviewScreen';
import StaffEventPassResultScreen from './StaffEventPassResultScreen';

interface StaffDashboardContainerProps {
  staff: Staff;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE' | 'MY_REQUESTS' | 'EVENT_LIST' | 'CSV_UPLOAD' | 'CSV_PREVIEW' | 'EVENT_RESULT';

const StaffDashboardContainer: React.FC<StaffDashboardContainerProps> = ({
  staff,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('DASHBOARD');
  const [showPassSheet, setShowPassSheet] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RITGateEvent | null>(null);
  const [previewRows, setPreviewRows] = useState<EventPassRow[]>([]);
  const [uploadResult, setUploadResult] = useState<{ total: number; issued: number; failed: number; errors?: any[] } | null>(null);

  useEffect(() => {
    const onBack = () => {
      if (showPassSheet) { setShowPassSheet(false); return true; }
      if (activeTab === 'CSV_PREVIEW') { setActiveTab('CSV_UPLOAD'); return true; }
      if (activeTab === 'CSV_UPLOAD') { setActiveTab('EVENT_LIST'); return true; }
      if (activeTab === 'EVENT_RESULT') { setActiveTab('EVENT_LIST'); return true; }
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
    else if ((screen as any) === 'MY_REQUESTS') setActiveTab('MY_REQUESTS');
    else if (screen === 'STAFF_EVENT_LIST') setActiveTab('EVENT_LIST');
    else onNavigate(screen);
  };

  const renderScreen = () => {
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
            else if (tab === 'REQUESTS') setActiveTab('MY_REQUESTS');
            else if (tab === 'NEW_PASS') openPassSheet();
          }}
        />
      );
    }

    if (activeTab === 'MY_REQUESTS') {
      return (
        <MyRequestsScreen
          user={staff}
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
        <StaffEventListScreen
          staff={staff}
          onBack={() => setActiveTab('DASHBOARD')}
          onUploadCsv={(event) => { setSelectedEvent(event); setActiveTab('CSV_UPLOAD'); }}
        />
      );
    }

    if (activeTab === 'CSV_UPLOAD' && selectedEvent) {
      return (
        <EventCsvUploadScreen
          staff={staff}
          event={selectedEvent}
          onBack={() => setActiveTab('EVENT_LIST')}
          onPreview={(rows, event) => {
            setPreviewRows(rows);
            setSelectedEvent(event);
            setActiveTab('CSV_PREVIEW');
          }}
        />
      );
    }

    if (activeTab === 'CSV_PREVIEW' && selectedEvent) {
      return (
        <EventCsvPreviewScreen
          staff={staff}
          event={selectedEvent}
          initialRows={previewRows}
          onBack={() => setActiveTab('CSV_UPLOAD')}
          onConfirmed={(result) => {
            setUploadResult(result);
            setActiveTab('EVENT_RESULT');
          }}
        />
      );
    }

    if (activeTab === 'EVENT_RESULT' && selectedEvent && uploadResult) {
      return (
        <StaffEventPassResultScreen
          event={selectedEvent}
          result={uploadResult}
          onDone={() => { setActiveTab('EVENT_LIST'); setUploadResult(null); }}
        />
      );
    }

    return (
      <NewStaffDashboard
        staff={staff}
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
          onNavigate('NEW_PASS_REQUEST' as any);
        }}
        onSelectBulk={() => {
          setShowPassSheet(false);
          onNavigate('STAFF_BULK_GATE_PASS' as any);
        }}
        onSelectGuest={() => {
          setShowPassSheet(false);
          onNavigate('GUEST_PRE_REQUEST' as any);
        }}
      />
    </View>
  );
};

export default StaffDashboardContainer;
