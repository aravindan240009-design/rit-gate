import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { SecurityPersonnel, ScreenName, Department, StaffMember } from '../../types';
import { apiService } from '../../services/api';
import SecurityBottomNav from '../../components/SecurityBottomNav';

interface ModernVisitorRegistrationScreenProps {
  security: SecurityPersonnel;
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const ModernVisitorRegistrationScreen: React.FC<ModernVisitorRegistrationScreenProps> = ({
  security,
  onBack,
  onNavigate,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  
  const [numberOfVisitors, setNumberOfVisitors] = useState('1');
  const [visitorNames, setVisitorNames] = useState<string[]>(['']);
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [purpose, setPurpose] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment) {
      loadStaffMembers(selectedDepartment);
    }
  }, [selectedDepartment]);

  useEffect(() => {
    // Update visitor names array when number changes
    const num = parseInt(numberOfVisitors) || 1;
    const newNames = Array(num).fill('').map((_, index) => visitorNames[index] || '');
    setVisitorNames(newNames);
  }, [numberOfVisitors]);

  const loadDepartments = async () => {
    try {
      console.log('📋 Loading departments...');
      const response = await apiService.getDepartments();
      console.log('📋 Departments response:', response);
      if (response.success && response.data) {
        console.log('📋 Departments loaded:', response.data.length);
        setDepartments(response.data);
      } else {
        console.error('❌ Failed to load departments:', response.message);
        Alert.alert('Error', 'Failed to load departments. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error loading departments:', error);
      Alert.alert('Error', 'Failed to load departments. Please check your connection.');
    }
  };

  const loadStaffMembers = async (deptId: string) => {
    try {
      console.log('👥 Loading staff for department:', deptId);
      const response = await apiService.getStaffByDepartment(deptId);
      console.log('👥 Staff response:', response);
      if (response.success && response.data) {
        console.log('👥 Staff loaded:', response.data.length);
        setStaffMembers(response.data);
      } else {
        console.error('❌ Failed to load staff:', response.message);
        setStaffMembers([]);
      }
    } catch (error) {
      console.error('❌ Error loading staff:', error);
      setStaffMembers([]);
    }
  };

  const handleSubmit = () => {
    // Validation
    if (visitorNames.some(name => !name.trim())) {
      Alert.alert('Error', 'Please enter names for all visitors');
      return;
    }

    if (!visitorEmail.trim() || !visitorEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!visitorPhone.trim() || visitorPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number (minimum 10 digits)');
      return;
    }

    if (!selectedDepartment) {
      Alert.alert('Error', 'Please select a department');
      return;
    }

    if (!selectedStaff) {
      Alert.alert('Error', 'Please select a staff member to meet');
      return;
    }

    if (!purpose.trim()) {
      Alert.alert('Error', 'Please enter the purpose of visit');
      return;
    }

    // Navigate away immediately, fire API in background
    resetForm();
    onNavigate('VISITOR_QR');

    apiService.registerVisitorForSecurity({
      name: visitorNames[0],
      phone: visitorPhone,
      email: visitorEmail,
      numberOfPeople: parseInt(numberOfVisitors) || 1,
      departmentId: selectedDepartment,
      staffCode: selectedStaff,
      purpose,
      vehicleNumber: vehicleNumber || undefined,
      securityId: security.securityId,
    }).catch(err => console.error('Visitor registration error:', err));
  };

  const resetForm = () => {
    setNumberOfVisitors('1');
    setVisitorNames(['']);
    setVisitorPhone('');
    setVisitorEmail('');
    setVehicleNumber('');
    setSelectedDepartment('');
    setSelectedStaff('');
    setPurpose('');
  };

  const updateVisitorName = (index: number, value: string) => {
    const newNames = [...visitorNames];
    newNames[index] = value;
    setVisitorNames(newNames);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitor Registration</Text>
        <TouchableOpacity 
          style={styles.qrButton} 
          onPress={() => onNavigate('VISITOR_QR')}
        >
          <Ionicons name="qr-code-outline" size={20} color="#00BCD4" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Visitor Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visitor Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Visitors *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="people-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="1"
                value={numberOfVisitors}
                onChangeText={setNumberOfVisitors}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Dynamic Visitor Names */}
          {visitorNames.map((name, index) => (
            <View key={index} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {index === 0 ? 'Main Visitor Name *' : `Visitor ${index + 1} Name *`}
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder={`Enter visitor ${index + 1} name`}
                  value={name}
                  onChangeText={(value) => updateVisitorName(index, value)}
                />
              </View>
            </View>
          ))}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter email address"
                value={visitorEmail}
                onChangeText={setVisitorEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter phone number (min 10 digits)"
                value={visitorPhone}
                onChangeText={setVisitorPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Vehicle Number (Optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="car-outline" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Enter vehicle number"
                value={vehicleNumber}
                onChangeText={setVehicleNumber}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>

        {/* Visit Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visit Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Department *</Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="business-outline" size={20} color="#9CA3AF" style={styles.pickerIcon} />
              <Picker
                selectedValue={selectedDepartment}
                onValueChange={setSelectedDepartment}
                style={styles.picker}
              >
                <Picker.Item label="Select Department" value="" />
                {departments.map(dept => (
                  <Picker.Item key={dept.id} label={dept.name} value={dept.id.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Staff to Meet *</Text>
            <View style={styles.pickerContainer}>
              <Ionicons name="person-circle-outline" size={20} color="#9CA3AF" style={styles.pickerIcon} />
              <Picker
                selectedValue={selectedStaff}
                onValueChange={setSelectedStaff}
                style={styles.picker}
                enabled={!!selectedDepartment}
              >
                <Picker.Item label="Select Staff" value="" />
                {staffMembers.map(staff => (
                  <Picker.Item key={staff.id} label={staff.name} value={staff.id.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Purpose of Visit *</Text>
            <View style={styles.textAreaContainer}>
              <Ionicons name="document-text-outline" size={20} color="#9CA3AF" style={styles.textAreaIcon} />
              <TextInput
                style={styles.textArea}
                placeholder="Enter purpose of visit"
                value={purpose}
                onChangeText={setPurpose}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFF" />
          <Text style={styles.submitButtonText}>Register Visitor</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <SecurityBottomNav activeTab="visitor" onNavigate={onNavigate} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  qrButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingLeft: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pickerIcon: {
    marginRight: 12,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  textAreaContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00BCD4',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default ModernVisitorRegistrationScreen;
