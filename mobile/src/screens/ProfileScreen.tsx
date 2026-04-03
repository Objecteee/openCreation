import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { Package } from '../types';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<any, 'Profile'>;

export default function ProfileScreen({ navigation }: Props) {
  const { user, points, setPoints, logout } = useAppStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pkgs, txs] = await Promise.all([
        api.getPackages(),
        api.getTransactions(),
      ]);
      setPackages(pkgs);
      setHistory(txs.slice(0, 10));
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const handleRecharge = async (pkg: Package) => {
    Alert.alert(
      '确认充值',
      `确定充值 ${pkg.label}，支付 ¥${pkg.price}？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await api.recharge(pkg.id);
              setPoints(result.points);
              Alert.alert('充值成功', `当前积分：${result.points}`);
              loadData();
            } catch (err: any) {
              Alert.alert('充值失败', err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('确认退出', '确定要退出登录吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确认', onPress: () => logout() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.nickname || user?.phone || 'U')[0].toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.nickname}>{user?.nickname || '用户'}</Text>
          <Text style={styles.phone}>{user?.phone}</Text>
        </View>
        <View style={styles.pointsBox}>
          <Text style={styles.pointsValue}>{points}</Text>
          <Text style={styles.pointsLabel}>积分</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>充值积分</Text>
        <View style={styles.packageGrid}>
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={styles.packageItem}
              onPress={() => handleRecharge(pkg)}
              disabled={loading}
            >
              <Text style={styles.packagePoints}>{pkg.points}积分</Text>
              <Text style={styles.packagePrice}>¥{pkg.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近记录</Text>
        {history.length === 0 ? (
          <Text style={styles.emptyText}>暂无记录</Text>
        ) : (
          history.map((item, i) => (
            <View key={i} style={styles.recordItem}>
              <View>
                <Text style={styles.recordDesc}>{item.description}</Text>
                <Text style={styles.recordDate}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.recordAmount, item.amount < 0 && styles.recordExpense]}>
                {item.amount > 0 ? '+' : ''}{item.amount}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  userInfo: { flex: 1, marginLeft: spacing.md },
  nickname: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  phone: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  pointsBox: { backgroundColor: '#FFF5F5', borderRadius: borderRadius.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center' },
  pointsValue: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  pointsLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  section: { backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  sectionTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  packageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  packageItem: { width: '48%', backgroundColor: colors.background, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  packagePoints: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  packagePrice: { fontSize: fontSize.md, color: colors.primary, marginTop: spacing.xs },
  emptyText: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  recordItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  recordDesc: { fontSize: fontSize.sm, color: colors.text },
  recordDate: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
  recordAmount: { fontSize: fontSize.md, fontWeight: '700', color: colors.success },
  recordExpense: { color: colors.textSecondary },
  logoutButton: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.error },
  logoutText: { fontSize: fontSize.md, color: colors.error, fontWeight: '600' },
});
