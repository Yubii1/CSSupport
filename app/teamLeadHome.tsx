import { supabase } from '@/lib/superbase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LogoutModal from './screens/components/LogoutModal';
import OtherActivityButton from './screens/components/OtherActivityButton';
import TopBar from './screens/components/TopBar';

export default function TeamLeadHomeTab() {
  const router = useRouter();
  const { name = 'Team Lead', image } = useLocalSearchParams<{
    name?: string;
    image?: string;
  }>();

  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    if (!image || !name) {
      router.replace('/account');
    }
  },);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowLogout(false);
    router.replace('/account');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar image={{ uri: image as string }} forceShowBackButton={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.greeting}>
          Hello <Text style={styles.greetingName}>{name}</Text>
        </Text>
        <Text style={[styles.subtext, { color: '#A49281' }]}>Make your day easy with us</Text>
       

        
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.mainCard}
            onPress={() => router.navigate('/create-announcement')}
          >
            <View style={styles.mainCardContent}>
              <View style={styles.iconWrapper}>
                <Icon name="speaker" size={20} color="#000" />
              </View>
              <Text style={styles.MainCardTitle}>Create Announcements</Text>
              <Text style={styles.cardSubtext}>Keep your team informed...</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.subCard}>
            <TouchableOpacity
              style={styles.cardTitle}
              onPress={() => router.navigate('/teamLeadReport')}
            >
              <View style={styles.iconWrapper}>
                <Icon name="message-circle" size={20} color="#000" />
              </View>
              <Text style={styles.smallCardsText}>View Customized Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cardTitle}
              onPress={() => router.navigate('/teamLeadAnnouncements')}
            >
              <View style={styles.iconWrapper}>
                <Icon name="alert-triangle" size={20} color="#000" />
              </View>
              <Text style={styles.smallCardsText}>Check Announcements</Text>
            </TouchableOpacity>
          </View>
        </View>
         <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>App Statistics Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Reports</Text>
              <Text style={styles.statValue}>12</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Team</Text>
              <Text style={styles.statValue}>4</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Pending</Text>
              <Text style={styles.statValue}>3</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statTitle}>Solved</Text>
              <Text style={styles.statValue}>9</Text>
            </View>
          </View>
        </View>
         
        <View style={styles.activitiesContainer}>
          <Text style={styles.sectionTitle}>Other Activities...</Text>
                    <OtherActivityButton
                      name="Upload Monthly Report"
                      icon={<Icon name="upload" size={18} color="#333" />}
                      onPress={() => router.push('/report')}
                    />
                    <OtherActivityButton
                      name="Monthly Summary"
                      icon={<Icon name="bar-chart" size={18} color="#333" />}
                      onPress={() => router.push('/summary')}
                    />
                    <OtherActivityButton
                      name="Issues Solved"
                      icon={<Icon name="check-circle" size={18} color="#333" />}
                      onPress={() => router.push('/issues')}
                    />
                  </View>
  
       
      </ScrollView>

      <LogoutModal
        visible={showLogout}
        onClose={() => setShowLogout(false)}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: 'white',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginLeft: 15,
  },
  greetingName: {
    color: '#E38A33',
  },
  subtext: {
    marginBottom: 20,
    marginLeft: 15,
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
    paddingLeft: 10,
    paddingRight: 10,
  },
  mainCard: {
    backgroundColor: '#E38A33',
    borderRadius: 11,
    flex: 1,
    justifyContent: 'center',
    padding: 15,
  },
  mainCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  MainCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 'auto',
  },
  cardSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: 'bold',
  },
  subCard: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 20,
  },
  cardTitle: {
    backgroundColor: '#D9D9D9',
    padding: 15,
    borderRadius: 17,
    flex: 1,
    justifyContent: 'center',
  },
  smallCardsText: {
    fontWeight: 'bold',
    marginTop: 'auto',
  },
  iconWrapper: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginVertical: 16,
  },
  activitiesContainer: {
    paddingBottom: 20,
    maxWidth: '100%',
    marginTop: 20,
    paddingLeft: 10,
    paddingRight: 10,
    width: '100%',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  statsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statCard: {
    backgroundColor: '#F4F4F4',
    flex: 1,
    margin: 5,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    color: '#888',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E38A33',
  },
});
