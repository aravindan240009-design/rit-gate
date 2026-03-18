// Push notifications are not used — in-app polling via notifications table only.
export async function initPushNotifications(_userId: string, _userType: string): Promise<void> {}
export async function registerForPushNotifications(): Promise<null> { return null; }
export async function savePushTokenToBackend(): Promise<void> {}
