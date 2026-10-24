import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme/ThemeContext.tsx';

type Icon = keyof typeof Ionicons.glyphMap;
const tab = (name: string, title: string, icon: Icon, active: Icon) => ({ name, title, icon, active });
const TABS = [
  tab('index', 'Home', 'home-outline', 'home'),
  tab('attendance', 'Attendance', 'stats-chart-outline', 'stats-chart'),
  tab('courses', 'Courses', 'book-outline', 'book'),
  tab('notices', 'Notices', 'megaphone-outline', 'megaphone'),
  tab('profile', 'Profile', 'person-outline', 'person'),
];

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs screenOptions={{
      headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textFaint,
      tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
    }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color, size, focused }) => <Ionicons name={focused ? t.active : t.icon} size={size} color={color} /> }} />
      ))}
    </Tabs>
  );
}
