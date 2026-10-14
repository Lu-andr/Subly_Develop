// TrialGuard — Auth Navigator
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onNavigateForgotPassword={() => navigation.navigate('ForgotPassword')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword">
        {({ navigation }) => (
          <ForgotPasswordScreen
            onNavigateBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};
