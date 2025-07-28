import { supabase } from '@/lib/superbase';
import * as FileSystem from 'expo-file-system';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import XLSX from 'xlsx';
import TopBar from './screens/components/TopBar';

export default function TeamLeadReportScreen() {
  const [monthList, setMonthList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [originalFileUrl, setOriginalFileUrl] = useState('');
  const [generatedFileUrl, setGeneratedFileUrl] = useState('');

  // Dropdown states
  const [open, setOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [items, setItems] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  const fetchAvailableMonths = async () => {
    const { data, error } = await supabase
      .from('teamlead_original_reports')
      .select('month')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('Error fetching months', error.message);
    } else {
      const uniqueMonths = [...new Set(data.map((d: any) => d.month))];
      setMonthList(uniqueMonths);
      setItems(uniqueMonths.map(m => ({ label: m, value: m })));
    }
  };

  const generateReportForMonth = async () => {
    if (!selectedMonth.trim()) {
      Alert.alert('Missing Month', 'Please select the month name.');
      return;
    }

    setLoading(true);
    setOriginalFileUrl('');
    setGeneratedFileUrl('');

    const cleanMonth = selectedMonth.trim();

    const { data, error } = await supabase
      .from('teamlead_original_reports')
      .select('*')
      .eq('month', cleanMonth)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0 || error) {
      Alert.alert('Not Found', `No report found for "${cleanMonth}".`);
      setLoading(false);
      return;
    }

    const report = data[0];
    setOriginalFileUrl(report.file_url);

    try {
      const base64 = report.file_base64;
      const workbook = XLSX.read(base64, { type: 'base64' });

      const recurringClients: Record<string, number> = {};
      const issuesPerPop: Record<string, Record<string, number>> = {};
      const popCounts: Record<string, number> = {};
      let totalIssues = 0;
      let noPopCount = 0;

      workbook.SheetNames.forEach(sheetName => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        rows.forEach((row: any) => {
          totalIssues++;
          const client = row['CLIENT NAME']?.toString().trim() || 'Unknown';
          const issue = row['NATURE OF COMPLAINT']?.toString().trim() || 'Unspecified';
          const pop = row['POP']?.toString().trim();

          recurringClients[client] = (recurringClients[client] || 0) + 1;

          if (!pop) {
            noPopCount++;
          } else {
            popCounts[pop] = (popCounts[pop] || 0) + 1;
            issuesPerPop[pop] = issuesPerPop[pop] || {};
            issuesPerPop[pop][issue] = (issuesPerPop[pop][issue] || 0) + 1;
          }
        });
      });

      const analyticsWb = XLSX.utils.book_new();

      const makeSheet = (data: any[][], name: string) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(analyticsWb, ws, name);
      };

      makeSheet(
        [['Client Name', 'Occurrences'], ...Object.entries(recurringClients).filter(([, c]) => c > 1)],
        'Recurring Clients'
      );
      makeSheet(
        [['POP', 'Issue', 'Count'], ...Object.entries(issuesPerPop).flatMap(([pop, issues]) =>
          Object.entries(issues).map(([issue, count]) => [pop, issue, count])
        )],
        'Issues per POP'
      );
      makeSheet(
        [['POP', 'Total Issues'], ...Object.entries(popCounts)],
        'Issue Count per POP'
      );
      makeSheet(
        [['Total Issues', 'No POP Recorded'], [totalIssues, noPopCount]],
        'Summary'
      );

      const fileOut = XLSX.write(analyticsWb, { bookType: 'xlsx', type: 'base64' });
      const fileName = `teamlead-report-${cleanMonth}-${Date.now()}.xlsx`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, fileOut, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadErr } = await supabase.storage
        .from('teamlead-reports')
        .upload(fileName, await FileSystem.readAsStringAsync(filePath, {
          encoding: FileSystem.EncodingType.Base64,
        }), {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      const { data: publicUrl } = supabase.storage
        .from('teamlead-reports')
        .getPublicUrl(fileName);

      setGeneratedFileUrl(publicUrl.publicUrl);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to process report.');
    }

    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar forceShowBackButton title="Team Lead Report" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>View Team Report</Text>

        <DropDownPicker
          placeholder="Select Month"
          open={open}
          value={selectedMonth}
          items={items}
          setOpen={setOpen}
          setValue={setSelectedMonth}
          setItems={setItems}
          searchable={true}
          style={styles.dropdown}
          dropDownContainerStyle={{ borderColor: '#ccc' }}
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#E38A33' }]}
          onPress={generateReportForMonth}
          disabled={!selectedMonth || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Generating...' : 'Generate Personalized Report'}
          </Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#E38A33" />}

        {!loading && (
          <>
            <Text style={styles.reportInfo}>This report contains:
              {'\n'}• Reoccurring clients
              {'\n'}• Issues per POP
              {'\n'}• Issue counts and POP breakdown
              {'\n'}• Issues without POP
            </Text>

            {originalFileUrl && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: 'green' }]}
                onPress={() => Linking.openURL(originalFileUrl)}
              >
                <Text style={styles.buttonText}>Download Original Report</Text>
              </TouchableOpacity>
            )}

            {generatedFileUrl && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: '#333' }]}
                onPress={() => Linking.openURL(generatedFileUrl)}
              >
                <Text style={styles.buttonText}>Download Personalized Report</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  scrollContainer: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  dropdown: {
    marginBottom: 12,
    borderColor: '#ccc',
  },
  button: {
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: 'bold' },
  reportInfo: {
    marginTop: 20,
    marginBottom: 16,
    fontSize: 14,
    color: '#555',
  },
});
