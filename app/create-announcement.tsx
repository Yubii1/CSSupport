import { supabase } from '@/lib/superbase';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TopBar from './screens/components/TopBar';

export default function CreateAnnouncement() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      return Alert.alert('Fill all fields');
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return Alert.alert('Error', 'Not authenticated');

    // Fetch user's name from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    if (profileError) return Alert.alert('Error', profileError.message);

    // Insert new announcement
 const { error } = await supabase.from('announcements').insert({
  title,
  message,
  created_by: user.id,
});

if (error) return Alert.alert('Error', error.message);

// ✅ Fetch all other users' push tokens (excluding self)
const { data: tokens } = await supabase
  .from('profiles')
  .select('expo_token')
  .neq('id', user.id)
  .not('expo_token', 'is', null);

// ✅ Send push notifications
await Promise.all(
  (tokens ?? []).map(({ expo_token }) =>
    fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: expo_token,
        sound: 'default',
        title: '📢 New Announcement',
        body: title,
      }),
    })
  )
);

Alert.alert('Success', 'Announcement created!');




    setTitle('');
    setMessage('');

    // Route based on name
    const userName = profile?.name || '';
    if (userName.toLowerCase() === 'emem') {
      router.replace('/teamLeadAnnouncements');
    } else {
      router.replace('/announcements');
    }
  };

  return (
    <View style={styles.container}>
      <TopBar forceShowBackButton={true} />
      <Text style={styles.title}>Create Announcement</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Message"
        value={message}
        onChangeText={setMessage}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Post Announcement</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#E38A33',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
