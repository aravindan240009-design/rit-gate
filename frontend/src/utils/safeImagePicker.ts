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
  // Load native module at runtime to avoid hard crash when module is unavailable.
  imagePicker = require("expo-image-picker");
} catch (_error) {
  imagePicker = fallbackImagePicker;
}

export default imagePicker;
