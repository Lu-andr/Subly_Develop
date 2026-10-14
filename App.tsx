// TrialGuard — Root App.tsx
import 'react-native-url-polyfill/auto';
import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar, Alert, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// Screens
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen, isOnboardingDone } from './src/screens/onboarding/OnboardingScreen';
import { AppNavigator } from './src/navigation/AppNavigator';

// Hooks & Services
import { clearLocalData, LOCAL_USER_ID } from './src/services/localStore';
import { cancelAllTrialNotifications } from './src/services/notificationService';
import {
  setupNotificationResponseHandler,
} from './src/services/notificationService';
import { analytics } from './src/services/analyticsService';
import * as Notifications from 'expo-notifications';
import { colors } from './src/constants/colors';

type AppFlow = 'splash' | 'onboarding' | 'app';

// ─── Inner component that uses auth hook ─────────────────
const AppInner: React.FC = () => {
  const [dataEpoch, setDataEpoch] = useState(0);
  const [notificationTrialId, setNotificationTrialId] = useState<string | null>(null);
  const onNotificationHandled = useCallback(() => setNotificationTrialId(null), []);
  const [flow, setFlow] = useState<AppFlow>('splash');
  const [splashDone, setSplashDone] = useState(false);

  // Set up notification response handler (deep link)
  useEffect(() => {
    const cleanup = setupNotificationResponseHandler((trialId) => {
      analytics.track('notification_opened', { trialId });
      setNotificationTrialId(trialId);
    });
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      const id = response?.notification.request.content.data?.trialId;
      if (typeof id === 'string') setNotificationTrialId(id);
      void Notifications.clearLastNotificationResponseAsync();
    }).catch(() => {});
    return cleanup;
  }, []);

  useEffect(() => {
    if (!splashDone) return;
    let active = true;
    isOnboardingDone().then(done => { if (active) setFlow(done ? 'app' : 'onboarding'); })
      .catch(() => { if (active) setFlow('onboarding'); });
    return () => { active = false; };
  }, [splashDone]);
  const handleClearData = useCallback(async () => {
    await cancelAllTrialNotifications();
    await clearLocalData();
    setDataEpoch(v => v + 1);
  }, []);

  const finishSplash = useCallback(() => setSplashDone(true), []);

  // Splash
  if (flow === 'splash' || (!splashDone)) {
    return (
      <SplashScreen
        onFinish={finishSplash}
      />
    );
  }

  // Onboarding
  if (flow === 'onboarding') {
    return <OnboardingScreen onComplete={() => setFlow('app')} />;
  }

  // Authenticated App
  return (
    <NavigationContainer>
      <AppNavigator
        key={dataEpoch}
        userId={LOCAL_USER_ID}
        profile={null}
        onClearData={handleClearData}
        notificationTrialId={notificationTrialId}
        onNotificationHandled={onNotificationHandled}
      />
    </NavigationContainer>
  );
};

// ─── Root export ──────────────────────────────────────────
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    // Minimal loading while fonts download
    return (
      <View style={styles.fontLoader}>
        <Text style={styles.fontLoaderText}>Loading...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background}
          translucent={false}
        />
        <AppInner />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fontLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  fontLoaderText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
