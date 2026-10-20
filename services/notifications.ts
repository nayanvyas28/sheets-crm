import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications only work on physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('followup', {
      name: 'Follow-up Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6c63ff',
    });
  }

  return true;
}

// Follow-up reminder schedule karo
export async function scheduleFollowUpReminder(
  leadId: string,
  leadName: string,
  followUpDate: string
): Promise<string | null> {
  try {
    // Cancel existing reminder for this lead
    await cancelFollowUpReminder(leadId);

    const date = new Date(followUpDate);
    if (isNaN(date.getTime()) || date <= new Date()) {
      return null;
    }

    // Exact call time pe notification
    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📞 Call karne ka time!',
        body: `${leadName} ko abhi call karo`,
        data: { leadId, type: 'followup' },
        sound: true,
      },
      trigger: {
        date,
        channelId: 'followup',
      },
    });

    console.log(`Reminder set for ${leadName} at ${date.toLocaleString()}`);
    return notifId;
  } catch (error) {
    console.error('Schedule notification error:', error);
    return null;
  }
}

export async function cancelFollowUpReminder(leadId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(
    (n) => n.content.data?.leadId === leadId
  );
  for (const notif of toCancel) {
    await Notifications.cancelScheduledNotificationAsync(notif.identifier);
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
