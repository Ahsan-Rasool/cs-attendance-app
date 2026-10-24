import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { TimetableEntry } from '../api/types.ts';
import type { DayKey } from './customTimetable.ts';
import { buildReminders } from './remindersPlan.ts';

const CHANNEL = 'class-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export type PermissionState = 'granted' | 'denied';

/** Asks for the Android 13+ / iOS notification permission and creates the channel. */
export async function requestReminderPermission(): Promise<PermissionState> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: 'Class reminders', importance: Notifications.AndroidImportance.HIGH, lightColor: '#14397d',
    });
  }
  let s = await Notifications.getPermissionsAsync();
  if (!s.granted) s = await Notifications.requestPermissionsAsync();
  return s.granted ? 'granted' : 'denied';
}

export async function cancelReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** Replaces every scheduled reminder with the current timetable. Returns how many were scheduled. */
export async function syncReminders(week: Record<DayKey, TimetableEntry[]>, leadMinutes: number): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const items = buildReminders(week, leadMinutes);
  for (const r of items) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: r.weekday, hour: r.hour, minute: r.minute, channelId: CHANNEL },
    });
  }
  return items.length;
}
