import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


type Props = {
  name: string;
  onClick: () => void;
};

export default function ActivityButton({ name, onClick }: Props) {
  return (
    <TouchableOpacity style={styles.button} onPress={onClick}>
      <View style={styles.textView}></View>
      <Text style={styles.buttonText}>{name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#E38A33",
    padding: 15,
    borderRadius: 30,
    height:89,
    marginBottom: 10,
    display:"flex",
    flexDirection:"column",
    gap:10,
  },
  buttonText: {
    color: '#fff',
    marginTop:2,
    fontSize:17,
    fontWeight: 'bold',
  },
  textView:{
    width:28.27,
    height:28.27,
    backgroundColor:"white",
    borderRadius:"100%",
  }
});
