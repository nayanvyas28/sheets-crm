import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/config';
import { View, Text, StyleSheet } from 'react-native';
import { useLeadsStore } from '../../store/leadsStore';

function TabBarIcon({ name, color, size }: { name: any; color: string; size: number }) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  const { getTodayFollowUps } = useLeadsStore();
  const todayFollowUps = getTodayFollowUps();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 65,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="grid-outline" color={color} size={size} />
          ),
          headerTitle: '📊 CRM Dashboard',
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="people-outline" color={color} size={size} />
          ),
          headerTitle: '👥 All Leads',
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Lead',
          tabBarIcon: ({ color, size }) => (
            <View style={styles.addButton}>
              <Ionicons name="add" size={28} color="#fff" />
            </View>
          ),
          tabBarLabel: () => null,
          headerTitle: '➕ New Lead',
        }}
      />
      <Tabs.Screen
        name="followups"
        options={{
          title: 'Calls',
          tabBarIcon: ({ color, size }) => (
            <View>
              <TabBarIcon name="call-outline" color={color} size={size} />
              {todayFollowUps.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{todayFollowUps.length}</Text>
                </View>
              )}
            </View>
          ),
          headerTitle: '📞 Aaj Ki Calls',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="settings-outline" color={color} size={size} />
          ),
          headerTitle: '⚙️ Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: COLORS.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
