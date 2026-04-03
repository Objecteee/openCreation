import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import TopicInput from '../components/TopicInput';
import PlatformSelector from '../components/PlatformSelector';
import LoadingOverlay from '../components/LoadingOverlay';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<any, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const [topic, setTopic] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { selectedPlatform, setSelectedPlatform, setCurrentContent, setPoints, points, token, user } = useAppStore();

  useEffect(() => {
    if (token) {
      api.getProfile().then((u) => {
        useAppStore.getState().setUser(u);
        useAppStore.getState().setPoints(u.points);
      }).catch(() => {});
    }
  }, []);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('提示', '请输入内容主题');
      return;
    }

    if (points < 5) {
      Alert.alert('积分不足', '您的积分不足，请先充值', [
        { text: '取消', style: 'cancel' },
        { text: '去充值', onPress: () => navigation.navigate('Profile') },
      ]);
      return;
    }

    setLoading(true);
    try {
      const result = await api.generateContent(topic.trim(), selectedPlatform, extraInfo.trim() || undefined);
      setCurrentContent(result.content);
      setPoints(result.pointsRemaining);
      navigation.navigate('Result');
    } catch (err: any) {
      Alert.alert('生成失败', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>你好，{user?.nickname || '创作者'}</Text>
            <Text style={styles.subtitle}>今天想创作什么内容？</Text>
          </View>
          <TouchableOpacity style={styles.pointsBadge} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.pointsIcon}>⚡</Text>
            <Text style={styles.pointsText}>{points} 积分</Text>
          </TouchableOpacity>
        </View>

        <TopicInput value={topic} onChange={setTopic} />

        <TopicInput
          value={extraInfo}
          onChange={setExtraInfo}
          placeholder="补充说明（选填）：如目标受众、风格偏好..."
        />

        <PlatformSelector selected={selectedPlatform} onSelect={setSelectedPlatform} />

        <TouchableOpacity
          style={[styles.generateButton, !topic.trim() && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={!topic.trim() || loading}
        >
          <Text style={styles.generateButtonText}>
            {loading ? '创作中...' : '✨ 立即生成'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.hint}>每次生成消耗 5 积分</Text>
      </ScrollView>

      <LoadingOverlay visible={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  greeting: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs },
  pointsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primary },
  pointsIcon: { fontSize: fontSize.sm },
  pointsText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.primary, marginLeft: spacing.xs },
  generateButton: { backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', marginBottom: spacing.sm },
  generateButtonDisabled: { opacity: 0.5 },
  generateButtonText: { color: '#FFF', fontSize: fontSize.lg, fontWeight: '700' },
  hint: { textAlign: 'center', fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.sm },
});
