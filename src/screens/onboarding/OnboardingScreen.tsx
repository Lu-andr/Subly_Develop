// Subly — Onboarding Screen (3 Interactive Mascot-Powered Starter Slides)
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { ExpoSecureStoreAdapter } from '../../lib/secureStoreAdapter';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, shadow, spacing } from '../../constants/spacing';
import { Button } from '../../components/ui/Button';
import { AnimatedMascot } from '../../components/ui/AnimatedMascot';
import { analytics } from '../../services/analyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ONBOARDING_KEY = 'subly_onboarding_done';

interface SlideData {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  featurePill: string;
  mascotMood: 'happy' | 'alert' | 'celebrating';
  bubbleText: string;
  bgGradient: string;
}

const SLIDES: SlideData[] = [
  {
    id: '1',
    tag: 'MEET SUBLY',
    title: 'Track Every Free Trial',
    subtitle: 'Keep billing dates visible',
    description:
      'Add your streaming, app, and software trials in seconds. Subly helps you track dates and schedules reminders on your device.',
    featurePill: '✨ 1-Tap Popular Presets • 📩 Receipt Auto-Parser',
    mascotMood: 'happy',
    bubbleText: "I'm Subly, your trial guardian! 👋",
    bgGradient: '#FFF5EB',
  },
  {
    id: '2',
    tag: 'TIMELY ALERTS',
    title: 'Never Miss a Deadline',
    subtitle: 'Nudges before you get billed',
    description:
      'Receive timely alerts 7 days, 3 days, and 24 hours before your trial converts into a paid renewal.',
    featurePill: '⏰ Multi-Stage Reminders • 🛡️ Money at Risk Ticker',
    mascotMood: 'alert',
    bubbleText: '3 days left! Cancel now? ⏳',
    bgGradient: '#FEF3C7',
  },
  {
    id: '3',
    tag: 'SAVE THOUSANDS',
    title: '1-Tap Direct Cancellation',
    subtitle: 'Direct portal navigation',
    description:
      'Jump straight to the provider’s cancellation portal with one tap. No more hunting through confusing account settings.',
    featurePill: '📊 Track amounts • Review your history',
    mascotMood: 'celebrating',
    bubbleText: 'Review your cancelled trials 📋',
    bgGradient: '#F0FDF4',
  },
];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const markDone = async () => {
    try {
      await ExpoSecureStoreAdapter.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    analytics.track('onboarding_completed');
    onComplete();
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    } else {
      markDone();
    }
  };

  const handleSkip = () => markDone();

  const isLast = activeIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: { item: SlideData }) => (
    <View style={styles.slide}>
      {/* Hero Mascot Bubble Card */}
      <View style={[styles.mascotHeroContainer, { backgroundColor: item.bgGradient }]}>
        <AnimatedMascot
          size={120}
          mood={item.mascotMood}
          bubbleText={item.bubbleText}
          interactive={true}
        />
        <Text style={styles.tapHintText}>Tap Subly for fun surprises!</Text>
      </View>

      {/* Slide Text Content */}
      <View style={styles.textContent}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>

        <View style={styles.featurePill}>
          <Text style={styles.featurePillText}>{item.featurePill}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Skip Button */}
      {!isLast && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides View */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(e) => {
          const newIndex = Math.round(
            e.nativeEvent.contentOffset.x / SCREEN_WIDTH
          );
          setActiveIndex(newIndex);
        }}
        style={styles.flatList}
      />

      {/* Bottom Controls Bar */}
      <View style={styles.bottomBar}>
        {/* Animated Dot Indicators */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const dotWidth = scrollX.interpolate({
              inputRange: [
                (i - 1) * SCREEN_WIDTH,
                i * SCREEN_WIDTH,
                (i + 1) * SCREEN_WIDTH,
              ],
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotColor = scrollX.interpolate({
              inputRange: [
                (i - 1) * SCREEN_WIDTH,
                i * SCREEN_WIDTH,
                (i + 1) * SCREEN_WIDTH,
              ],
              outputRange: [colors.gray300, colors.primary, colors.gray300],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { width: dotWidth, backgroundColor: dotColor },
                ]}
              />
            );
          })}
        </View>

        {/* CTA Button */}
        <Button
          title={isLast ? 'Get Started 🚀' : 'Continue →'}
          onPress={handleNext}
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
};

export async function isOnboardingDone(): Promise<boolean> {
  try {
    const value = await ExpoSecureStoreAdapter.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    position: 'absolute',
    top: 52,
    right: spacing.xl,
    zIndex: 10,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: borderRadius.full,
  },
  skipText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.gray600,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  mascotHeroContainer: {
    width: '100%',
    height: 240,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    ...shadow.sm,
  },
  tapHintText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  textContent: {
    alignItems: 'center',
    width: '100%',
  },
  tagBadge: {
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.sm,
  },
  tagText: {
    fontSize: 10,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  featurePill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  featurePillText: {
    fontSize: 11,
    fontFamily: typography.fontFamily.medium,
    color: colors.gray700,
  },
  bottomBar: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: borderRadius.full,
  },
});
