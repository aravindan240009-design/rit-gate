import React from 'react';
import { PermissionsAndroid, Platform, ViewStyle, StyleSheet } from 'react-native';
import { Camera as RNCameraKit } from 'react-native-camera-kit';

export const CameraModule = {
  async requestCameraPermissionsAsync(): Promise<{ status: 'granted' | 'denied' }> {
    if (Platform.OS !== 'android') {
      return { status: 'granted' };
    }
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    return { status: result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied' };
  },
};

// Map Expo Camera barcode type strings → react-native-camera-kit format strings
const EXPO_TO_RN_CAMERA_KIT: Record<string, string> = {
  qr: 'qr',
  code128: 'code-128',
  code39: 'code-39',
  code93: 'code-93',
  codabar: 'codabar',
  ean13: 'ean-13',
  ean8: 'ean-8',
  itf14: 'itf',
  'upc_a': 'upc-a',
  'upc_e': 'upc-e',
  pdf417: 'pdf-417',
  aztec: 'aztec',
  datamatrix: 'data-matrix',
};

// All barcode types supported by react-native-camera-kit on Android
const ALL_BARCODE_TYPES = [
  'qr',
  'code-128',
  'code-39',
  'code-93',
  'codabar',
  'ean-13',
  'ean-8',
  'itf',
  'upc-a',
  'upc-e',
  'pdf-417',
  'aztec',
  'data-matrix',
];

type CameraViewProps = {
  style?: ViewStyle;
  facing?: 'front' | 'back';
  onBarcodeScanned?: (event: { data: string }) => void;
  barcodeScannerSettings?: { barcodeTypes?: string[] };
  children?: React.ReactNode;
};

export const CameraView: React.FC<CameraViewProps> = ({
  style,
  facing = 'back',
  onBarcodeScanned,
  barcodeScannerSettings,
  children,
}) => {
  // Map Expo-style type strings to react-native-camera-kit format strings
  // If no types specified, scan everything
  const mappedTypes = barcodeScannerSettings?.barcodeTypes
    ? barcodeScannerSettings.barcodeTypes
        .map(t => EXPO_TO_RN_CAMERA_KIT[t] ?? t)
        .filter(Boolean)
    : ALL_BARCODE_TYPES;

  return (
    <>
      <RNCameraKit
        style={[StyleSheet.absoluteFill, style]}
        cameraType={facing as any}
        scanBarcode
        showFrame={false}
        allowedBarcodeTypes={mappedTypes as any}
        onReadCode={(event: any) => {
          const raw = event?.nativeEvent?.codeStringValue;
          // Trim whitespace/control characters that barcode scanners sometimes append
          const data = raw ? raw.trim().replace(/[\x00-\x1F\x7F]/g, '') : raw;
          console.log('📷 [CAMERA-KIT] Raw barcode value:', JSON.stringify(raw));
          console.log('📷 [CAMERA-KIT] Cleaned barcode value:', JSON.stringify(data));
          if (data && onBarcodeScanned) {
            onBarcodeScanned({ data });
          }
        }}
      />
      {children}
    </>
  );
};

export { CameraModule as Camera };
