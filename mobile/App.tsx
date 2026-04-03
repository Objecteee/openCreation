import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import ResultScreen from './src/screens/ResultScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import { colors } from './src/theme';
import { useAppStore } from './src/store/useAppStore';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  const { token } = useAppStore();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '600' },
          }}
        >
          {token ? (
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: '内容创作', headerShown: false }}
              />
              <Stack.Screen
                name="Result"
                component={ResultScreen}
                options={{ title: '生成结果' }}
              />
              <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: '个人中心' }}
              />
            </>
          ) : (
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: '登录' }}
            />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
