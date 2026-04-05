import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import ContentCard from '../components/ContentCard';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<any, 'Result'>;

export default function ResultScreen({ navigation }: Props) {
  const { currentContent } = useAppStore();

  if (!currentContent) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>暂无生成内容</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>去创作</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <ContentCard content={currentContent} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.primaryButtonText}>继续创作</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText: { fontSize: fontSize.md, color: colors.textSecondary, marginBottom: spacing.lg },
  backButton: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
  backButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
  footer: { padding: spacing.lg, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  primaryButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '700' },
});
