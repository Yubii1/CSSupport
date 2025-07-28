import { supabase } from '@/lib/superbase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import XLSX from 'xlsx';
import TopBar from './screens/components/TopBar';

type Report = {
  id: string;
  user_id: string;
  month: string;
  summary: string;
  created_at: string;
  person_name: string | null;
  report: Record<string, string>; // base64
};

export default function SummaryScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsedMonths, setCollapsedMonths] = useState<Record<string, boolean>>({}); // 👈

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        setUserId(user.id);

        const { data, error } = await supabase
          .from('monthly_reports')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        setReports(data || []);
      } catch (err: any) {
        Alert.alert('Error', err.message);
      }
      setLoading(false);
    };

    fetchReports();
  }, []);

  const isAdmin = userId === '64f10930-6b56-4432-9ea9-beff30957e5e';

  const handleDownload = async (report: Report) => {
    try {
      const wb = XLSX.read(report.report[Object.keys(report.report)[0]], { type: 'base64' });

      const fileUri = FileSystem.cacheDirectory + `${report.person_name || 'report'}.xlsx`;

      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri);
    } catch (err: any) {
      Alert.alert('Download Failed', err.message || 'Could not generate Excel file.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('monthly_reports').delete().eq('id', id);
      if (error) throw error;
      setReports(prev => prev.filter(r => r.id !== id));
      Alert.alert('Deleted', 'Report deleted successfully');
    } catch (err: any) {
      Alert.alert('Delete Error', err.message);
    }
  };

  const grouped = reports.reduce<Record<string, Report[]>>((acc, report) => {
    const canView = isAdmin || report.user_id === userId;
    if (!canView) return acc;

    const key = report.month || 'Unknown';
    acc[key] = acc[key] || [];
    acc[key].push(report);
    return acc;
  }, {});

  const toggleMonth = (month: string) => {
    setCollapsedMonths(prev => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  return (
    <View style={styles.container}>
      <TopBar forceShowBackButton={true} />
      <Text style={styles.title}>Summary Reports</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#E38A33" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView>
          {Object.entries(grouped).map(([month, monthReports]) => (
            <View key={month} style={styles.monthSection}>
              <TouchableOpacity onPress={() => toggleMonth(month)}>
                <Text style={styles.monthTitle}>
                  {collapsedMonths[month] ? '▼' : '▲'} {month}
                </Text>
              </TouchableOpacity>

              {!collapsedMonths[month] &&
                monthReports.map(report => (
                  <View key={report.id} style={styles.card}>
                    <Text style={styles.summary}>
                      {report.person_name || 'Unidentified Issues'} - {report.summary}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(report.created_at).toDateString()}
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.downloadButton}
                        onPress={() => handleDownload(report)}
                      >
                        <Text style={styles.downloadText}>Download</Text>
                      </TouchableOpacity>

                      {isAdmin && (
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(report.id)}
                        >
                          <Text style={styles.deleteText}>Delete</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  monthSection: { marginBottom: 24 },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#E38A33',
  },
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 10,
  },
  summary: {
    fontSize: 16,
    marginBottom: 4,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  downloadButton: {
    backgroundColor: '#4287f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: '#d9534f',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteText: { color: '#fff', fontWeight: 'bold' },
});
