// TrialGuard — Add/Edit Trial Screen
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Trial, TrialFormData, BillingCycle, Currency } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { borderRadius, spacing, shadow } from '../../constants/spacing';
import { CURRENCY_OPTIONS, formatCurrency } from '../../utils/currencyUtils';
import { validateTrialForm, hasErrors } from '../../utils/validationUtils';
import { toISODateString, formatDate, parseLocalDate } from '../../utils/dateUtils';
import { SERVICE_PRESETS, ServicePreset } from '../../constants/servicePresets';
import { parseTrialConfirmation } from '../../utils/textParser';

interface AddTrialScreenProps {
  existingTrial?: Trial; // If provided, it's edit mode
  onSave: (data: TrialFormData) => Promise<void>;
  onCancel: () => void;
}

const BILLING_CYCLES: { label: string; value: BillingCycle }[] = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
  { label: 'Custom', value: 'custom' },
];

const POPULAR_SERVICES = [
  'Spotify', 'Netflix', 'Canva', 'ChatGPT', 'Adobe', 'YouTube Premium',
  'Amazon Prime', 'Microsoft 365', 'Notion', 'Figma', 'Grammarly', 'Headspace',
];

type DateField = 'start' | 'end';

export const AddTrialScreen: React.FC<AddTrialScreenProps> = ({
  existingTrial,
  onSave,
  onCancel,
}) => {
  const isEdit = !!existingTrial;
  const today = new Date();

  const [serviceName, setServiceName] = useState(existingTrial?.service_name ?? '');
  const [startDate, setStartDate] = useState<Date>(
    existingTrial ? parseLocalDate(existingTrial.trial_start_date) : today
  );
  const [endDate, setEndDate] = useState<Date>(
    existingTrial ? parseLocalDate(existingTrial.trial_end_date) : (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    })()
  );
  const [chargeAmount, setChargeAmount] = useState(
    existingTrial ? String(existingTrial.charge_amount) : ''
  );
  const [currency, setCurrency] = useState<Currency>(existingTrial?.currency ?? 'ZAR');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    existingTrial?.billing_cycle ?? 'monthly'
  );
  const [cancellationUrl, setCancellationUrl] = useState(existingTrial?.cancellation_url ?? '');
  const [notes, setNotes] = useState(existingTrial?.notes ?? '');
  const [errors, setErrors] = useState<ReturnType<typeof validateTrialForm>>({});
  const [saving, setSaving] = useState(false);

  // Automation state
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [autoFillSuccessMsg, setAutoFillSuccessMsg] = useState<string | null>(null);

  const handleSelectPreset = (preset: ServicePreset) => {
    setSelectedPresetId(preset.id);
    setServiceName(preset.name);
    const start = new Date();
    setStartDate(start);
    const end = new Date();
    end.setDate(end.getDate() + preset.trialDays);
    setEndDate(end);
    setChargeAmount('');
    setCurrency(preset.currency as Currency);
    setBillingCycle(preset.billingCycle);
    setCancellationUrl(preset.cancellationUrl);
    setAutoFillSuccessMsg(`Selected ${preset.name}. Enter your actual price and verify the dates.`);
  };

  const handleParseText = () => {
    if (!pastedText.trim()) return;
    const parsed = parseTrialConfirmation(pastedText);
    if (parsed.serviceName) setServiceName(parsed.serviceName);
    if (parsed.chargeAmount !== undefined) setChargeAmount(String(parsed.chargeAmount));
    if (parsed.currency) setCurrency(parsed.currency as Currency);
    if (parsed.endDate) setEndDate(parsed.endDate);
    if (parsed.billingCycle) setBillingCycle(parsed.billingCycle);
    if (parsed.cancellationUrl) setCancellationUrl(parsed.cancellationUrl);

    const highlights: string[] = [];
    if (parsed.serviceName) highlights.push(parsed.serviceName);
    if (parsed.trialDays) highlights.push(`${parsed.trialDays} days free`);
    if (parsed.chargeAmount !== undefined) highlights.push(formatCurrency(parsed.chargeAmount, (parsed.currency ?? currency) as Currency));

    if (highlights.length > 0) {
      setAutoFillSuccessMsg(`Extracted: ${highlights.join(' • ')}`);
      setShowPasteBox(false);
      setPastedText('');
    } else {
      Alert.alert('Notice', 'Could not detect subscription details in the pasted text. Please enter them manually below.');
    }
  };

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateField, setActiveDateField] = useState<DateField>('start');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const openDatePicker = (field: DateField) => {
    setActiveDateField(field);
    setShowDatePicker(true);
  };

  const handleDateValueChange = (_event: any, selected: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selected) {
      if (activeDateField === 'start') setStartDate(selected);
      else setEndDate(selected);
    }
  };

  const handleDateDismiss = () => {
    setShowDatePicker(false);
  };

  const handleSave = async () => {
    const formErrors = validateTrialForm({
      service_name: serviceName,
      trial_start_date: startDate,
      trial_end_date: endDate,
      charge_amount: chargeAmount,
      cancellation_url: cancellationUrl,
    });
    setErrors(formErrors);
    if (hasErrors(formErrors)) return;

    setSaving(true);
    try {
      await onSave({
        service_name: serviceName,
        trial_start_date: startDate,
        trial_end_date: endDate,
        charge_amount: chargeAmount,
        currency,
        billing_cycle: billingCycle,
        cancellation_url: cancellationUrl,
        notes,
      });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Something went wrong while saving your trial. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cancel">
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{isEdit ? 'Edit Trial' : 'Add Trial'}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Automation Section (only in Add mode) */}
          {!isEdit && (
            <View style={styles.automationContainer}>
              {/* Auto-fill success feedback */}
              {autoFillSuccessMsg && (
                <View style={styles.successBanner}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.successBannerText}>{autoFillSuccessMsg}</Text>
                  <TouchableOpacity onPress={() => setAutoFillSuccessMsg(null)}>
                    <Ionicons name="close-circle" size={18} color={colors.gray500} />
                  </TouchableOpacity>
                </View>
              )}

              {/* 1-Tap Presets Header */}
              <View style={styles.automationHeader}>
                <View style={styles.automationHeaderTitleRow}>
                  <Ionicons name="flash" size={16} color={colors.primary} />
                  <Text style={styles.automationTitle}>1-TAP POPULAR TRIALS</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowPasteBox(!showPasteBox)}
                  style={styles.pasteToggleBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="clipboard-outline" size={14} color={colors.primary} />
                  <Text style={styles.pasteToggleText}>
                    {showPasteBox ? 'Close' : 'Paste Email / SMS'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Paste Confirmation Text Box */}
              {showPasteBox && (
                <View style={styles.pasteCard}>
                  <Text style={styles.pasteInstruction}>
                    Paste any receipt email or SMS to auto-extract details:
                  </Text>
                  <TextInput
                    style={styles.pasteInput}
                    placeholder="e.g. Your Example plan renews on Oct 25, 2026 at ZAR 199.99 per month."
                    placeholderTextColor={colors.gray400}
                    multiline
                    numberOfLines={3}
                    value={pastedText}
                    onChangeText={setPastedText}
                  />
                  <TouchableOpacity
                    style={[styles.autoFillBtn, !pastedText.trim() && styles.autoFillBtnDisabled]}
                    onPress={handleParseText}
                    disabled={!pastedText.trim()}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="sparkles" size={15} color={colors.white} />
                    <Text style={styles.autoFillBtnText}>Auto-Fill Details</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Horizontal Presets Scroller */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.presetsScroller}
              >
                {SERVICE_PRESETS.map((p) => {
                  const isSelected = selectedPresetId === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.presetCard,
                        isSelected && styles.presetCardSelected,
                      ]}
                      onPress={() => handleSelectPreset(p)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.presetBadge, { backgroundColor: p.brandColor + '18' }]}>
                        <Text style={[styles.presetBadgeText, { color: p.brandColor }]}>
                          {p.badge}
                        </Text>
                      </View>
                      <View style={[styles.presetIcon, { backgroundColor: p.brandColor }]}>
                        <Text style={styles.presetIconText}>{p.iconLetter}</Text>
                      </View>
                      <Text style={styles.presetName} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={styles.presetPrice}>
                        Enter your plan price
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Service Name */}
          <Input
            label="Service Name *"
            value={serviceName}
            onChangeText={(t) => { setServiceName(t); setShowSuggestions(t.length > 0); }}
            placeholder="e.g. Spotify, ChatGPT..."
            error={errors.service_name}
            returnKeyType="next"
            autoCapitalize="words"
            accessibilityLabel="Service name"
          />

          {/* Popular suggestions */}
          {showSuggestions && !isEdit && (
            <View style={styles.suggestions}>
              {POPULAR_SERVICES.filter((s) =>
                s.toLowerCase().includes(serviceName.toLowerCase())
              )
                .slice(0, 4)
                .map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={styles.suggestionChip}
                    onPress={() => { setServiceName(s); setShowSuggestions(false); }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${s}`}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Dates */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>START DATE *</Text>
              <TouchableOpacity
                style={[styles.dateBtn, errors.trial_start_date ? styles.dateBtnError : null]}
                onPress={() => openDatePicker('start')}
                accessibilityRole="button"
                accessibilityLabel={`Start date: ${formatDate(toISODateString(startDate))}`}
              >
                <Text style={styles.dateBtnText}>{formatDate(toISODateString(startDate))}</Text>
              </TouchableOpacity>
              {errors.trial_start_date && (
                <Text style={styles.fieldError}>{errors.trial_start_date}</Text>
              )}
            </View>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>END DATE *</Text>
              <TouchableOpacity
                style={[styles.dateBtn, errors.trial_end_date ? styles.dateBtnError : null]}
                onPress={() => openDatePicker('end')}
                accessibilityRole="button"
                accessibilityLabel={`End date: ${formatDate(toISODateString(endDate))}`}
              >
                <Text style={styles.dateBtnText}>{formatDate(toISODateString(endDate))}</Text>
              </TouchableOpacity>
              {errors.trial_end_date && (
                <Text style={styles.fieldError}>{errors.trial_end_date}</Text>
              )}
            </View>
          </View>

          {/* Amount + Currency */}
          <View style={styles.row}>
            <View style={[styles.halfField, { flex: 2 }]}>
              <Input
                label="Charge Amount *"
                value={chargeAmount}
                onChangeText={setChargeAmount}
                placeholder="0"
                keyboardType="decimal-pad"
                error={errors.charge_amount}
                accessibilityLabel="Charge amount"
                containerStyle={{ marginBottom: 0 }}
              />
            </View>
            <View style={[styles.halfField, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>CURRENCY</Text>
              <TouchableOpacity
                style={styles.dateBtn}
                onPress={() => setShowCurrencyPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={`Currency: ${currency}`}
              >
                <Text style={styles.dateBtnText}>{currency}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Billing Cycle */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>BILLING CYCLE</Text>
            <View style={styles.cycleRow}>
              {BILLING_CYCLES.map((cycle) => (
                <TouchableOpacity
                  key={cycle.value}
                  style={[
                    styles.cycleChip,
                    billingCycle === cycle.value && styles.cycleChipActive,
                  ]}
                  onPress={() => setBillingCycle(cycle.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: billingCycle === cycle.value }}
                  accessibilityLabel={cycle.label}
                >
                  <Text
                    style={[
                      styles.cycleChipText,
                      billingCycle === cycle.value && styles.cycleChipTextActive,
                    ]}
                  >
                    {cycle.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cancellation URL */}
          <Input
            label="Cancellation URL (optional)"
            value={cancellationUrl}
            onChangeText={setCancellationUrl}
            placeholder="https://example.com/cancel"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.cancellation_url}
            hint="Where to cancel this subscription"
            accessibilityLabel="Cancellation URL"
          />

          {/* Notes */}
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional details..."
            multiline
            numberOfLines={3}
            style={styles.notesInput}
            accessibilityLabel="Notes"
          />

          {/* Save button */}
          <Button
            title={isEdit ? 'Save Changes' : 'Save Trial'}
            onPress={handleSave}
            loading={saving}
            fullWidth
            size="lg"
            style={styles.saveBtn}
          />
        </ScrollView>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={activeDateField === 'start' ? startDate : endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onValueChange={handleDateValueChange}
            onDismiss={handleDateDismiss}
            minimumDate={activeDateField === 'end' ? startDate : undefined}
          />
        )}

        {/* Currency Modal */}
        <Modal visible={showCurrencyPicker} onRequestClose={() => setShowCurrencyPicker(false)} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select Currency</Text>
              {CURRENCY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.modalOption,
                    currency === opt.value && styles.modalOptionActive,
                  ]}
                  onPress={() => { setCurrency(opt.value); setShowCurrencyPicker(false); }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: currency === opt.value }}
                  accessibilityLabel={opt.label}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      currency === opt.value && styles.modalOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {currency === opt.value && <Text style={styles.checkMark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  cancelText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    width: 60,
  },
  screenTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
  },
  content: {
    padding: spacing.base,
    paddingBottom: spacing['4xl'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.base,
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  fieldError: {
    fontSize: typography.fontSize.sm,
    color: colors.danger,
    marginTop: 3,
    fontFamily: typography.fontFamily.regular,
  },
  dateBtn: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  dateBtnError: {
    borderColor: colors.danger,
  },
  dateBtnText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  fieldGroup: {
    marginBottom: spacing.base,
  },
  cycleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  cycleChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  cycleChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  cycleChipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  cycleChipTextActive: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: spacing.md,
  },
  saveBtn: {
    marginTop: spacing.sm,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: -spacing.sm,
    marginBottom: spacing.base,
  },
  suggestionChip: {
    backgroundColor: colors.primaryBg,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  suggestionText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  // Currency Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray300,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalOptionActive: {
    backgroundColor: colors.primaryBg,
    marginHorizontal: -spacing.xl,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  modalOptionText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.textPrimary,
  },
  modalOptionTextActive: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semiBold,
  },
  checkMark: {
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: '700',
  },
  // Automation styles
  automationContainer: {
    marginBottom: spacing.lg,
  },
  automationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  automationHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  automationTitle: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.gray600,
    letterSpacing: 0.8,
  },
  pasteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
  },
  pasteToggleText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.primary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.successLight,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  successBannerText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.success,
  },
  pasteCard: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pasteInstruction: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  pasteInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textPrimary,
    minHeight: 65,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  autoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  autoFillBtnDisabled: {
    backgroundColor: colors.gray300,
  },
  autoFillBtnText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.white,
  },
  presetsScroller: {
    paddingVertical: 4,
    gap: spacing.sm,
  },
  presetCard: {
    width: 124,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  presetCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryBgLight,
  },
  presetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  presetBadgeText: {
    fontSize: 9,
    fontFamily: typography.fontFamily.bold,
  },
  presetIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  presetIconText: {
    fontSize: 15,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  presetName: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  presetPrice: {
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    color: colors.textMuted,
  },
});
