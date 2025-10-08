import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const ProfileScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>NH</Text>
      </View>
      <Text style={styles.title}>Welcome back!</Text>
      <Text style={styles.subtitle}>
        Personalization, stats, and achievements will show up here.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#020617',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    borderWidth: 2,
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '700',
    color: '#38bdf8',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default ProfileScreen;
