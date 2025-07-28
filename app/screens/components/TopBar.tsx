import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { usePathname, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LogoutModal from './LogoutModal';

interface TopBarProps {
  title?: string;
  image?: any;
  forceShowBackButton?: boolean;
  onBackPress?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  title = 'CSSupport',
  image,
  forceShowBackButton = false,
  onBackPress,
}) => {
  const router = useRouter();
  const pathname = usePathname(); // ✅ Get current screen path
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isMainScreen = pathname.includes('/home') || pathname.includes('/main');

  const handleLogout = () => {
    setShowMenu(false);
    setShowLogoutModal(true);
  };

  const handleSettings = () => {
    setShowMenu(false);
    router.push('/settings');
  };

  return (
    <View>
      <View style={styles.header}>
        {(!isMainScreen && forceShowBackButton) ? (
          <TouchableOpacity onPress={onBackPress ? onBackPress : () => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
        <MaskedView
          maskElement={
            <Text style={[styles.titleText, { backgroundColor: "transparent" }]}>
              {title}
            </Text>
          }
        >
          <LinearGradient
            colors={["black", "#E38A33"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.titleText, { opacity: 0 }]}>{title}</Text>
          </LinearGradient>
        </MaskedView>

        <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
          <Ionicons name="menu" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      <Modal
        transparent
        visible={showMenu}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity style={styles.overlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            {image && <Image source={image} style={styles.profileImage} />}
            <TouchableOpacity onPress={handleSettings} style={styles.menuItem}>
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.menuItem}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <LogoutModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLogout={async () => {
          await router.replace('/account');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 10,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    width: 180,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E38A33',
    marginBottom: 12,
    alignSelf: 'center',
  },
});

export default TopBar;
