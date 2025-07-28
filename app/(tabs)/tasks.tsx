import { supabase } from '@/lib/superbase';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TopBar from '../screens/components/TopBar';

interface Task {
  id: string;
  title: string;
  status: 'Pending' | 'Work in progress' | 'Completed';
  user_id: string;
  created_at: string;
  updated_at?: string;
}

export default function TasksScreen() {
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user session on mount
  useEffect(() => {
    const fetchSessionAndTasks = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        Alert.alert('Not logged in');
        return;
      }
      setUserId(session.user.id);
      fetchTasks(session.user.id);
    };

    fetchSessionAndTasks();
  }, []);

  // Fetch tasks filtered by user_id
  const fetchTasks = async (uid: string) => {
    const { data, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('user_id', uid)
  .order('created_at', { ascending: false });


    if (error) {
      Alert.alert('Error loading tasks', error.message);
    } else if (data) {
      setTasks(data);
    }
  };

  // Add new task with user_id and default status
  const addTask = async () => {
    if (!input.trim()) return;
    if (tasks.length >= 20) {
      Alert.alert('Limit Reached', 'You can only have 20 tasks.');
      return;
    }
    if (!userId) {
      Alert.alert('User not found');
      return;
    }

    const { error } = await supabase.from('tasks').insert([
      {
        title: input.trim(),
        status: 'Pending',
        user_id: userId,
      },
    ]);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setInput('');
      fetchTasks(userId);
    }
  };

  // Update task status and updated_at timestamp
  const updateStatus = async (id: string, newStatus: Task['status']) => {
    if (!userId) return;
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      Alert.alert('Update failed', error.message);
    } else {
      fetchTasks(userId);
    }
  };

  // Delete all completed tasks for current user
  const deleteCompletedTasks = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'Completed');

    if (error) {
      Alert.alert('Delete failed', error.message);
    } else {
      fetchTasks(userId);
    }
  };

  const activeTasks = tasks.filter((task) => task.status !== 'Completed');
  const completedTasks = tasks.filter((task) => task.status === 'Completed');

  return (
    <SafeAreaView style={styles.container}>
      <TopBar forceShowBackButton={true} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Your Tasks</Text>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Add a new task..."
            style={styles.input}
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.addButton} onPress={addTask}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Add</Text>
          </TouchableOpacity>
        </View>

        {activeTasks.map((task) => (
          <View key={task.id} style={styles.taskItem}>
            <Text
              style={[
                styles.taskTitle,
                task.status === 'Work in progress' && { color: '#2451B7' },
              ]}
            >
              {task.title}
            </Text>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              {task.status !== 'Completed' && (
                <TouchableOpacity
                  style={styles.statusButton}
                  onPress={() =>
                    updateStatus(
                      task.id,
                      task.status === 'Pending' ? 'Work in progress' : 'Completed'
                    )
                  }
                >
                  <Text style={styles.statusText}>
                    {task.status === 'Pending' ? 'Start' : 'Complete'}
                  </Text>
                </TouchableOpacity>
              )}

              {task.status === 'Work in progress' && (
                <Text style={styles.statusWip}>In Progress</Text>
              )}
            </View>
          </View>
        ))}

        {completedTasks.length > 0 && (
          <>
            <TouchableOpacity style={styles.clearButton} onPress={deleteCompletedTasks}>
              <Text style={styles.clearButtonText}>Clear Completed Tasks</Text>
            </TouchableOpacity>

            <Text style={styles.completedHeader}>Completed Tasks</Text>

            {completedTasks.map((task) => (
              <View key={task.id} style={styles.completedItem}>
                <Text style={styles.completedText}>{task.title}</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 40,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 23,
    fontWeight: 'bold',
    paddingLeft: 5,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1.3,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  addButton: {
    backgroundColor: '#E38A33',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  taskItem: {
    backgroundColor: '#F3F3F3',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 14,
    color: '#111',
    fontWeight: '500',
    maxWidth: '65%',
  },
  statusButton: {
    backgroundColor: '#E2E2E2',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statusWip: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2451B7',
    marginLeft: 4,
  },
  clearButton: {
    backgroundColor: '#E38A33',
    borderRadius: 10,
    padding: 10,
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  completedHeader: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  completedItem: {
    backgroundColor: '#EFEFEF',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  completedText: {
    color: '#888',
    fontStyle: 'italic',
  },
});
