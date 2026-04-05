import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { GeneratedContent } from '../types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

interface Props {
  content: GeneratedContent;
}

export default function ContentCard({ content }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    Clipboard.setString(text);
    setCopied(label);
    Alert.alert('复制成功', `${label}已复制到剪贴板`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>标题</Text>
          <TouchableOpacity onPress={() => handleCopy(content.title, '标题')}>
            <Text style={styles.copyButton}>{copied === '标题' ? '✓ 已复制' : '📋 复制'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{content.title}</Text>
      </View>

      {/* 正文 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>正文</Text>
          <TouchableOpacity onPress={() => handleCopy(content.body, '正文')}>
            <Text style={styles.copyButton}>{copied === '正文' ? '✓ 已复制' : '📋 复制'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.body}>{content.body}</Text>
      </View>

      {/* 标签 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>推荐标签</Text>
          <TouchableOpacity onPress={() => handleCopy(content.tags.join(' '), '标签')}>
            <Text style={styles.copyButton}>{copied === '标签' ? '✓ 已复制' : '📋 复制'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tags}>
          {content.tags.map((tag, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 建议 */}
      {content.suggestions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>优化建议</Text>
          <View style={styles.suggestionsBox}>
            <Text style={styles.suggestions}>{content.suggestions}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' },
  copyButton: { fontSize: fontSize.sm, color: colors.primary },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, lineHeight: 28 },
  body: { fontSize: fontSize.md, color: colors.text, lineHeight: 24 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tag: { backgroundColor: '#FFF0F0', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.full },
  tagText: { fontSize: fontSize.sm, color: colors.primary },
  suggestionsBox: { backgroundColor: '#F8F9FA', borderRadius: borderRadius.md, padding: spacing.md },
  suggestions: { fontSize: fontSize.sm, color: colors.textSecondary, lineHeight: 20 },
});
