export type VisitType = "general_1" | "general_2" | "private";

export interface Room {
  number: string;     // Unique room identifier (e.g., "101")
  name: string;       // Room descriptive name (e.g., "جناح اليمامة")
  floor: number;      // Floor number
  type: string;       // Room type (جناح ملكي, غرفة مزدوجة, غرفة مفردة, جناح عائلي)
  capacity: number;   // Maximum capacity of people
  status: "available" | "occupied" | "full"; // Room state
  direction: string;  // Room orientation/view (إطلالة بحرية, إطلالة على المسبح, إطلالة داخلية, إطلالة على المدينة)
  visitType?: VisitType;
}

export interface Guest {
  id: string;         // Guest ID
  name: string;       // Full Name
  country: string;    // Country of origin
  mobile: string;     // Mobile number
  email?: string;     // Email address
  whatsapp?: string;  // WhatsApp number
  roomNumber: string; // Assigned Room Number
  status: "resident" | "checked_out"; // Active resident or left
  photoUrl: string;   // Image URL
  notes?: string;     // Custom booking notes
  checkInDate: string;// Check in timestamp
  checkOutDate?: string; // Check out timestamp
  year?: string;      // Season / Operational Year (e.g., "2026")
  visitType?: VisitType; // Visit type (الزيارة العامة الأولى, الزيارة العامة الثانية, الزيارة الخاصة)
  administrativeRole?: string; // الصفة / الدور الإداري (رئيس وفد، عضو وفد، مشرف إداري، ضيف شرف، إلخ)
}

export interface PendingRequest {
  id: string;
  name: string;
  country: string;
  mobile: string;
  email?: string;
  whatsapp?: string;
  roomType?: string;
  notes: string;
  photoUrl?: string;
  checkInDate?: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  year?: string;
  visitType?: VisitType;
  administrativeRole?: string; // الصفة / الدور الإداري
  assignedRoomNumber?: string;
  assignedGuestId?: string;
}

export interface ServiceRequest {
  id: string;
  roomNumber: string;
  guestName: string;
  category: "maintenance" | "catering" | "cleaning" | "amenities" | "general";
  title: string;
  description: string;
  priority: "urgent" | "normal" | "low";
  status: "new" | "in_progress" | "completed" | "cancelled";
  createdAt: string;
  assignedTo?: string;
  notes?: string;
  year?: string;
  visitType?: VisitType;
}

export type RoleType = "admin" | "reception" | "supervisor" | "services" | "security" | "auditor" | "public";

export interface SystemUserAccount {
  id: string;
  username: string;
  password: string;
  name: string;
  roleType: RoleType;
  title: string;
  avatarIcon: string;
  badgeColor: string;
  isActive: boolean;
  notes?: string;
}

export interface UserRole {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  icon?: string;
  permissions: {
    dashboard: boolean;
    rooms: boolean;
    guests: boolean;
    requests: boolean;
    id_cards: boolean;
    reports: boolean;
    checkin: boolean;
    checkout: boolean;
    room_config: boolean;
    services_committee: boolean;
    security_gate: boolean;
    permissions: boolean;
    tools: boolean;
  };
}

export interface GateEntryLog {
  id: string;
  guestId?: string;
  guestName: string;
  roomNumber: string;
  administrativeRole?: string;
  photoUrl?: string;
  country?: string;
  mobile?: string;
  action: "entry" | "exit" | "verification"; // حركة: دخول / خروج / تحقق أمني
  timestamp: string;
  guardName?: string;
  status: "granted" | "denied" | "flagged"; // مصرح / مرفوض / تنبيه
  notes?: string;
  scannedCode?: string;
}

export interface HotelStats {
  totalGuests: number;
  currentResidents: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number; // calculated percentage
  availableRooms: number;
  checkInsCount: number;
  checkOutsCount: number;
}

export interface IncomingRequestAlert {
  id: string;
  request: PendingRequest;
  timestamp: number;
  expiresAt: number;
}

