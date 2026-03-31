type PermissionResult = {
  status: "granted" | "denied" | "undetermined";
  granted: boolean;
  canAskAgain: boolean;
};

const defaultPermissionResult: PermissionResult = {
  status: "denied",
  granted: false,
  canAskAgain: true,
};

const fallbackImagePicker: any = {
  MediaTypeOptions: {
    Images: "images",
  },
  async requestCameraPermissionsAsync(): Promise<PermissionResult> {
    return defaultPermissionResult;
  },
  async requestMediaLibraryPermissionsAsync(): Promise<PermissionResult> {
    return defaultPermissionResult;
  },
  async launchCameraAsync(_options?: any): Promise<{ canceled: true; assets: any[] }> {
    return { canceled: true, assets: [] };
  },
  async launchImageLibraryAsync(_options?: any): Promise<{ canceled: true; assets: any[] }> {
    return { canceled: true, assets: [] };
  },
};

let imagePicker: any = fallbackImagePicker;

try {
  const nativePicker = require('react-native-image-picker');
  imagePicker = {
    MediaTypeOptions: {
      Images: 'photo',
    },
    async requestCameraPermissionsAsync(): Promise<PermissionResult> {
      return { status: 'granted', granted: true, canAskAgain: true };
    },
    async requestMediaLibraryPermissionsAsync(): Promise<PermissionResult> {
      return { status: 'granted', granted: true, canAskAgain: true };
    },
    async launchCameraAsync(options?: any) {
      const result = await nativePicker.launchCamera({
        mediaType: 'photo',
        includeBase64: !!options?.base64,
        quality: options?.quality ?? 0.8,
      });
      if (result.didCancel || !result.assets?.length) {
        return { canceled: true, assets: [] };
      }
      return { canceled: false, assets: result.assets };
    },
    async launchImageLibraryAsync(options?: any) {
      const result = await nativePicker.launchImageLibrary({
        mediaType: 'photo',
        includeBase64: !!options?.base64,
        quality: options?.quality ?? 0.8,
        selectionLimit: 1,
      });
      if (result.didCancel || !result.assets?.length) {
        return { canceled: true, assets: [] };
      }
      return { canceled: false, assets: result.assets };
    },
  };
} catch (_error) {
  imagePicker = fallbackImagePicker;
}

export default imagePicker;
