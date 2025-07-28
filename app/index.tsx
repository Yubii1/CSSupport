// app/index.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LandingPage() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../assets/images/background.png')}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <Text style={styles.title}>CS SUPPORT</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/account')}
        >
          <Text style={styles.buttonText}>Tap to continue...</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 80,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 350,
    color: '#000',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 'auto',
  },
  buttonText: {
    color: 'black',
    fontSize: 17,
    fontWeight: 'bold',
  },
});
