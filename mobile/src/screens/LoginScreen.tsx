import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { colors, spacing, fontSize, borderRadius } from '../theme';

type Props = NativeStackScreenProps<any, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const { setUser, setToken } = useAppStore();

  const handleSubmit = async () => {
    if (!phone || !password) {
      Alert.alert('提示', '请填写手机号和密码');
      return;
    }

    setLoading(true);
    try {
      let data;
      if (isLogin) {
        data = await api.login(phone, password);
      } else {
        data = await api.register(phone, password, nickname || undefined);
      }
      setToken(data.token);
      setUser(data.user);
    } catch (err: any) {
      Alert.alert('错误', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>内容创作助手</Text>
          <Text style={styles.subtitle}>一键生成多平台内容</Text>
        </View>

        <View style={styles.form}>
          {!isLogin && (
            <TextInput
              style={styles.input}
              placeholder="昵称（选填）"
              placeholderTextColor={colors.textSecondary}
              value={nickname}
              onChangeText={setNickname}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="手机号"
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? '处理中...' : isLogin ? '登录' : '注册'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.switchButton} onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchText}>
              {isLogin ? '还没有账号？立即注册' : '已有账号？立即登录'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  header: { alignItems: 'center', marginBottom: spacing.xl * 2 },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary },
  form: { backgroundColor: colors.card, borderRadius: borderRadius.xl, padding: spacing.lg },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: { backgroundColor: colors.primary, borderRadius: borderRadius.md, padding: spacing.md, alignItems: 'center', marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#FFF', fontSize: fontSize.md, fontWeight: '600' },
  switchButton: { marginTop: spacing.lg, alignItems: 'center' },
  switchText: { color: colors.secondary, fontSize: fontSize.sm },
});
