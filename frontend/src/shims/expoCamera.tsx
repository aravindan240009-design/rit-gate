import React from 'react';
import { PermissionsAndroid, Platform, ViewStyle, View, StyleSheet } from 'react-native';
import { Camera } from 'react-native-camera-kit';

type CameraFacing = 'front' | 'back';

export const CameraModule = {
  async requestCameraPermissionsAsync(): Promise<{ status: 'granted' | 'denied' }> {
    if (Platform.OS !== 'android') {
      return { status: 'granted' };
    }
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
    return { status: result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied' };
  },
};

type CameraViewProps = {
  style?: ViewStyle;
  facing?: CameraFacing;
  onBarcodeScanned?: (event: { data: string }) => void;
  barcodeScannerSettings?: { barcodeTypes?: string[] };
  children?: React.ReactNode;
};

export const CameraView: React.FC<CameraViewProps> = ({ style, facing = 'back', onBarcodeScanned, children }) => {
  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <Camera
        style={StyleSheet.absoluteFill}
        cameraType={facing as any}
        scanBarcode
        showFrame={false}
        onReadCode={(event: any) => {
          const data = event?.nativeEvent?.codeStringValue;
          if (data && onBarcodeScanned) {
            onBarcodeScanned({ data });
          }
        }}
      />
      {children}
    </View>
  );
};

export { CameraModule as Camera };
