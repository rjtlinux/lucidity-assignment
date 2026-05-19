import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GoogleSignin} from '@react-native-google-signin/google-signin';

import LoginScreen from './src/screens/LoginScreen';
import MainNavigator from './src/navigation/MainNavigator';
import VideoScreen from './src/screens/VideoScreen';
import {RootStackParamList} from './src/types';
import {isSignedIn} from './src/services/auth';

const WEB_CLIENT_ID =
  '675272878793-vg5jggu5m2j8kl0q32d75p6i6bn3rt7m.apps.googleusercontent.com';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
      offlineAccess: false,
    });
    isSignedIn().then(setLoggedIn);
  }, []);

  if (loggedIn === null) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f0f" />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {!loggedIn ? (
            <Stack.Screen name="Login">
              {props => (
                <LoginScreen {...props} onLogin={() => setLoggedIn(true)} />
              )}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainNavigator} />
              <Stack.Screen
                name="Video"
                component={VideoScreen}
                options={{
                  headerShown: true,
                  headerStyle: {backgroundColor: '#0f0f0f'},
                  headerTintColor: '#fff',
                  title: '',
                }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
