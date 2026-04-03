import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

interface Props {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible, message = 'AI 创作中...' }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.hint}>预计 10-30 秒</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: colors.card, borderRadius: 16, padding: spacing.xl, alignItems: 'center', minWidth: 200 },
  message: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginTop: spacing.md },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
});
