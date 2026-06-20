import React, { useState, useEffect, useRef, useCallback } from 'react';
import { theme } from '../theme';
import { api } from '../services/api';
import { useClickOutside } from '../hooks/useClickOutside';
import {
  Department,
  Staff,
  VisitorResponse,
  VisitorRole,
  ApprovalStatus,
} from '../types';

interface ProfessionalVisitorFormProps {
  onBack?: () => void;
}

const VISITOR_SESSION_KEY = 'ritgate_visitor_session_v1';
const MACHINE_ID_KEY = 'ritgate_machine_id';

interface StoredVisitorSession {
  requestId: number;
  machineId: string;
  name: string;
  email: string;
  department: string;
  personToMeet: string;
  approvalStatus: ApprovalStatus;
  qrCode?: string;
  manualCode?: string;
}

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', flag: '🇳🇵', name: 'Nepal' },
];

const VEHICLE_TYPES = ['Two Wheeler', 'Four Wheeler', 'Auto', 'Bus', 'Truck', 'Other'];

type DropdownKey = 'number' | 'role' | 'country' | 'department' | 'staff';

function readStoredSession(): StoredVisitorSession | null {
  try {
    const raw = localStorage.getItem(VISITOR_SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredVisitorSession) : null;
  } catch {
    return null;
  }
}
function writeStoredSession(s: StoredVisitorSession) {
  localStorage.setItem(VISITOR_SESSION_KEY, JSON.stringify(s));
}
function clearStoredSession() {
  localStorage.removeItem(VISITOR_SESSION_KEY);
}
function normalizeDept(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const ProfessionalVisitorForm: React.FC<ProfessionalVisitorFormProps> = ({ onBack }) => {
  // Form data
  const [numberOfVisitors, setNumberOfVisitors] = useState(1);
  const [visitorNames, setVisitorNames] = useState<string[]>(['']);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [role, setRole] = useState<VisitorRole>('VISITOR');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  // Data sources
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // UI state
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const [focusedField, setFocusedField] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Result state
  const [showSuccess, setShowSuccess] = useState(false);
  const [registeredVisitor, setRegisteredVisitor] = useState<VisitorResponse | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>('PENDING');
  const [approvedQrCode, setApprovedQrCode] = useState('');
  const [approvedManualCode, setApprovedManualCode] = useState('');
  const [showApprovalBanner, setShowApprovalBanner] = useState(false);
  const [copied, setCopied] = useState(false);
  const prevApprovalRef = useRef<ApprovalStatus>('PENDING');

  const formRef = useRef<HTMLDivElement>(null);
  const closeDropdown = useCallback(() => setOpenDropdown(null), []);
  useClickOutside(formRef, closeDropdown, openDropdown !== null);

  const [machineId] = useState<string>(() => {
    const existing = localStorage.getItem(MACHINE_ID_KEY);
    if (existing) return existing;
    const created = `WEB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(MACHINE_ID_KEY, created);
    return created;
  });

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];

  // Restore an in-progress session for this machine.
  useEffect(() => {
    const stored = readStoredSession();
    if (!stored || stored.machineId !== machineId) return;
    prevApprovalRef.current = stored.approvalStatus;
    setRegisteredVisitor({
      id: stored.requestId,
      name: stored.name,
      email: stored.email,
      department: stored.department,
      personToMeet: stored.personToMeet,
    } as VisitorResponse);
    setApprovalStatus(stored.approvalStatus);
    setApprovedQrCode(stored.qrCode || '');
    setApprovedManualCode(stored.manualCode || '');
    setShowSuccess(true);
  }, [machineId]);

  // Show a one-time banner on the PENDING -> APPROVED transition.
  useEffect(() => {
    if (approvalStatus === 'APPROVED' && prevApprovalRef.current !== 'APPROVED') {
      setShowApprovalBanner(true);
      const t = window.setTimeout(() => setShowApprovalBanner(false), 9000);
      prevApprovalRef.current = approvalStatus;
      return () => window.clearTimeout(t);
    }
    prevApprovalRef.current = approvalStatus;
    return undefined;
  }, [approvalStatus]);

  // Load departments once.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingDepartments(true);
        const list = await api.getDepartments();
        if (!active) return;
        setDepartments(list);
        setFilteredDepartments(list);
      } catch (err) {
        if (active) setError('Failed to load departments. Please refresh the page.');
      } finally {
        if (active) setLoadingDepartments(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback(
    (status: ApprovalStatus, extra?: { qrCode?: string; manualCode?: string }) => {
      if (!registeredVisitor) return;
      writeStoredSession({
        requestId: registeredVisitor.id,
        machineId,
        name: registeredVisitor.name,
        email: registeredVisitor.email,
        department: registeredVisitor.department,
        personToMeet: registeredVisitor.personToMeet,
        approvalStatus: status,
        qrCode: extra?.qrCode,
        manualCode: extra?.manualCode,
      });
    },
    [registeredVisitor, machineId]
  );

  const resetResult = useCallback(() => {
    clearStoredSession();
    setShowSuccess(false);
    setRegisteredVisitor(null);
    setApprovalStatus('PENDING');
    setApprovedQrCode('');
    setApprovedManualCode('');
    setShowApprovalBanner(false);
    prevApprovalRef.current = 'PENDING';
  }, []);

  // Poll approval status while showing the success screen.
  useEffect(() => {
    if (!showSuccess || !registeredVisitor?.id) return;
    let active = true;

    const tick = async () => {
      const data = await api.getVisitorStatus(registeredVisitor.id, machineId);
      if (!active || !data?.success) return;

      const scanCount =
        typeof data.scanCount === 'number' ? data.scanCount : parseInt(String(data.scanCount || 0), 10) || 0;
      const statusUpper = String(data.status || '').toUpperCase();

      if (scanCount >= 2 || statusUpper === 'EXITED') {
        resetResult();
        return;
      }
      if (statusUpper === 'APPROVED') {
        const qr = data.qrCode || '';
        const manual = data.manualCode || '';
        setApprovalStatus('APPROVED');
        setApprovedQrCode(qr);
        setApprovedManualCode(manual);
        persist('APPROVED', { qrCode: qr, manualCode: manual });
      } else if (statusUpper === 'REJECTED') {
        setApprovalStatus('REJECTED');
        persist('REJECTED');
      } else {
        setApprovalStatus('PENDING');
        persist('PENDING');
      }
    };

    tick();
    const interval = setInterval(tick, 4000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [showSuccess, registeredVisitor?.id, machineId, persist, resetResult]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const toggleDropdown = (key: DropdownKey) =>
    setOpenDropdown((cur) => (cur === key ? null : key));

  const handleNumberChange = (value: number) => {
    setNumberOfVisitors(value);
    setVisitorNames((prev) => Array(value).fill('').map((_, i) => prev[i] || ''));
    setOpenDropdown(null);
  };

  const handleNameChange = (index: number, value: string) => {
    setVisitorNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setError('');
  };

  const loadStaff = async (dept: Department) => {
    if (!dept.code) return;
    setLoadingStaff(true);
    try {
      const staff = await api.getStaffByDepartment(dept.code, dept.name);
      setStaffMembers(staff);
      setFilteredStaff(staff);
    } catch {
      setError('Failed to load staff members');
    } finally {
      setLoadingStaff(false);
    }
  };

  const selectDepartment = (dept: Department) => {
    setSelectedDepartment(dept.name);
    setSelectedDepartmentCode(dept.code);
    setSelectedStaff('');
    setSelectedStaffId('');
    setStaffMembers([]);
    setFilteredStaff([]);
    setError('');
    setOpenDropdown(null);
    loadStaff(dept);
  };

  const resolveDepartment = (rawValue: string): Department | null => {
    const value = rawValue.trim();
    if (!value) return null;
    const normalized = normalizeDept(value);
    const aliasMap: Record<string, string[]> = {
      admin: ['admin', 'administration', 'nonteachingadmin', 'nonteaching'],
    };
    const inputAliases = aliasMap[normalized] || [normalized];
    return (
      departments.find((dept) => {
        const deptTokens = [normalizeDept(dept.name), normalizeDept(dept.code || '')];
        const deptAlias = aliasMap[normalizeDept(dept.name)] || [];
        const pool = [...deptTokens, ...deptAlias];
        return inputAliases.some((token) => pool.some((p) => p === token || p.includes(token) || token.includes(p)));
      }) || null
    );
  };

  const handleDepartmentInput = (value: string) => {
    setSelectedDepartment(value);
    setSelectedDepartmentCode('');
    setSelectedStaff('');
    setSelectedStaffId('');
    setStaffMembers([]);
    setFilteredStaff([]);
    setFilteredDepartments(
      departments.filter((d) => d.name.toLowerCase().includes(value.toLowerCase()))
    );
    setOpenDropdown('department');
  };

  const selectStaff = (staff: Staff) => {
    setSelectedStaff(staff.name);
    setSelectedStaffId(staff.staffCode || staff.id);
    setOpenDropdown(null);
  };

  const handleStaffInput = (value: string) => {
    setSelectedStaff(value);
    setFilteredStaff(staffMembers.filter((s) => s.name.toLowerCase().includes(value.toLowerCase())));
    setOpenDropdown('staff');
  };

  const validate = (): boolean => {
    const fail = (msg: string): boolean => {
      setError(msg);
      return false;
    };
    if (visitorNames.some((n) => !n.trim())) return fail('Please enter names for all visitors');
    if (!email.trim() || !email.includes('@')) return fail('Please enter a valid email address');
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10)
      return fail('Please enter a valid phone number (minimum 10 digits)');
    if (!selectedDepartment) return fail('Please select a department to visit');
    if (!selectedStaff) return fail('Please select a person to meet');
    if (!purpose.trim()) return fail('Please enter the purpose of your visit');
    if (vehicleNumber.trim() && !vehicleType) return fail('Please select a vehicle type for your vehicle');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setError('');
    try {
      const visitor = await api.registerVisitor({
        name: visitorNames[0],
        email,
        phone: `${countryCode} ${phone}`.trim(),
        role,
        machineId,
        department: selectedDepartment,
        staffCode: selectedStaffId,
        purpose,
        reason: '',
        numberOfPeople: numberOfVisitors,
        vehicleNumber: vehicleNumber || undefined,
        vehicleType: vehicleNumber ? vehicleType : undefined,
      });
      setRegisteredVisitor(visitor);
      setApprovalStatus('PENDING');
      setShowSuccess(true);
      writeStoredSession({
        requestId: visitor.id,
        machineId,
        name: visitor.name,
        email: visitor.email,
        department: visitor.department,
        personToMeet: visitor.personToMeet,
        approvalStatus: 'PENDING',
      });
      // Reset the form fields behind the success screen.
      setNumberOfVisitors(1);
      setVisitorNames(['']);
      setEmail('');
      setPhone('');
      setSelectedDepartment('');
      setSelectedDepartmentCode('');
      setSelectedStaff('');
      setSelectedStaffId('');
      setPurpose('');
      setRole('VISITOR');
      setVehicleNumber('');
      setVehicleType('');
      setStaffMembers([]);
    } catch (err: any) {
      setError(err?.message || 'Failed to register. Please try again or contact security.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = async () => {
    if (!approvedManualCode) return;
    try {
      await navigator.clipboard.writeText(approvedManualCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  // ── Styles ──────────────────────────────────────────────────────────────
  const c = theme.color;
  const input = (focused: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '14px 16px',
    fontSize: 15,
    border: `2px solid ${focused ? c.brand : c.line}`,
    borderRadius: theme.radius.md,
    transition: 'all 0.2s ease',
    background: focused ? c.surface : c.surfaceAlt,
    color: c.ink,
    outline: 'none',
    boxShadow: focused ? '0 0 0 4px rgba(0,188,212,0.10)' : 'none',
    fontFamily: 'inherit',
  });
  const label: React.CSSProperties = { display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 8 };
  const sectionTitle: React.CSSProperties = {
    fontSize: 12, fontWeight: 800, color: c.brandDark, textTransform: 'uppercase',
    letterSpacing: '1.2px', margin: '8px 0 16px', display: 'flex', alignItems: 'center', gap: 8,
  };
  const group: React.CSSProperties = { marginBottom: 22, position: 'relative' };
  const menu: React.CSSProperties = {
    position: 'absolute', top: '100%', left: 0, right: 0, background: c.surface,
    border: `1px solid ${c.line}`, borderRadius: theme.radius.md, marginTop: 8, maxHeight: 300,
    overflowY: 'auto', boxShadow: theme.shadow.lg, zIndex: 50, animation: 'vf-drop 0.18s ease-out',
  };
  const item = (hl: boolean): React.CSSProperties => ({
    padding: '13px 18px', cursor: 'pointer', transition: 'background 0.15s ease',
    background: hl ? c.brand : 'transparent', color: hl ? '#fff' : '#374151',
    fontSize: 15, fontWeight: hl ? 600 : 500, borderBottom: `1px solid ${c.surfaceSunken}`,
  });
  const chip = (selected: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: theme.radius.pill,
    border: `2px solid ${selected ? c.brand : c.line}`,
    background: selected ? c.brandTint : c.surfaceAlt,
    color: selected ? c.brandDark : c.muted,
    fontWeight: selected ? 700 : 500, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
  });
  const submitBtn: React.CSSProperties = {
    width: '100%', padding: '16px 32px', fontSize: 16, fontWeight: 700, color: '#fff',
    background: theme.gradient.brand, border: 'none', borderRadius: theme.radius.md,
    cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.2s ease',
    boxShadow: theme.shadow.brandSoft, opacity: isSubmitting ? 0.7 : 1, marginTop: 6,
  };
  const backBtn: React.CSSProperties = {
    position: 'fixed', top: 20, left: 20, zIndex: 1000, padding: '11px 20px', fontSize: 14, fontWeight: 600,
    color: '#fff', background: 'rgba(255,255,255,0.16)', border: '2px solid rgba(255,255,255,0.32)',
    borderRadius: theme.radius.md, cursor: 'pointer', backdropFilter: 'blur(10px)', fontFamily: 'inherit',
  };

  const keyframes = `
    @keyframes vf-slideUp { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes vf-scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
    @keyframes vf-drop { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes vf-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
    @keyframes vf-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.08); } }
    @keyframes vf-banner { 0% { opacity: 0; transform: translateY(-120%); } 60% { opacity: 1; transform: translateY(10px); } 100% { transform: translateY(0); } }
  `;

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh', background: theme.gradient.brand,
    padding: '48px 20px', fontFamily: theme.font.sans,
  };
  const cardStyle: React.CSSProperties = {
    background: c.surface, borderRadius: theme.radius.xl, padding: 'clamp(24px, 4vw, 40px)',
    boxShadow: theme.shadow.lg, animation: 'vf-scaleIn 0.45s ease-out',
  };

  // ── Success screen ──────────────────────────────────────────────────────
  if (showSuccess && registeredVisitor) {
    const detail = (k: string, v?: string, last = false) => (
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderBottom: last ? 'none' : `1px solid ${c.line}` }}>
        <span style={{ fontWeight: 600, color: c.muted }}>{k}</span>
        <span style={{ fontWeight: 600, color: c.ink, textAlign: 'right' }}>{v}</span>
      </div>
    );

    return (
      <div style={pageStyle}>
        <style>{keyframes}</style>
        {showApprovalBanner && (
          <div role="status" aria-live="polite" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2000, background: 'linear-gradient(90deg, #059669, #10b981 55%, #34d399)', color: '#fff', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 12px 40px rgba(5,150,105,0.45)', animation: 'vf-banner 0.8s cubic-bezier(0.34,1.45,0.64,1) both' }}>
            <span aria-hidden style={{ fontSize: 30 }}>✓</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Your visit has been approved</div>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.95 }}>Your gate pass is ready — use the QR or manual code at security.</div>
            </div>
          </div>
        )}
        {onBack && <button onClick={onBack} style={backBtn}>← Back to Home</button>}

        <div style={{ maxWidth: 640, margin: '0 auto', animation: 'vf-slideUp 0.5s ease-out' }}>
          <div style={cardStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 76, height: 76, margin: '0 auto 20px', background: theme.gradient.successText, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, color: '#fff', boxShadow: '0 10px 30px rgba(16,185,129,0.3)', animation: 'vf-scaleIn 0.5s ease-out' }}>✓</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: c.success, marginBottom: 12 }}>Request Submitted!</h2>
              <p style={{ fontSize: 15, color: c.muted, marginBottom: 28, lineHeight: 1.6 }}>
                Your visit request has been sent to <strong>{registeredVisitor.personToMeet}</strong> for approval.
              </p>

              {approvalStatus === 'PENDING' && (
                <div style={{ background: theme.gradient.brand && `linear-gradient(135deg, ${c.warningSoft}, #FDE68A)`, border: `2px solid ${c.warning}`, borderRadius: theme.radius.lg, padding: 28, marginBottom: 24 }}>
                  <div style={{ fontSize: 44, marginBottom: 12, animation: 'vf-pulse 2s ease-in-out infinite' }}>⏳</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#92400e', marginBottom: 8 }}>Awaiting Approval</h3>
                  <p style={{ fontSize: 14, color: '#78350f' }}>This page updates automatically and your QR + manual code will appear here once approved.</p>
                </div>
              )}

              {approvalStatus === 'APPROVED' && (
                <div style={{ background: `linear-gradient(135deg, ${c.successSoft}, #BBF7D0)`, border: `2px solid ${c.success}`, borderRadius: theme.radius.lg, padding: 28, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#166534', marginBottom: 16 }}>✅ Approved — Your Pass Is Ready</h3>
                  {approvedQrCode && (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(approvedQrCode)}`}
                      alt="Gate pass QR code"
                      style={{ borderRadius: theme.radius.md, border: '4px solid #166534', background: '#fff', padding: 14, maxWidth: 'min(240px, 80vw)', height: 'auto', marginBottom: 16 }}
                    />
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderRadius: theme.radius.md, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(22,101,52,0.25)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#166534', letterSpacing: '0.12em' }}>MANUAL CODE</span>
                      <span style={{ fontSize: 20, color: '#14532d', fontWeight: 900, letterSpacing: 3 }}>{approvedManualCode || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button type="button" onClick={copyCode} disabled={!approvedManualCode} style={{ padding: '10px 16px', borderRadius: theme.radius.sm, border: '1px solid rgba(22,101,52,0.25)', background: '#fff', cursor: approvedManualCode ? 'pointer' : 'not-allowed', fontWeight: 800, color: '#14532d', fontFamily: 'inherit' }}>
                        {copied ? '✓ Copied' : 'Copy code'}
                      </button>
                      {approvedQrCode && (
                        <a href={`https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(approvedQrCode)}`} download style={{ padding: '10px 16px', borderRadius: theme.radius.sm, border: '1px solid rgba(22,101,52,0.25)', background: '#fff', fontWeight: 800, color: '#14532d', textDecoration: 'none' }}>
                          Download QR
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {approvalStatus === 'REJECTED' && (
                <div style={{ background: `linear-gradient(135deg, ${c.dangerSoft}, #FECACA)`, border: `2px solid ${c.danger}`, borderRadius: theme.radius.lg, padding: 28, marginBottom: 24 }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>✗</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>Request Rejected</h3>
                  <p style={{ fontSize: 14, color: '#991B1B' }}>Your request was declined by the host. Please contact reception for help.</p>
                </div>
              )}

              <div style={{ background: c.surfaceAlt, borderRadius: theme.radius.lg, padding: 22, marginBottom: 24, textAlign: 'left' }}>
                {detail('Name', registeredVisitor.name)}
                {detail('Email', registeredVisitor.email)}
                {detail('Department', registeredVisitor.department)}
                {detail('Person to Meet', registeredVisitor.personToMeet, true)}
              </div>

              <button onClick={resetResult} style={submitBtn}>Register Another Visitor</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <style>{keyframes}</style>
      {onBack && <button onClick={onBack} style={backBtn}>← Back to Home</button>}

      <div style={{ maxWidth: 720, margin: '0 auto', animation: 'vf-slideUp 0.5s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', textShadow: '0 2px 20px rgba(0,0,0,0.18)' }}>Visitor Registration</h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.92)', marginTop: 8 }}>Welcome to our campus. Please fill in your details below.</p>
        </div>

        <div style={cardStyle} ref={formRef}>
          {error && (
            <div role="alert" style={{ background: c.dangerSoft, color: '#991b1b', padding: '14px 18px', borderRadius: theme.radius.md, fontSize: 14, fontWeight: 600, marginBottom: 20, border: `2px solid #fecaca`, animation: 'vf-shake 0.4s ease' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Visitor info */}
            <div style={sectionTitle}><span aria-hidden>👥</span> Visitor Information</div>

            <div style={group}>
              <label style={label} htmlFor="vf-count">Number of Visitors</label>
              <button id="vf-count" type="button" aria-haspopup="listbox" aria-expanded={openDropdown === 'number'} onClick={() => toggleDropdown('number')} style={{ ...input(openDropdown === 'number'), cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{numberOfVisitors} {numberOfVisitors === 1 ? 'Person' : 'People'}</span>
                <span aria-hidden style={{ color: c.muted, fontSize: 11 }}>▼</span>
              </button>
              {openDropdown === 'number' && (
                <ul role="listbox" style={{ ...menu, listStyle: 'none' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <li key={n} role="option" aria-selected={numberOfVisitors === n} onClick={() => handleNumberChange(n)} style={item(numberOfVisitors === n)}>
                      {numberOfVisitors === n && '✓ '}{n} {n === 1 ? 'Person' : 'People'}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div style={group}>
              <label style={label} htmlFor="vf-name-0">Visitor Name{numberOfVisitors > 1 ? 's' : ''}</label>
              {visitorNames.map((name, i) => (
                <input
                  key={i}
                  id={`vf-name-${i}`}
                  type="text"
                  placeholder={`Visitor ${i + 1} Full Name`}
                  value={name}
                  onChange={(e) => handleNameChange(i, e.target.value)}
                  onFocus={() => setFocusedField(`name-${i}`)}
                  onBlur={() => setFocusedField('')}
                  style={{ ...input(focusedField === `name-${i}`), marginBottom: i < visitorNames.length - 1 ? 10 : 0 }}
                  required
                />
              ))}
            </div>

            {/* Contact */}
            <div style={sectionTitle}><span aria-hidden>📧</span> Contact Details</div>

            <div style={group}>
              <label style={label} htmlFor="vf-email">Email Address</label>
              <input id="vf-email" type="email" placeholder="youremail@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField('')} style={input(focusedField === 'email')} required />
            </div>

            <div style={group}>
              <label style={label} htmlFor="vf-phone">Phone Number</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button type="button" aria-haspopup="listbox" aria-expanded={openDropdown === 'country'} onClick={() => toggleDropdown('country')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: '100%', fontSize: 15, fontWeight: 600, border: `2px solid ${openDropdown === 'country' ? c.brand : c.line}`, borderRadius: theme.radius.md, background: c.surfaceAlt, cursor: 'pointer', color: c.ink, fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 18 }}>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                    <span aria-hidden style={{ fontSize: 10, color: c.muted }}>▼</span>
                  </button>
                  {openDropdown === 'country' && (
                    <ul role="listbox" style={{ ...menu, width: 230, listStyle: 'none' }}>
                      {COUNTRIES.map((co) => (
                        <li key={co.code} role="option" aria-selected={countryCode === co.code} onClick={() => { setCountryCode(co.code); setOpenDropdown(null); }} style={{ ...item(countryCode === co.code), display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 18 }}>{co.flag}</span>
                          <span style={{ flex: 1 }}>{co.name}</span>
                          <span style={{ opacity: 0.7 }}>{co.code}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <input id="vf-phone" type="tel" inputMode="numeric" placeholder="XXXXX XXXXX" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField('')} style={{ ...input(focusedField === 'phone'), flex: 1 }} required />
              </div>
            </div>

            <div style={group}>
              <label style={label} htmlFor="vf-role">Visitor or Vendor</label>
              <button id="vf-role" type="button" aria-haspopup="listbox" aria-expanded={openDropdown === 'role'} onClick={() => toggleDropdown('role')} style={{ ...input(openDropdown === 'role'), cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{role === 'VISITOR' ? 'Visitor' : 'Vendor'}</span>
                <span aria-hidden style={{ color: c.muted, fontSize: 11 }}>▼</span>
              </button>
              {openDropdown === 'role' && (
                <ul role="listbox" style={{ ...menu, listStyle: 'none' }}>
                  {(['VISITOR', 'VENDOR'] as const).map((r) => (
                    <li key={r} role="option" aria-selected={role === r} onClick={() => { setRole(r); setOpenDropdown(null); }} style={item(role === r)}>
                      {role === r && '✓ '}{r === 'VISITOR' ? 'Visitor' : 'Vendor'}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Visit details */}
            <div style={sectionTitle}><span aria-hidden>🏢</span> Visit Details</div>

            <div style={group}>
              <label style={label} htmlFor="vf-dept">Department to Visit</label>
              {loadingDepartments ? (
                <div style={{ padding: '14px 16px', textAlign: 'center', color: c.muted, background: c.surfaceAlt, borderRadius: theme.radius.md }}>Loading departments…</div>
              ) : (
                <>
                  <input id="vf-dept" type="text" placeholder="Select or type department name" value={selectedDepartment} autoComplete="off" role="combobox" aria-expanded={openDropdown === 'department'} aria-controls="vf-dept-list" onChange={(e) => handleDepartmentInput(e.target.value)} onFocus={() => { setFocusedField('department'); setFilteredDepartments(departments); setOpenDropdown('department'); }} onBlur={() => { setFocusedField(''); if (!selectedDepartmentCode && selectedDepartment.trim()) { const m = resolveDepartment(selectedDepartment); if (m) selectDepartment(m); } }} style={input(focusedField === 'department')} required />
                  {openDropdown === 'department' && filteredDepartments.length > 0 && (
                    <ul id="vf-dept-list" role="listbox" style={{ ...menu, listStyle: 'none' }}>
                      {filteredDepartments.map((d) => (
                        <li key={d.code} role="option" aria-selected={selectedDepartment === d.name} onMouseDown={(e) => e.preventDefault()} onClick={() => selectDepartment(d)} style={item(selectedDepartment === d.name)}>
                          {selectedDepartment === d.name && '✓ '}{d.name}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {selectedDepartment && (
              <div style={group}>
                <label style={label} htmlFor="vf-staff">Person to Meet</label>
                {loadingStaff ? (
                  <div style={{ padding: '14px 16px', textAlign: 'center', color: c.muted, background: c.surfaceAlt, borderRadius: theme.radius.md }}>Loading staff members…</div>
                ) : (
                  <>
                    <input id="vf-staff" type="text" placeholder="Select or type staff member name" value={selectedStaff} autoComplete="off" role="combobox" aria-expanded={openDropdown === 'staff'} aria-controls="vf-staff-list" onChange={(e) => handleStaffInput(e.target.value)} onFocus={() => { setFocusedField('staff'); setFilteredStaff(staffMembers); setOpenDropdown('staff'); }} onBlur={() => setFocusedField('')} style={input(focusedField === 'staff')} required />
                    {openDropdown === 'staff' && filteredStaff.length > 0 && (
                      <ul id="vf-staff-list" role="listbox" style={{ ...menu, listStyle: 'none' }}>
                        {filteredStaff.map((s) => {
                          const hl = selectedStaff === s.name;
                          return (
                            <li key={s.id} role="option" aria-selected={hl} onMouseDown={(e) => e.preventDefault()} onClick={() => selectStaff(s)} style={item(hl)}>
                              <span style={{ fontWeight: 600 }}>{hl && '✓ '}{s.name}</span>
                              <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: hl ? 'rgba(255,255,255,0.9)' : c.brandDark, background: hl ? 'rgba(255,255,255,0.18)' : c.brandTint, padding: '2px 8px', borderRadius: 6 }}>{s.role || 'Faculty'}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {!loadingStaff && selectedDepartmentCode && openDropdown === 'staff' && filteredStaff.length === 0 && (
                      <ul role="listbox" style={{ ...menu, listStyle: 'none' }}>
                        <li style={item(false)}>No staff found for this department</li>
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}

            <div style={group}>
              <label style={label} htmlFor="vf-purpose">Purpose of Visit</label>
              <textarea id="vf-purpose" placeholder="Please describe the purpose of your visit…" value={purpose} onChange={(e) => setPurpose(e.target.value)} onFocus={() => setFocusedField('purpose')} onBlur={() => setFocusedField('')} style={{ ...input(focusedField === 'purpose'), minHeight: 110, resize: 'vertical' }} required />
            </div>

            <div style={group}>
              <label style={label} htmlFor="vf-vehicle">Vehicle Number (Optional)</label>
              <input id="vf-vehicle" type="text" placeholder="e.g., TN01AB1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} onFocus={() => setFocusedField('vehicle')} onBlur={() => setFocusedField('')} style={input(focusedField === 'vehicle')} />
            </div>

            {vehicleNumber.trim() && (
              <div style={group}>
                <label style={{ ...label, color: c.danger }}>Vehicle Type <span aria-hidden>*</span></label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {VEHICLE_TYPES.map((vt) => (
                    <button key={vt} type="button" onClick={() => setVehicleType(vt)} style={chip(vehicleType === vt)}>{vt}</button>
                  ))}
                </div>
                {!vehicleType && <p style={{ fontSize: 12, color: c.danger, marginTop: 6 }}>Please select a vehicle type</p>}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} style={submitBtn}>
              {isSubmitting ? 'Submitting Request…' : 'Submit Visitor Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalVisitorForm;
