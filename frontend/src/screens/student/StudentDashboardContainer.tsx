import React, { useState, useEffect, useMemo } from 'react';
import { BackHandler } from 'react-native';
import { Student, Staff, RITGateEvent, EventPassRow } from '../../types';
import StudentHomeScreen from './StudentHomeScreen';
import StudentRequestsScreen from './StudentRequestsScreen';
import StudentHistoryScreen from './StudentHistoryScreen';
import ProfileScreen from '../shared/ProfileScreen';
import GatePassRequestScreen from './GatePassRequestScreen';
import { useNotifications } from '../../context/NotificationContext';
import ScreenTransition from '../../components/navigation/ScreenTransition';
// Students can be assigned as event coordinators (by regNo) from the Event
// Controller portal — they reuse the exact same upload-only staff event screens
// that teaching staff and HODs use, via a Staff-shaped adapter.
import StaffEventListScreen from '../staff/StaffEventListScreen';
import EventCsvUploadScreen from '../staff/EventCsvUploadScreen';
import EventCsvPreviewScreen from '../staff/EventCsvPreviewScreen';
import StaffEventPassResultScreen from '../staff/StaffEventPassResultScreen';

interface StudentDashboardContainerProps {
  student: Student;
  onLogout: () => void;
  onNavigate: (screen: any) => void;
  initialTab?: TabType;
}

type TabType = 'HOME' | 'REQUESTS' | 'HISTORY' | 'PROFILE' | 'NEW_REQUEST' | 'EVENT_LIST' | 'CSV_UPLOAD' | 'CSV_PREVIEW' | 'EVENT_RESULT';

const StudentDashboardContainer: React.FC<StudentDashboardContainerProps> = ({
  student,
  onLogout,
  onNavigate,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'HOME');
  const [selectedEvent, setSelectedEvent] = useState<RITGateEvent | null>(null);
  const [previewRows, setPreviewRows] = useState<EventPassRow[]>([]);
  const [uploadResult, setUploadResult] = useState<{ total: number; issued: number; failed: number; errors?: any[] } | null>(null);
  const { loadNotifications } = useNotifications();

  // Adapter so the shared staff event screens can treat the student as a
  // coordinator. The student's coordinator identity is their regNo (the Event
  // Controller assigns coordinators by code, and the upload endpoint gates on
  // token identity === code).
  const studentAsStaff = useMemo<Staff>(() => ({
    ...(student as any),
    staffCode: student.regNo,
    staffName: student.fullName || student.firstName,
  }), [student]);

  useEffect(() => {
    loadNotifications(student.regNo, 'student');
  }, []);

  // Sub-tabs go back to HOME; HOME lets App.tsx handle (exit modal)
  useEffect(() => {
    const onBack = () => {
      if (activeTab === 'CSV_PREVIEW') { setActiveTab('CSV_UPLOAD'); return true; }
      if (activeTab === 'CSV_UPLOAD') { setActiveTab('EVENT_LIST'); return true; }
      if (activeTab === 'EVENT_RESULT') { setActiveTab('EVENT_LIST'); return true; }
      if (activeTab === 'EVENT_LIST') { setActiveTab('HOME'); return true; }
      if (activeTab !== 'HOME') {
        setActiveTab('HOME');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeTab]);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleTabChange = (tab: string) => switchTab(tab as TabType);
  const handleRequestGatePass = () => switchTab('NEW_REQUEST');
  const handleBackToHome = () => switchTab('HOME');

  const renderScreen = () => {
    // ── Events: upload-only coordinator flow, identical to teaching staff ──────
    if (activeTab === 'EVENT_LIST') {
      return (
        <StaffEventListScreen
          staff={studentAsStaff}
          onBack={() => setActiveTab('HOME')}
          onUploadCsv={(event) => { setSelectedEvent(event); setActiveTab('CSV_UPLOAD'); }}
        />
      );
    }

    if (activeTab === 'CSV_UPLOAD' && selectedEvent) {
      return (
        <EventCsvUploadScreen
          staff={studentAsStaff}
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
          staff={studentAsStaff}
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

    switch (activeTab) {
      case 'HOME':
        return (
          <StudentHomeScreen
            student={student}
            onLogout={onLogout}
            onNavigate={onNavigate}
            onTabChange={handleTabChange}
            onRequestGatePass={handleRequestGatePass}
            onOpenEvents={() => setActiveTab('EVENT_LIST')}
          />
        );
      case 'REQUESTS':
        return (
          <StudentRequestsScreen
            student={student}
            onTabChange={handleTabChange}
          />
        );
      case 'HISTORY':
        return (
          <StudentHistoryScreen
            student={student}
            onTabChange={handleTabChange}
          />
        );
      case 'PROFILE':
        return (
          <ProfileScreen
            user={student}
            userType="STUDENT"
            onBack={handleBackToHome}
            onLogout={onLogout}
            showBottomNav={true}
            onTabChange={handleTabChange}
          />
        );
      case 'NEW_REQUEST':
        return (
          <GatePassRequestScreen
            user={student}
            onBack={handleBackToHome}
          />
        );
      default:
        return (
          <StudentHomeScreen
            student={student}
            onLogout={onLogout}
            onNavigate={onNavigate}
            onTabChange={handleTabChange}
            onRequestGatePass={handleRequestGatePass}
            onOpenEvents={() => setActiveTab('EVENT_LIST')}
          />
        );
    }
  };

  return (
    <ScreenTransition screenKey={activeTab}>
      {renderScreen()}
    </ScreenTransition>
  );
};

export default StudentDashboardContainer;
