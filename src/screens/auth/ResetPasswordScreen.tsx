import React, { useState } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { colors } from '../../constants/colors';

export function ResetPasswordScreen({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (password.length < 8 || password !== confirmation) {
      Alert.alert('Check password', 'Use at least 8 characters and enter the same password twice.');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Password updated', 'Your new password has been saved.');
      onComplete();
    } catch {
      Alert.alert('Unable to update password', 'Request a new recovery link and try again.');
    } finally { setSaving(false); }
  };
  return <SafeAreaView style={styles.page}><View>
    <Text style={styles.title}>Set a new password</Text>
    <Input label="New password" secureTextEntry value={password} onChangeText={setPassword} autoCapitalize="none" />
    <Input label="Confirm password" secureTextEntry value={confirmation} onChangeText={setConfirmation} autoCapitalize="none" />
    <Button title="Save password" onPress={save} loading={saving} fullWidth />
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({ page: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: colors.background }, title: { fontSize: 24, marginBottom: 24, color: colors.textPrimary } });
