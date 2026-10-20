import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { loadSavedAppsScriptUrl } from '../services/sheetsApi';
import { useLeadsStore } from '../store/leadsStore';
import { COLORS } from '../constants/config';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      // Pehle saved Google Sheet URL load karo, phir hi app chalao
      await loadSavedAppsScriptUrl();
      // Cached leads turant dikha do (instant open)
      await useLeadsStore.getState().hydrate();
      setReady(true);
      // Notifications background mein register ho jaye
      registerForPushNotificationsAsync().catch(() => {});
    })();
  }, []);

  if (!ready) {
    return (
      <GestureHandlerRootView style={[styles.container, styles.center]}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="lead/[id]"
          options={{
            title: 'Lead Details',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="lead/edit/[id]"
          options={{
            title: '✏️ Edit Lead',
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
});
