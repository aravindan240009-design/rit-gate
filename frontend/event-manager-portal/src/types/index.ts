export interface ECUser {
  username: string;
  displayName: string;
  email: string;
  role: string;
  token: string;
}

export interface Event {
  id: number;
  eventName: string;
  eventDate: string;
  venue: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdByHod: string;
  createdAt: string | null;
}

export interface Staff {
  staffCode: string;
  name: string;
  department: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface Coordinator {
  id: number;
  eventId: number;
  staffCode: string;
  staffName: string;
  assignedBy: string;
  assignedAt: string | null;
}

export interface EventPass {
  id: number;
  eventId: number;
  fullName: string;
  email: string;
  collegeName: string;
  phone: string;
  studentId: string;
  department: string;
  course: string;
  status: string;
  manualEntryCode: string;
  entryScannedAt: string | null;
  exitScannedAt: string | null;
}
