import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { HOD } from '../../types';
import { apiService } from '../../services/api';

interface HODBulkGatePassScreenProps {
  user: HOD;
  navigation?: any;
  onBack?: () => void;
}

interface Student {
  id: number;
  regNo: string;
  fullName: string;
  department: string;
  year?: number;
}

interface StaffMember {
  id: number;
  staffCode: string;
  fullName: string;
  department: string;
}

type ParticipantType = 'students' | 'staff';
type ViewMode = 'students' | 'staff';

const HODBulkGatePassScreen: React.FC<HODBulkGatePassScreenProps> = ({ user, navigation, onBack }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('students');
  const [purpose, setPurpose] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  const [reason, setReason] = useState('');
  const [showExitPicker, setShowExitPicker] = useState(false);
  const [showReturnPicker, setShowReturnPicker] = useState(false);
  const [requestDateTime] = useState(new Date());
  const [includeHOD, setIncludeHOD] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Student-related state
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Staff-related state
  const [availableStaff, setAvailableStaff] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [receiverType, setReceiverType] = useState<'student' | 'staff' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attachment, setAttachment] = useState<{ name: string; base64Uri: string } | null>(null);

  const purposeOptions = ['Medical', 'Academic', 'Personal', 'Emergency', 'Other'];
  const yearOptions = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];

  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onBack) {
      onBack();
    }
  };

  useEffect(() => {
    loadAllParticipants();
  }, []);

  const loadAllParticipants = async () => {
    setIsLoading(true);
    try {
      // Load both students and staff simultaneously
      const [studentsResponse, staffResponse] = await Promise.all([
        apiService.getHODDepartmentStudents(user.hodCode),
        apiService.getHODDepartmentStaff(user.hodCode)
      ]);

      if (studentsResponse.success && studentsResponse.students) {
        setAvailableStudents(studentsResponse.students);
      } else {
        Alert.alert('Error', studentsResponse.message || 'Failed to load students');
      }

      if (staffResponse.success && staffResponse.staff) {
        setAvailableStaff(staffResponse.staff);
      } else {
        Alert.alert('Error', staffResponse.message || 'Failed to load staff');
      }
    } catch (error) {
      console.error('Error loading participants:', error);
      Alert.alert('Error', 'Failed to load participants');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStudentSelection = (regNo: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(regNo)) {
      newSelection.delete(regNo);
      if (receiverId === regNo && receiverType === 'student') {
        setReceiverId(null);
        setReceiverType(null);
      }
    } else {
      newSelection.add(regNo);
    }
    setSelectedStudents(newSelection);
  };

  const toggleStaffSelection = (staffCode: string) => {
    const newSelection = new Set(selectedStaff);
    if (newSelection.has(staffCode)) {
      newSelection.delete(staffCode);
      if (receiverId === staffCode && receiverType === 'staff') {
        setReceiverId(null);
        setReceiverType(null);
      }
    } else {
      newSelection.add(staffCode);
    }
    setSelectedStaff(newSelection);
  };

  const selectAllParticipants = () => {
    if (viewMode === 'students') {
      const filtered = getFilteredStudents();
      if (selectedStudents.size === filtered.length) {
        setSelectedStudents(new Set());
        if (receiverType === 'student') {
          setReceiverId(null);
          setReceiverType(null);
        }
      } else {
        const allRegNos = new Set(filtered.map(s => s.regNo));
        setSelectedStudents(allRegNos);
      }
    } else {
      const filtered = getFilteredStaff();
      if (selectedStaff.size === filtered.length) {
        setSelectedStaff(new Set());
        if (receiverType === 'staff') {
          setReceiverId(null);
          setReceiverType(null);
        }
      } else {
        const allStaffCodes = new Set(filtered.map(s => s.staffCode));
        setSelectedStaff(allStaffCodes);
      }
    }
  };

  const getFilteredStudents = () => {
    let filtered = availableStudents;
    
    // Filter by year
    if (selectedYear !== 'All') {
      const yearNum = parseInt(selectedYear.charAt(0));
      filtered = filtered.filter(s => s.year === yearNum);
    }
    
    // Filter by search query
    if (studentSearchQuery.trim()) {
      const query = studentSearchQuery.toLowerCase();
      filtered = filtered.filter(student =>
        student.fullName.toLowerCase().includes(query) ||
        student.regNo.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const getFilteredStaff = () => {
    if (!staffSearchQuery.trim()) return availableStaff;
    const query = staffSearchQuery.toLowerCase();
    return availableStaff.filter(staff =>
      staff.fullName.toLowerCase().includes(query) ||
      staff.staffCode.toLowerCase().includes(query) ||
      staff.department.toLowerCase().includes(query)
    );
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTotalSelectedCount = () => {
    return selectedStudents.size + selectedStaff.size;
  };

  const pickAttachment = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType || 'image/jpeg';
      setAttachment({ name: asset.fileName || 'attachment.jpg', base64Uri: `data:${mimeType};base64,${asset.base64}` });
    }
  };

  const getSelectedParticipants = () => {
    const participants: Array<{id: string, type: 'student' | 'staff'}> = [];
    
    // Add selected students
    Array.from(selectedStudents).forEach(regNo => {
      participants.push({ id: regNo, type: 'student' });
    });
    
    // Add selected staff
    Array.from(selectedStaff).forEach(staffCode => {
      participants.push({ id: staffCode, type: 'staff' });
    });
    
    return participants;
  };

  const handleSubmit = async () => {
    if (!purpose.trim()) {
      Alert.alert('Validation Error', 'Please enter a purpose');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please describe the reason for gate pass');
      return;
    }
    const totalSelected = getTotalSelectedCount();
    if (totalSelected === 0) {
      Alert.alert('Validation Error', 'Please select at least one student or staff member');
      return;
    }
    if (!includeHOD && !receiverId) {
      Alert.alert('Validation Error', 'Please select a receiver (person who will hold the QR code)');
      return;
    }

    // Navigate back immediately — fire API in background
    handleGoBack();

    try {
      const participants = getSelectedParticipants();
      const response = await apiService.submitHODBulkGatePass({
        hodCode: user.hodCode,
        purpose: purpose.trim(),
        reason: reason.trim(),
        exitDateTime: new Date().toISOString(),
        returnDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        participantType: 'mixed',
        participants: participants.map(p => p.id),
        participantDetails: participants,
        includeHOD,
        receiverId: includeHOD ? undefined : (receiverId || undefined),
        receiverType: includeHOD ? undefined : (receiverType || undefined),
        attachmentUri: attachment?.base64Uri,
      } as any);
      if (!response.success) console.warn('HOD bulk gate pass failed:', response.message);
    } catch (error: any) {
      console.error('HOD bulk submit error:', error);
    }
  };

  const filteredStudents = getFilteredStudents();
  const filteredStaff = getFilteredStaff();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HOD Bulk Gate Pass</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text style={styles.infoBannerText}>Bulk passes are generated instantly — no HR approval required</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Selection Summary */}
        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Ionicons name="school" size={24} color="#3B82F6" />
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>Students</Text>
                  <Text style={styles.summaryValue}>{selectedStudents.size}</Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="briefcase" size={24} color="#10B981" />
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>Staff</Text>
                  <Text style={styles.summaryValue}>{selectedStaff.size}</Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Ionicons name="people" size={24} color="#F59E0B" />
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <Text style={styles.summaryValue}>{getTotalSelectedCount()}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Include HOD Checkbox */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              const newIncludeHOD = !includeHOD;
              setIncludeHOD(newIncludeHOD);
              if (newIncludeHOD) {
                setReceiverId(null);
                setReceiverType(null);
              }
            }}
            disabled={isSubmitting}
          >
            <Ionicons
              name={includeHOD ? 'checkbox' : 'square-outline'}
              size={24}
              color="#F59E0B"
            />
            <View style={styles.checkboxContent}>
              <Text style={styles.checkboxLabel}>Include HOD in this Pass</Text>
              <Text style={styles.checkboxSubtext}>
                {includeHOD 
                  ? 'HOD will hold the QR code for the group' 
                  : 'One participant will be selected as receiver to hold the QR code'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* View Mode Tabs */}
        <View style={styles.section}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, viewMode === 'students' && styles.tabActive]}
              onPress={() => setViewMode('students')}
            >
              <Ionicons 
                name="school" 
                size={20} 
                color={viewMode === 'students' ? '#FFF' : '#6B7280'} 
              />
              <Text style={[styles.tabText, viewMode === 'students' && styles.tabTextActive]}>
                Students
              </Text>
              {selectedStudents.size > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{selectedStudents.size}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, viewMode === 'staff' && styles.tabActive]}
              onPress={() => setViewMode('staff')}
            >
              <Ionicons 
                name="briefcase" 
                size={20} 
                color={viewMode === 'staff' ? '#FFF' : '#6B7280'} 
              />
              <Text style={[styles.tabText, viewMode === 'staff' && styles.tabTextActive]}>
                Staff
              </Text>
              {selectedStaff.size > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{selectedStaff.size}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Student Selection */}
        {viewMode === 'students' && (
          <View style={styles.section}>
            {/* Year Filter Dropdown */}
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Filter by Year:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearFilterScroll}>
                {yearOptions.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[styles.yearFilterButton, selectedYear === year && styles.yearFilterButtonActive]}
                    onPress={() => setSelectedYear(year)}
                  >
                    <Text style={[styles.yearFilterText, selectedYear === year && styles.yearFilterTextActive]}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Selected: {selectedStudents.size} / {filteredStudents.length}
              </Text>
              <TouchableOpacity onPress={selectAllParticipants} style={styles.selectAllButton}>
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search students..."
                placeholderTextColor="#9CA3AF"
                value={studentSearchQuery}
                onChangeText={setStudentSearchQuery}
              />
            </View>

            {/* Student List */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
              </View>
            ) : (
              <View style={styles.participantList}>
                {filteredStudents.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>No students found</Text>
                  </View>
                ) : (
                  filteredStudents.map((student) => {
                    const isSelected = selectedStudents.has(student.regNo);
                    
                    return (
                      <TouchableOpacity
                        key={student.regNo}
                        style={styles.participantItem}
                        onPress={() => toggleStudentSelection(student.regNo)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.checkbox}>
                          {isSelected ? (
                            <Ionicons name="checkbox" size={24} color="#F59E0B" />
                          ) : (
                            <Ionicons name="square-outline" size={24} color="#9CA3AF" />
                          )}
                        </View>
                        <View style={styles.participantInfo}>
                          <Text style={styles.participantName}>{student.fullName}</Text>
                          <Text style={styles.participantDetails}>
                            {student.regNo} • {student.year ? `${student.year}${student.year === 1 ? 'st' : student.year === 2 ? 'nd' : student.year === 3 ? 'rd' : 'th'} Year` : ''} • {student.department}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        {/* Staff Selection */}
        {viewMode === 'staff' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Selected: {selectedStaff.size} / {filteredStaff.length}
              </Text>
              <TouchableOpacity onPress={selectAllParticipants} style={styles.selectAllButton}>
                <Text style={styles.selectAllText}>Select All</Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search staff..."
                placeholderTextColor="#9CA3AF"
                value={staffSearchQuery}
                onChangeText={setStaffSearchQuery}
              />
            </View>

            {/* Staff List */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#F59E0B" />
              </View>
            ) : (
              <View style={styles.participantList}>
                {filteredStaff.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="briefcase-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.emptyStateText}>No staff members found</Text>
                  </View>
                ) : (
                  filteredStaff.map((staff) => {
                    const isSelected = selectedStaff.has(staff.staffCode);
                    
                    return (
                      <TouchableOpacity
                        key={staff.staffCode}
                        style={styles.participantItem}
                        onPress={() => toggleStaffSelection(staff.staffCode)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.checkbox}>
                          {isSelected ? (
                            <Ionicons name="checkbox" size={24} color="#F59E0B" />
                          ) : (
                            <Ionicons name="square-outline" size={24} color="#9CA3AF" />
                          )}
                        </View>
                        <View style={styles.participantInfo}>
                          <Text style={styles.participantName}>{staff.fullName}</Text>
                          <Text style={styles.participantDetails}>
                            {staff.staffCode} • {staff.department}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}
          </View>
        )}

        {/* Receiver Selection Section */}
        {!includeHOD && getTotalSelectedCount() > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Receiver (QR Code Holder)</Text>
            <View style={styles.receiverInfo}>
              <Ionicons name="information-circle" size={16} color="#F59E0B" />
              <Text style={styles.receiverInfoText}>
                The receiver will hold the QR code for the entire group
              </Text>
            </View>

            <View style={styles.receiverList}>
              {/* Selected Students */}
              {selectedStudents.size > 0 && (
                <>
                  <Text style={styles.receiverCategoryTitle}>Students</Text>
                  {Array.from(selectedStudents).map((regNo) => {
                    const student = availableStudents.find(s => s.regNo === regNo);
                    if (!student) return null;
                    
                    const isReceiver = receiverId === regNo && receiverType === 'student';
                    
                    return (
                      <TouchableOpacity
                        key={regNo}
                        style={[styles.receiverItem, isReceiver && styles.receiverItemActive]}
                        onPress={() => {
                          setReceiverId(regNo);
                          setReceiverType('student');
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.receiverRadio}>
                          <Ionicons 
                            name={isReceiver ? "radio-button-on" : "radio-button-off"} 
                            size={24} 
                            color={isReceiver ? "#F59E0B" : "#9CA3AF"} 
                          />
                        </View>
                        <View style={styles.receiverParticipantInfo}>
                          <View style={styles.receiverNameRow}>
                            <Text style={[styles.receiverParticipantName, isReceiver && styles.receiverParticipantNameActive]}>
                              {student.fullName}
                            </Text>
                            {isReceiver && (
                              <View style={styles.receiverActiveBadge}>
                                <Ionicons name="qr-code" size={12} color="#FFF" />
                                <Text style={styles.receiverActiveBadgeText}>RECEIVER</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.receiverParticipantDetails}>
                            {student.regNo} • {student.department}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}

              {/* Selected Staff */}
              {selectedStaff.size > 0 && (
                <>
                  <Text style={styles.receiverCategoryTitle}>Staff</Text>
                  {Array.from(selectedStaff).map((staffCode) => {
                    const staff = availableStaff.find(s => s.staffCode === staffCode);
                    if (!staff) return null;
                    
                    const isReceiver = receiverId === staffCode && receiverType === 'staff';
                    
                    return (
                      <TouchableOpacity
                        key={staffCode}
                        style={[styles.receiverItem, isReceiver && styles.receiverItemActive]}
                        onPress={() => {
                          setReceiverId(staffCode);
                          setReceiverType('staff');
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.receiverRadio}>
                          <Ionicons 
                            name={isReceiver ? "radio-button-on" : "radio-button-off"} 
                            size={24} 
                            color={isReceiver ? "#F59E0B" : "#9CA3AF"} 
                          />
                        </View>
                        <View style={styles.receiverParticipantInfo}>
                          <View style={styles.receiverNameRow}>
                            <Text style={[styles.receiverParticipantName, isReceiver && styles.receiverParticipantNameActive]}>
                              {staff.fullName}
                            </Text>
                            {isReceiver && (
                              <View style={styles.receiverActiveBadge}>
                                <Ionicons name="qr-code" size={12} color="#FFF" />
                                <Text style={styles.receiverActiveBadgeText}>RECEIVER</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.receiverParticipantDetails}>
                            {staff.staffCode} • {staff.department}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            </View>
          </View>
        )}

        {/* Gate Pass Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gate Pass Details</Text>

          {/* Request Date & Time */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>REQUEST DATE & TIME</Text>
            <View style={styles.requestDateTimeRow}>
              <View style={styles.requestDateTimeBox}>
                <Ionicons name="calendar-outline" size={18} color="#4B5563" />
                <Text style={styles.requestDateTimeText}>
                  {requestDateTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.requestDateTimeBox}>
                <Ionicons name="time-outline" size={18} color="#4B5563" />
                <Text style={styles.requestDateTimeText}>
                  {requestDateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </Text>
              </View>
            </View>
          </View>

          {/* Purpose */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Purpose *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter purpose for gate pass"
              placeholderTextColor="#9CA3AF"
              value={purpose}
              onChangeText={setPurpose}
              editable={!isSubmitting}
            />
          </View>

          {/* Reason */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Reason *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the reason for gate pass..."
              placeholderTextColor="#9CA3AF"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>

          {/* Attachment */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Attachment (Optional)</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickAttachment}>
              <Ionicons name="attach-outline" size={24} color="#9CA3AF" />
              <Text style={styles.uploadText}>
                {attachment ? attachment.name : 'Tap to upload image'}
              </Text>
              {attachment && (
                <TouchableOpacity onPress={() => setAttachment(null)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
            {attachment && (
              <Image source={{ uri: attachment.base64Uri }} style={styles.attachmentPreview} resizeMode="cover" />
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (isSubmitting || getTotalSelectedCount() === 0) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting || getTotalSelectedCount() === 0}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.submitButtonText}>
                Submit for {getTotalSelectedCount()} Participant{getTotalSelectedCount() !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  checkboxSubtext: {
    fontSize: 13,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#F59E0B',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFF',
  },
  tabBadge: {
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryTextContainer: {
    alignItems: 'flex-start',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  receiverCategoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  yearFilterScroll: {
    flexGrow: 0,
  },
  yearFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  yearFilterButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  yearFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  yearFilterTextActive: {
    color: '#F59E0B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  participantList: {
    gap: 8,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  participantDetails: {
    fontSize: 13,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  receiverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  receiverInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
  },
  receiverList: {
    gap: 10,
  },
  receiverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  receiverItemActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  receiverRadio: {
    width: 24,
    height: 24,
  },
  receiverParticipantInfo: {
    flex: 1,
  },
  receiverNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  receiverParticipantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  receiverParticipantNameActive: {
    color: '#92400E',
  },
  receiverActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  receiverActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  receiverParticipantDetails: {
    fontSize: 13,
    color: '#6B7280',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  purposeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  purposeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  purposeButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  purposeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  purposeButtonTextActive: {
    color: '#F59E0B',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  requestDateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  requestDateTimeBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  requestDateTimeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  uploadText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  attachmentPreview: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 10,
  },
});

export default HODBulkGatePassScreen;
