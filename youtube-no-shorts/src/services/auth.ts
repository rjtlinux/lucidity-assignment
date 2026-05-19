import {GoogleSignin} from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'yt_access_token';

export const signIn = async (): Promise<string> => {
  await GoogleSignin.hasPlayServices();
  await GoogleSignin.signIn();
  const tokens = await GoogleSignin.getTokens();
  await AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken);
  return tokens.accessToken;
};

export const signOut = async () => {
  await GoogleSignin.signOut();
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const getAccessToken = async (): Promise<string> => {
  try {
    await GoogleSignin.signInSilently();
    const tokens = await GoogleSignin.getTokens();
    await AsyncStorage.setItem(TOKEN_KEY, tokens.accessToken);
    return tokens.accessToken;
  } catch {
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    if (stored) {
      return stored;
    }
    throw new Error('Not authenticated');
  }
};

export const isSignedIn = async (): Promise<boolean> => {
  return GoogleSignin.isSignedIn();
};
