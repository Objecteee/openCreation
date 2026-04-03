import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Platform, PlatformOption } from '../types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

const PLATFORMS: PlatformOption[] = [
  { id: 'xiaohongshu', name: '小红书', icon: '📕' },
  { id: 'douyin', name: '抖音', icon: '🎵' },
  { id: 'wechat', name: '公众号', icon: '📧' },
  { id: 'bili', name: 'B站', icon: '📺' },
  { id: 'weibo', name: '微博', icon: '🌐' },
];

interface Props {
  selected: Platform;
  onSelect: (platform: Platform) => void;
}

export default function PlatformSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>目标平台</Text>
      <View style={styles.grid}>
        {PLATFORMS.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.item, selected === p.id && styles.itemSelected]}
            onPress={() => onSelect(p.id)}
          >
            <Text style={styles.icon}>{p.icon}</Text>
            <Text style={[styles.name, selected === p.id && styles.nameSelected]}>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { fontSize: fontSize.md, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSelected: { borderColor: colors.primary, backgroundColor: '#FFF5F5' },
  icon: { fontSize: fontSize.lg, marginRight: spacing.xs },
  name: { fontSize: fontSize.sm, color: colors.textSecondary },
  nameSelected: { color: colors.primary, fontWeight: '600' },
});
