// MonthlyReportScreen.tsx
import { supabase } from '@/lib/superbase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import XLSX from 'xlsx';
import TopBar from './screens/components/TopBar';

export default function MonthlyReportScreen() {
  // State declarations
  const [persons, setPersons] = useState<string[]>([]);
  const [personWorkbooks, setPersonWorkbooks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [month, setMonth] = useState('');
  const [summary, setSummary] = useState('');
  const router = useRouter();

  const [originalFileUri, setOriginalFileUri] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string>('');

  // Pick and split workbook
  const pickFile = async () => {
    setLoading(true);
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets.length > 0) {
        const fileUri = res.assets[0].uri;
        const fileName = res.assets[0].name;

        setOriginalFileUri(fileUri);
        setOriginalFileName(fileName);

        const b64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const workbook = XLSX.read(b64, { type: 'base64' });
        const personWbs = splitWorkbookByPerson(workbook);

        const personFilesBase64: Record<string, string> = {};
        Object.entries(personWbs).forEach(([person, wb]) => {
          const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
          personFilesBase64[person] = wbout;
        });

        setPersons(Object.keys(personFilesBase64));
        setPersonWorkbooks(personFilesBase64);
      } else {
        Alert.alert('No file selected');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  // Split workbook by SERVICE PERSON
const splitWorkbookByPerson = (workbook: XLSX.WorkBook) => {
  const personSheetsMap: Record<string, Record<string, any[]>> = {};
  const timeFields = ['TIME IN', 'RESPONSE TIME'];

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    rows.forEach((row: any) => {
      // Format TIME fields to Date objects
      timeFields.forEach(field => {
        const value = row[field];
        if (typeof value === 'string' && /^\d{1,2}:\d{2}$/.test(value.trim())) {
          const [hour, minute] = value.trim().split(':').map(Number);
          const date = new Date();
          date.setHours(hour, minute, 0, 0);
          row[field] = date;
        }
      });

      // Use SERVICE PERSON field for grouping
      let person = row['SERVICE PERSON']?.toString().trim();
      if (!person || person.length === 0) person = 'Unidentified Issues';

      if (!personSheetsMap[person]) personSheetsMap[person] = {};
      if (!personSheetsMap[person][sheetName]) personSheetsMap[person][sheetName] = [];
      personSheetsMap[person][sheetName].push(row);
    });
  });

  // Create workbooks for each person
  const personWorkbooks: Record<string, XLSX.WorkBook> = {};
  Object.entries(personSheetsMap).forEach(([person, sheets]) => {
    const wb = XLSX.utils.book_new();

    Object.entries(sheets).forEach(([sheetName, rows]) => {
      const ws = XLSX.utils.json_to_sheet(rows, { cellDates: true });

      if (rows.length > 0) {
        const colKeys = Object.keys(rows[0]);
        const colIndexes = timeFields
          .map(col => colKeys.indexOf(col))
          .filter(i => i !== -1);
        if (colIndexes.length) {
          ws['!cols'] = [];
          colIndexes.forEach(index => {
            ws['!cols'][index] = { z: 'hh:mm' };
          });
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    personWorkbooks[person] = wb;
  });

  return personWorkbooks;
};


  // Upload and store reports
  const handleSubmitToSupabase = async () => {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) return Alert.alert('Error', 'User not logged in');

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name');
      if (profileError) throw profileError;

      const nameToUid = Object.fromEntries(
        profiles.map(p => [p.name.toLowerCase(), p.id])
      );

      const inserts = Object.entries(personWorkbooks).map(([person, report]) => {
        const uid = nameToUid[person.toLowerCase()] || currentUser.id;
        return {
          user_id: uid,
          month,
          summary,
          report,
          person_name: person,
        };
      });

      const { error } = await supabase.from('monthly_reports').insert(inserts);
      if (error) throw error;

      if (originalFileUri && originalFileName) {
        const fileBuffer = await FileSystem.readAsStringAsync(originalFileUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const fileName = `original_reports/${month}_${Date.now()}.xlsx`;

        const uploadRes = await supabase.storage
          .from('report-storage')
          .upload(fileName, fileBuffer, {
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            upsert: true,
          });

        if (uploadRes.error) throw uploadRes.error;

        const { data: publicUrl } = supabase.storage
          .from('report-storage')
          .getPublicUrl(fileName);

        await supabase.from('teamlead_original_reports').insert([
          {
            user_id: currentUser.id,
            file_path: fileName,
            month: month.trim(),
            file_base64: fileBuffer,
            file_url: publicUrl.publicUrl,
          },
        ]);

        console.log('✅ Original report saved to teamlead_original_reports');
      }

      Alert.alert('Success', 'Monthly reports generated.');
      setMonth('');
      setSummary('');
      setPersons([]);
      setPersonWorkbooks({});
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    }
  };

  return (
    <SafeAreaView style={styles.safeAreaViewStyles}>
      <TopBar forceShowBackButton={true} />
      <View style={styles.container}>
        <Text style={styles.title}>Monthly Report</Text>

        <TextInput
          placeholder="Enter Month (e.g. July)"
          value={month}
          onChangeText={setMonth}
          style={styles.input}
        />
        <TextInput
          placeholder="Summary"
          value={summary}
          onChangeText={setSummary}
          style={[styles.input, { height: 80 }]}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={pickFile} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Pick Excel File'}</Text>
        </TouchableOpacity>

        {persons.length > 0 && month.trim() && (
          <TouchableOpacity
            style={[styles.button, { marginTop: 12, backgroundColor: '#0c7' }]}
            onPress={handleSubmitToSupabase}
          >
            <Text style={styles.buttonText}>Generate Report</Text>
          </TouchableOpacity>
        )}

        <ScrollView contentContainerStyle={styles.listContainer}>
          {persons.map((person, i) => (
            <View key={i} style={styles.personRow}>
              <Text style={styles.personName}>{person}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', paddingLeft: 10, paddingRight: 10 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  safeAreaViewStyles: {
    backgroundColor: 'white',
    flex: 1,
  },
  button: {
    backgroundColor: '#E38A33',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  listContainer: { marginTop: 20 },
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  personName: { fontSize: 16, fontWeight: '600' },
});
