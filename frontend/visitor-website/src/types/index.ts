export interface Department {
  id: string;
  code: string;
  name: string;
  hod?: string;
}

export interface Staff {
  id: string;
  staffId?: string;
  staffCode: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  department?: string;
}

export type VisitorRole = 'VISITOR' | 'VENDOR';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VisitorRegistration {
  name: string;
  email: string;
  phone: string;
  role: VisitorRole;
  machineId: string;
  department: string;
  staffCode: string;
  purpose: string;
  reason?: string;
  numberOfPeople?: number;
  vehicleNumber?: string;
  vehicleType?: string;
}

export interface VisitorResponse {
  id: number;
  name: string;
  email: string;
  department: string;
  personToMeet: string;
  approvalStatus?: string;
  message?: string;
}

export interface VisitorStatus {
  success: boolean;
  status?: string;
  scanCount?: number;
  qrCode?: string;
  manualCode?: string;
  name?: string;
  role?: string;
  message?: string;
}
