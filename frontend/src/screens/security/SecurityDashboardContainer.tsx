import React, { useState, useEffect, useCallback } from 'react';
import { View, BackHandler } from 'react-native';
import { SecurityPersonnel, ScreenName } from '../../types';
import NewSecurityDashboard from './NewSecurityDashboard';
import ModernQRScannerScreen from './ModernQRScannerScreen';
import ModernVisitorRegistrationScreen from './ModernVisitorRegistrationScreen';
import SecurityVisitorQRScreen from './SecurityVisitorQRScreen';
import ModernVehicleRegistrationScreen from './ModernVehicleRegistrationScreen';
import ModernScanHistoryScreen from './ModernScanHistoryScreen';
import ModernHODContactsScreen from './ModernHODContactsScreen';
import ProfileScreen from '../shared/ProfileScreen';
import NotificationsScreen from '../shared/NotificationsScreen';

interface SecurityDashboardContainerProps {
  security: SecurityPersonnel;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

type InternalScreen =
  | 'DASHBOARD'
  | 'QR_SCANNER'
  | 'VISITOR_REGISTRATION'
  | 'VISITOR_QR'          // sub-page of VISITOR_REGISTRATION
  | 'VEHICLE_REGISTRATION'
  | 'SCAN_HISTORY'
  | 'HOD_CONTACTS'
  | 'PROFILE'
  | 'NOTIFICATIONS';

// Main pages: back goes to DASHBOARD
const MAIN_PAGES: InternalScreen[] = [
  'QR_SCANNER', 'VISITOR_REGISTRATION', 'VEHICLE_REGISTRATION',
  'SCAN_HISTORY', 'HOD_CONTACTS', 'PROFILE', 'NOTIFICATIONS',
];

const SecurityDashboardContainer: React.FC<SecurityDashboardContainerProps> = ({
  security,
  onLogout,
  onNavigate,
}) => {
  // Stack only used for sub-pages (e.g. VISITOR_QR inside VISITOR_REGISTRATION)
  // Main pages are set directly (replacing current, not pushing)
  const [activeScreen, setActiveScreen] = useState<InternalScreen>('DASHBOARD');
  const [prevScreen, setPrevScreen] = useState<InternalScreen>('DASHBOARD');

  const goHome = useCallback(() => {
    setActiveScreen('DASHBOARD');
    setPrevScreen('DASHBOARD');
  }, []);

  const goTo = useCallback((screen: InternalScreen) => {
    // Main pages: remember DASHBOARD as parent
    setPrevScreen('DASHBOARD');
    setActiveScreen(screen);
  }, []);

  const pushSubPage = useCallback((screen: InternalScreen, parent: InternalScreen) => {
    // Sub-page: remember parent screen
    setPrevScreen(parent);
    setActiveScreen(screen);
  }, []);

  const goBack = useCallback(() => {
    if (activeScreen === 'DASHBOARD') return false;
    setActiveScreen(prevScreen);
    setPrevScreen('DASHBOARD');
    return true;
  }, [activeScreen, prevScreen]);

  // Hardware back
  useEffect(() => {
    const onBack = () => {
      if (activeScreen === 'DASHBOARD') return false; // let App.tsx handle (exit modal)
      goBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeScreen, goBack]);

  const handleNavigate = (screen: ScreenName) => {
    switch (screen) {
      case 'SECURITY_DASHBOARD':   goHome(); break;
      // Main pages — back goes to DASHBOARD
      case 'QR_SCANNER':           goTo('QR_SCANNER'); break;
      case 'VISITOR_REGISTRATION': goTo('VISITOR_REGISTRATION'); break;
      case 'VEHICLE_REGISTRATION': goTo('VEHICLE_REGISTRATION'); break;
      case 'SCAN_HISTORY':         goTo('SCAN_HISTORY'); break;
      case 'HOD_CONTACTS':         goTo('HOD_CONTACTS'); break;
      case 'PROFILE':              goTo('PROFILE'); break;
      case 'NOTIFICATIONS':        goTo('NOTIFICATIONS'); break;
      // Sub-pages — back goes to parent
      case 'VISITOR_QR':           pushSubPage('VISITOR_QR', 'VISITOR_REGISTRATION'); break;
      default:                     onNavigate(screen); break;
    }
  };

  switch (activeScreen) {
    case 'QR_SCANNER':
      return (
        <ModernQRScannerScreen
          security={security}
          onBack={goHome}
          onNavigate={handleNavigate}
        />
      );
    case 'VISITOR_REGISTRATION':
      return (
        <ModernVisitorRegistrationScreen
          security={security}
          onBack={goHome}
          onNavigate={handleNavigate}
        />
      );
    case 'VISITOR_QR':
      return (
        <SecurityVisitorQRScreen
          security={security}
          onBack={() => goBack()}
          onNavigate={handleNavigate}
        />
      );
    case 'VEHICLE_REGISTRATION':
      return (
        <ModernVehicleRegistrationScreen
          security={security}
          onBack={goHome}
          onNavigate={handleNavigate}
        />
      );
    case 'SCAN_HISTORY':
      return (
        <ModernScanHistoryScreen
          security={security}
          onBack={goHome}
          onNavigate={handleNavigate}
        />
      );
    case 'HOD_CONTACTS':
      return (
        <ModernHODContactsScreen
          security={security}
          onBack={goHome}
          onNavigate={handleNavigate}
        />
      );
    case 'PROFILE':
      return (
        <ProfileScreen
          user={security}
          userType="SECURITY"
          onBack={goHome}
          onLogout={onLogout}
        />
      );
    case 'NOTIFICATIONS':
      return (
        <NotificationsScreen
          userId={security.securityId}
          userType="security"
          onBack={goHome}
        />
      );
    default:
      return (
        <View style={{ flex: 1 }}>
          <NewSecurityDashboard
            user={security}
            onLogout={onLogout}
            onNavigate={handleNavigate}
          />
        </View>
      );
  }
};

export default SecurityDashboardContainer;
