import React, { useState, useEffect } from 'react';
import { View, BackHandler } from 'react-native';
import { NonTeachingFaculty, ScreenName } from '../../types';
import AdminDashboard from './AdminDashboard';
import AdminSinglePassScreen from './AdminSinglePassScreen';
import AdminMyRequestsScreen from './AdminMyRequestsScreen';
import AdminScanHistoryScreen from './AdminScanHistoryScreen';
import ProfileScreen from '../shared/ProfileScreen';
import GuestPreRequestScreen from '../shared/GuestPreRequestScreen';

interface AdminDashboardContainerProps {
  admin: NonTeachingFaculty;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalTab = 'DASHBOARD' | 'PROFILE' | 'NEW_PASS' | 'MY_REQUESTS' | 'SCAN_HISTORY' | 'GUEST';

const AdminDashboardContainer: React.FC<AdminDashboardContainerProps> = ({ admin, onLogout, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('DASHBOARD');

  useEffect(() => {
    const onBack = () => {
      if (activeTab !== 'DASHBOARD') { setActiveTab('DASHBOARD'); return true; }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeTab]);

  const handleNavigate = (screen: ScreenName) => {
    if (screen === 'PROFILE') setActiveTab('PROFILE');
    else if (screen === 'NEW_PASS_REQUEST') setActiveTab('NEW_PASS');
    else if (screen === 'ADMIN_MY_REQUESTS') setActiveTab('MY_REQUESTS');
    else if (screen === 'ADMIN_SCAN_HISTORY') setActiveTab('SCAN_HISTORY');
    else if (screen === 'GUEST_PRE_REQUEST') setActiveTab('GUEST');
    else onNavigate(screen);
  };

  if (activeTab === 'PROFILE') {
    return (
      <ProfileScreen 
        user={admin as any} 
        userType="STAFF" 
        userSubType="ADMIN" 
        onBack={() => setActiveTab('DASHBOARD')} 
        onLogout={onLogout}
        showBottomNav={true}
        onTabChange={(tab) => {
          if (tab === 'HOME') setActiveTab('DASHBOARD');
          else if (tab === 'MY_REQUESTS') setActiveTab('MY_REQUESTS');
          else if (tab === 'SCAN_HISTORY') setActiveTab('SCAN_HISTORY');
          else if (tab === 'PROFILE') setActiveTab('PROFILE');
        }}
      />
    );
  }
  if (activeTab === 'NEW_PASS') {
    return <AdminSinglePassScreen admin={admin} onBack={() => setActiveTab('DASHBOARD')} />;
  }
  if (activeTab === 'MY_REQUESTS') {
    return <AdminMyRequestsScreen admin={admin} onBack={() => setActiveTab('DASHBOARD')} onNavigate={handleNavigate} />;
  }
  if (activeTab === 'SCAN_HISTORY') {
    return <AdminScanHistoryScreen admin={admin} onBack={() => setActiveTab('DASHBOARD')} onNavigate={handleNavigate} />;
  }
  if (activeTab === 'GUEST') {
    return (
      <GuestPreRequestScreen
        creatorRole="NTF"
        creatorStaffCode={admin.staffCode}
        creatorName={admin.staffName || admin.name || ''}
        creatorDepartment={admin.department || ''}
        onBack={() => setActiveTab('DASHBOARD')}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <AdminDashboard admin={admin} onLogout={onLogout} onNavigate={handleNavigate} />
    </View>
  );
};

export default AdminDashboardContainer;
