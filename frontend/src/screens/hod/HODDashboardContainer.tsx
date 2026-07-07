import React, { useState, useEffect, useMemo } from 'react';
import { View, BackHandler } from 'react-native';
import { HOD, Staff, ScreenName, RITGateEvent, EventPassRow } from '../../types';
import NewHODDashboard from './NewHODDashboard';
import HODMyRequestsScreen from './HODMyRequestsScreen';
import ProfileScreen from '../shared/ProfileScreen';
import PassTypeBottomSheet from '../../components/PassTypeBottomSheet';
import ScreenTransition from '../../components/navigation/ScreenTransition';
// HODs are now upload-only coordinators, identical to teaching staff:
// they see the events they've been assigned to and upload the participant CSV.
// They can no longer create events or assign coordinators — only the Event
// Controller (event-manager-portal) assigns coordinators.
import StaffEventListScreen from '../staff/StaffEventListScreen';
import EventCsvUploadScreen from '../staff/EventCsvUploadScreen';
import EventCsvPreviewScreen from '../staff/EventCsvPreviewScreen';
import StaffEventPassResultScreen from '../staff/StaffEventPassResultScreen';

interface HODDashboardContainerProps {
  hod: HOD;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE' | 'MY_REQUESTS' | 'EVENT_LIST' | 'CSV_UPLOAD' | 'CSV_PREVIEW' | 'EVENT_RESULT';

const HODDashboardContainer: React.FC<HODDashboardContainerProps> = ({
  hod,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('DASHBOARD');
  const [showPassSheet, setShowPassSheet] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RITGateEvent | null>(null);
  const [previewRows, setPreviewRows] = useState<EventPassRow[]>([]);
  const [uploadResult, setUploadResult] = useState<{ total: number; issued: number; failed: number; skipped?: number; errors?: any[] } | null>(null);

  // Adapter so the shared staff event screens can treat the HOD as a coordinator.
  // The HOD's coordinator identity is their hodCode (the Event Controller assigns
  // coordinators by code, and the upload endpoint gates on token identity === code).
  const hodAsStaff = useMemo<Staff>(() => ({
    ...(hod as any),
    staffCode: hod.hodCode || (hod as any).hod_code || '',
    staffName: hod.hodName || hod.name || '',
  }), [hod]);

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
            else if (tab === 'MY_REQUESTS') setActiveTab('MY_REQUESTS');
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

    // ── Events: upload-only flow, identical to teaching staff ──────────────────
    if (activeTab === 'EVENT_LIST') {
      return (
        <StaffEventListScreen
          staff={hodAsStaff}
          onBack={() => setActiveTab('DASHBOARD')}
          onUploadCsv={(event) => { setSelectedEvent(event); setActiveTab('CSV_UPLOAD'); }}
        />
      );
    }

    if (activeTab === 'CSV_UPLOAD' && selectedEvent) {
      return (
        <EventCsvUploadScreen
          staff={hodAsStaff}
          event={selectedEvent}
          onBack={() => setActiveTab('EVENT_LIST')}
          onSingleIssued={(result) => {
            setUploadResult(result);
            setActiveTab('EVENT_RESULT');
          }}
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
          staff={hodAsStaff}
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
      <NewHODDashboard
        hod={hod}
        onLogout={onLogout}
        onNavigate={handleNavigate}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScreenTransition screenKey={activeTab}>
        {renderScreen()}
      </ScreenTransition>
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
