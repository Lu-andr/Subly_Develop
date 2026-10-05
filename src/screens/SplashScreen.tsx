// Subly — Splash Screen with Animated Mascot
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { spacing } from '../constants/spacing';
import { AnimatedMascot } from '../components/ui/AnimatedMascot';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const mascotScale = useRef(new Animated.Value(0.5)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let finishTimer: ReturnType<typeof setTimeout> | undefined;
    const animation = Animated.sequence([
      // Mascot spring in
      Animated.parallel([
        Animated.spring(mascotScale, {
          toValue: 1,
          tension: 70,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(mascotOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // App name fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 350,
        delay: 50,
        useNativeDriver: true,
      }),
      // Tagline & badge
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]);
    animation.start(({ finished }) => {
      // Complete splash after 1.8s
      if (finished) finishTimer = setTimeout(onFinish, 900);
    });
    return () => { animation.stop(); if (finishTimer) clearTimeout(finishTimer); };
  }, [mascotScale, mascotOpacity, textOpacity, taglineOpacity, badgeOpacity, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Animated Mascot Hero */}
      <Animated.View
        style={[
          styles.mascotContainer,
          { opacity: mascotOpacity, transform: [{ scale: mascotScale }] },
        ]}
      >
        <AnimatedMascot size={110} mood="guarding" interactive={false} />
      </Animated.View>

      {/* App Name */}
      <Animated.View style={[styles.nameContainer, { opacity: textOpacity }]}>
        <Text style={styles.appName}>Subly</Text>
        <View style={styles.proPill}>
          <Text style={styles.proPillText}>PROTECT</Text>
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Track every trial. Never pay by surprise.
      </Animated.Text>

      {/* Security Tag */}
      <Animated.View style={[styles.securityBadge, { opacity: badgeOpacity }]}>
        <Text style={styles.securityText}>🛡️ Automated Trial Guardian</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  mascotContainer: {
    marginBottom: spacing.xl,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  appName: {
    fontSize: 40,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  proPill: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  proPillText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  tagline: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.5,
    marginBottom: spacing['2xl'],
  },
  securityBadge: {
    position: 'absolute',
    bottom: 48,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  securityText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.gray600,
  },
});
