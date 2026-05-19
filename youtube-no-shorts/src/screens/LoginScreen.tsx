import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types';
import {signIn} from '../services/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'> & {
  onLogin: () => void;
};

export default function LoginScreen({onLogin}: Props) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
      onLogin();
    } catch (e: any) {
      Alert.alert('Sign-in failed', e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoMark}>▶</Text>
      </View>
      <Text style={styles.title}>YouTube</Text>
      <Text style={styles.subtitle}>Shorts-Free Edition</Text>
      <Text style={styles.desc}>
        Sign in with your Google account to access your subscriptions and
        personalized feed — Shorts are permanently filtered out.
      </Text>
      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleSignIn}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Sign in with Google</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#ff0000',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoMark: {fontSize: 38, color: '#fff'},
  title: {fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4},
  subtitle: {fontSize: 16, color: '#ff6666', marginBottom: 24},
  desc: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  btn: {
    backgroundColor: '#ff0000',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  btnDisabled: {opacity: 0.6},
  btnText: {color: '#fff', fontWeight: '600', fontSize: 16},
});
