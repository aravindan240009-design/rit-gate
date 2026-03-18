import React, { useState } from 'react';
import { Student } from '../../types';
import StudentHomeScreen from './StudentHomeScreen';
import StudentRequestsScreen from './StudentRequestsScreen';
import StudentHistoryScreen from './StudentHistoryScreen';
import ProfileScreen from '../shared/ProfileScreen';
import GatePassRequestScreen from './GatePassRequestScreen';

interface StudentDashboardContainerProps {
  student: Student;
  onLogout: () => void;
  onNavigate: (screen: any) => void;
}

type TabType = 'HOME' | 'REQUESTS' | 'HISTORY' | 'PROFILE' | 'NEW_REQUEST';

const StudentDashboardContainer: React.FC<StudentDashboardContainerProps> = ({
  student,
  onLogout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('HOME');

  const handleTabChange = (tab: 'HOME' | 'REQUESTS' | 'HISTORY' | 'PROFILE') => {
    setActiveTab(tab);
  };

  const handleRequestGatePass = () => {
    setActiveTab('NEW_REQUEST');
  };

  const handleRequestSuccess = () => {
    setActiveTab('REQUESTS');
  };

  const handleBackToHome = () => {
    setActiveTab('HOME');
  };

  // Render the active screen
  switch (activeTab) {
    case 'HOME':
      return (
        <StudentHomeScreen
          student={student}
          onLogout={onLogout}
          onNavigate={onNavigate}
          onTabChange={handleTabChange}
          onRequestGatePass={handleRequestGatePass}
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
        />
      );
  }
};

export default StudentDashboardContainer;
