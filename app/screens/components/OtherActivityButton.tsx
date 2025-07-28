// components/OtherActivityButton.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type OtherActivityButtonProps = {
  name: string;
  onPress: () => void;
  icon?: React.ReactNode; // Accepts any React component (e.g. Icon)
};

export default function OtherActivityButton({ name, onPress, icon }: OtherActivityButtonProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <View style={styles.content}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={styles.text}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#E38A33',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
