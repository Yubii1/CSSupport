import { supabase } from '@/lib/superbase';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TopBar from './screens/components/TopBar';
const SUPABASE_URL = 'https://gshttimhddsafhkhhicy.supabase.co'; 

const getAvatarUrl = (path: string | null) => {
  //default avatar incase the supaabase url or code breeaks 
  if (!path) return 'https://cdn-icons-png.flaticon.com/512/149/149071.png'; 
  return `${SUPABASE_URL}/storage/v1/object/public/${path}`;
};

const SettingsScreen: React.FC = () => {
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(getAvatarUrl(null));
  const [pushEnabled, setPushEnabled] = useState<boolean>(true);
  const [promoEnabled, setPromoEnabled] = useState<boolean>(false);
  const [updateEnabled, setUpdateEnabled] = useState<boolean>(true);

  // Password modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const user = session?.user;
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setAvatarPath(data.avatar_url);
        setAvatarUrl(getAvatarUrl(data.avatar_url));
      }
    }
  };

  const uploadImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission to access camera roll is required!');
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) return;

    const image = pickerResult.assets[0];
    const fileExt = image.uri.split('.').pop();
    const filePath = `avatars/${Date.now()}.${fileExt}`;

    const base64 = image.base64 || '';
    const fileBuffer = decode(base64);

    const { error } = await supabase.storage.from('avatars').upload(filePath, fileBuffer, {
      contentType: image.type || 'image/png',
      upsert: true,
    });

    if (error) {
      Alert.alert('Upload failed', error.message);
      return;
    }

    // Save relative path to profile table
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        avatar_url: filePath,
      });

      if (upsertError) {
        Alert.alert('Failed to update profile picture', upsertError.message);
        return;
      }

      setAvatarPath(filePath);
      setAvatarUrl(getAvatarUrl(filePath));
    }
  };

  const openPasswordModal = () => {
    setPassword('');
    setPasswordError('');
    setModalVisible(true);
  };

  const validateAndSavePassword = async () => {
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    setPasswordError('');

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('No user logged in');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      Alert.alert('Failed to update password', updateError.message);
      return;
    }

    Alert.alert('Success', 'Password updated successfully');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
     < TopBar forceShowBackButton={true}></TopBar>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar image at top */}
        <View style={styles.profileSection}>
          <TouchableOpacity onPress={uploadImage}>
            <Image source={{ uri: avatarUrl }} style={styles.profileImage} />
          </TouchableOpacity>
          <Text style={styles.profileHint}>Tap image to cshange</Text>
        </View>

        {/* Customizations Section */}
        <Text style={styles.sectionTitle}>Customizations</Text>
        <View style={styles.customizationButtonsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={uploadImage}>
            <Text style={styles.optionText}>Change Image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionButton} onPress={openPasswordModal}>
            <Text style={styles.optionText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Notification Settings Section */}
        <Text style={styles.sectionTitle}>Notification Settings</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Push Notification</Text>
          <Switch value={pushEnabled} onValueChange={setPushEnabled} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Promotions</Text>
          <Switch value={promoEnabled} onValueChange={setPromoEnabled} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>App Updates</Text>
          <Switch value={updateEnabled} onValueChange={setUpdateEnabled} />
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              placeholder="Enter new password"
              secureTextEntry
              style={styles.modalInput}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={validateAndSavePassword}>
                <Text>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalCancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 16,
  },
  scroll: {
    paddingVertical: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#E38A33',
  },
  profileHint: {
    marginTop: 8,
    fontSize: 13,
    color: '#888',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E38A33',
    marginBottom: 12,
  },
  customizationButtonsContainer: {
    flexDirection: 'column',
    gap: 15,
    marginBottom: 20,
  },
  optionButton: {
    // backgroundColor: '#E38A33',
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft:15,
  },
  optionText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleRow: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderColor: '#E38A33',
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  toggleLabel: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#E38A33',
  },
  modalInput: {
    borderColor: '#E38A33',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 6,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    backgroundColor: '#E38A33',
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#ccc',
  },
  modalCancelButtonText: {
    color: '#333',
  },
});
