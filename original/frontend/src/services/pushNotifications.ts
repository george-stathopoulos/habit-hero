// Push Notification Service for Habit Hero
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Configure how notifications are displayed when app is in foreground
export const setupNotificationHandler = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
};

// Request permissions and get push token
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log('Push notifications must be tested on a physical device');
      return null;
    }

    // Set up Android notification channel first
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFB347',
        sound: 'default',
      });
      
      // Channel for help requests
      await Notifications.setNotificationChannelAsync('help-requests', {
        name: 'Αιτήματα Βοήθειας',
        description: 'Ειδοποιήσεις όταν το παιδί σας ζητά βοήθεια',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#4A90D9',
        sound: 'default',
      });
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }

    // Handle permission denial
    if (finalStatus !== 'granted') {
      console.log('Push notification permission was denied');
      return null;
    }

    // Get the project ID from the Expo config
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    
    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });

    console.log('Expo Push Token:', tokenData.data);
    return tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

// Send push token to backend for storage
export async function sendPushTokenToBackend(pushToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/parent/me/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        push_token: pushToken,
        platform: Platform.OS,
        device_name: Device.modelName || 'Unknown Device',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to register token: ${errorData.detail || response.statusText}`);
    }

    const data = await response.json();
    console.log('Push token registered successfully:', data);
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

// Combined function to register and send token
export async function initializePushNotifications(): Promise<string | null> {
  setupNotificationHandler();
  
  const token = await registerForPushNotificationsAsync();
  
  if (token) {
    await sendPushTokenToBackend(token);
  }
  
  return token;
}

// Add notification listeners
export function addNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  const receivedListener = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    onNotificationReceived?.(notification);
  });

  const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);
    onNotificationTapped?.(response);
  });

  return () => {
    Notifications.removeNotificationSubscription(receivedListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}
