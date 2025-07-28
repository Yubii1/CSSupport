import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import TopBar from './screens/components/TopBar';
const data = [
  { month: 'January', count: 30 },
  { month: 'February', count: 45 },
  { month: 'March', count: 27 },
  { month: 'April', count: 23 },
  { month: 'May', count: 38 },
  { month: 'June', count: 26 },
  { month: 'July', count: 50 },
];

export default function IssuesScreen() {
  return (
    <View style={styles.container}>
      <TopBar forceShowBackButton={true}/>
      <Text style={styles.title}>Issues Solved</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.month}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.month}</Text>
            <Text>{item.count}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20 
  },
  item: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc' 
  },
});
