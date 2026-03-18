import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RequestTimelineProps {
  status: string;
  staffApproval: string;
  hodApproval: string;
  requestDate: string;
  staffRemark?: string;
  hodRemark?: string;
}

const RequestTimeline: React.FC<RequestTimelineProps> = ({
  status,
  staffApproval,
  hodApproval,
  staffRemark,
  hodRemark,
}) => {
  const getStepStatus = (step: number) => {
    if (status === 'REJECTED') {
      if (step === 1) return 'completed';
      if (step === 2 && staffApproval === 'REJECTED') return 'rejected';
      if (step === 3 && hodApproval === 'REJECTED') return 'rejected';
      return 'pending';
    }

    if (status === 'APPROVED') {
      return 'completed';
    }

    if (step === 1) return 'completed';
    if (step === 2) {
      if (staffApproval === 'APPROVED') return 'completed';
      if (staffApproval === 'REJECTED') return 'rejected';
      return 'active';
    }
    if (step === 3) {
      if (hodApproval === 'APPROVED') return 'completed';
      if (hodApproval === 'REJECTED') return 'rejected';
      if (staffApproval === 'APPROVED') return 'active';
      return 'pending';
    }
    return 'pending';
  };

  const getStepColor = (stepStatus: string) => {
    if (stepStatus === 'completed') return '#10B981';
    if (stepStatus === 'rejected') return '#EF4444';
    if (stepStatus === 'active') return '#F59E0B';
    return '#9CA3AF';
  };

  const getStepIcon = (stepStatus: string) => {
    if (stepStatus === 'completed') return 'checkmark-circle';
    if (stepStatus === 'rejected') return 'close-circle';
    if (stepStatus === 'active') return 'time';
    return 'ellipse-outline';
  };

  const steps = [
    { label: 'Request Submitted', step: 1 },
    { label: 'Staff Approval', step: 2 },
    { label: 'HOD Approval', step: 3 },
  ];

  const getCompletedStepsCount = () => {
    let count = 1;
    if (staffApproval === 'APPROVED') count++;
    if (hodApproval === 'APPROVED') count++;
    return count;
  };

  const progressPercentage = (getCompletedStepsCount() / 3) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground} />
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progressPercentage}%`,
              backgroundColor: status === 'APPROVED' ? '#10B981' : 
                              status === 'REJECTED' ? '#EF4444' : '#F59E0B',
            },
          ]}
        />
      </View>

      {/* Timeline Steps */}
      {steps.map((item, index) => {
        const stepStatus = getStepStatus(item.step);
        const color = getStepColor(stepStatus);
        const icon = getStepIcon(stepStatus);

        return (
          <View key={item.step} style={styles.stepContainer}>
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: color + '20' },
                ]}
              >
                <Ionicons name={icon as any} size={28} color={color} />
              </View>
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: getStepColor(getStepStatus(item.step + 1)) + '40' }
                  ]}
                />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepLabel}>{item.label}</Text>
              <Text style={[styles.stepStatus, { color }]}>
                {stepStatus === 'completed' ? '✓ Completed' :
                 stepStatus === 'rejected' ? '✗ Rejected' :
                 stepStatus === 'active' ? '⏳ In Progress' : '○ Pending'}
              </Text>
              {item.step === 2 && staffRemark && (
                <View style={styles.remarkContainer}>
                  <Text style={styles.remarkLabel}>Staff Remark:</Text>
                  <Text style={styles.remarkText}>{staffRemark}</Text>
                </View>
              )}
              {item.step === 3 && hodRemark && (
                <View style={styles.remarkContainer}>
                  <Text style={styles.remarkLabel}>HOD Remark:</Text>
                  <Text style={styles.remarkText}>{hodRemark}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
  },
  progressBarContainer: {
    height: 6,
    marginBottom: 24,
    marginHorizontal: 8,
    position: 'relative',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 3,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    width: 4,
    flex: 1,
    marginTop: 6,
    marginBottom: 6,
    borderRadius: 2,
  },
  stepContent: {
    flex: 1,
    paddingTop: 8,
  },
  stepLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.3,
    color: '#1F2937',
  },
  stepStatus: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  remarkContainer: {
    marginTop: 8,
    backgroundColor: '#F3F4F6',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  remarkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  remarkText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});

export default RequestTimeline;
