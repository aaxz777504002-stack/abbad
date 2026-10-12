import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache client instance in memory
let cachedSupabase: SupabaseClient | null = null;
let currentSupabaseUrl = '';
let currentSupabaseKey = '';

// Get config from localStorage or env
export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = '';
  let anonKey = '';

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      url = window.localStorage.getItem('supabase_url') || '';
      anonKey = window.localStorage.getItem('supabase_anon_key') || '';
    }
  } catch (e) {
    // Ignore storage errors
  }

  // Fallback to Vite env variables if not set in local storage
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : null;
  if (!url && metaEnv?.VITE_SUPABASE_URL) {
    url = String(metaEnv.VITE_SUPABASE_URL).trim();
  }
  if (!anonKey && metaEnv?.VITE_SUPABASE_ANON_KEY) {
    anonKey = String(metaEnv.VITE_SUPABASE_ANON_KEY).trim();
  }

  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey)
  };
}

// Save config
export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('supabase_url', url.trim());
      window.localStorage.setItem('supabase_anon_key', anonKey.trim());
    }
  } catch (e) {
    console.warn('Could not save supabase config to localStorage', e);
  }
  cachedSupabase = null;
  currentSupabaseUrl = '';
  currentSupabaseKey = '';
}

// Clear config
export function clearSupabaseConfig(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('supabase_url');
      window.localStorage.removeItem('supabase_anon_key');
    }
  } catch (e) {}
  cachedSupabase = null;
  currentSupabaseUrl = '';
  currentSupabaseKey = '';
}

// Get or initialize Supabase client
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (cachedSupabase && currentSupabaseUrl === url && currentSupabaseKey === anonKey) {
    return cachedSupabase;
  }

  try {
    cachedSupabase = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentSupabaseUrl = url;
    currentSupabaseKey = anonKey;
    return cachedSupabase;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Test connection to Supabase
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; status?: string }> {
  try {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    if (!cleanUrl || !cleanKey) {
      return { success: false, message: 'يرجى إدخال رابط المشروع (Project URL) والمفتاح (API Key) الخاص بـ Supabase.' };
    }

    const testClient = createClient(cleanUrl, cleanKey);
    // Query rooms table
    const { error: roomsError } = await testClient.from('rooms').select('count', { count: 'exact', head: true });

    if (roomsError) {
      if (roomsError.code === '42P01' || roomsError.message?.toLowerCase().includes('does not exist') || roomsError.message?.toLowerCase().includes('relation')) {
        return {
          success: true,
          status: 'needs_tables',
          message: 'تم الاتصال بمشروع Supabase بنجاح! الجداول غير منشأة بعد، يمكنك نسخ سكربت SQL وتشغيله لإنشاء كافة الجداول وتفعيل الصلاحيات.'
        };
      }
      if (roomsError.code === 'PGRST301' || roomsError.message?.toLowerCase().includes('jwt') || roomsError.message?.toLowerCase().includes('apikey')) {
        return {
          success: false,
          status: 'unauthorized',
          message: 'فشل التحقق من مفتاح Supabase API Key (تأكد من صحة Anon Key أو Service Role Key).'
        };
      }
      return {
        success: false,
        status: 'error',
        message: `خطأ في الاتصال بـ Supabase: ${roomsError.message}`
      };
    }

    return {
      success: true,
      status: 'ready',
      message: 'تم الاتصال بنجاح بقاعدة بيانات Supabase، وجداول النظام جاهزة ومفعلة بكافة الصلاحيات!'
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'error',
      message: `تعذر الاتصال بـ Supabase: ${err?.message || 'خطأ غير معروف'}`
    };
  }
}

// Table verification result interface
export interface TableStatus {
  name: string;
  arabicName: string;
  exists: boolean;
  count: number;
  accessible: boolean;
  error?: string;
}

// Verify all 6 system tables in Supabase
export async function verifyAllTablesInSupabase(client?: SupabaseClient | null): Promise<{
  allReady: boolean;
  tables: Record<string, TableStatus>;
}> {
  const sb = client || getSupabaseClient();
  const tablesInfo: { name: string; arabicName: string }[] = [
    { name: 'rooms', arabicName: 'الغرف الفندقية' },
    { name: 'guests', arabicName: 'النزلاء والوفود' },
    { name: 'service_requests', arabicName: 'طلبات الخدمات' },
    { name: 'pending_requests', arabicName: 'طلبات الحجز المعلقة' },
    { name: 'gate_logs', arabicName: 'سجلات البوابات الأمنية' },
    { name: 'hotel_settings', arabicName: 'إعدادات النظام' },
  ];

  const results: Record<string, TableStatus> = {};
  if (!sb) {
    for (const t of tablesInfo) {
      results[t.name] = {
        name: t.name,
        arabicName: t.arabicName,
        exists: false,
        count: 0,
        accessible: false,
        error: 'Supabase غير مهيأ'
      };
    }
    return { allReady: false, tables: results };
  }

  let allReady = true;

  for (const t of tablesInfo) {
    try {
      const { count, error } = await sb.from(t.name).select('*', { count: 'exact', head: true });
      if (error) {
        allReady = false;
        results[t.name] = {
          name: t.name,
          arabicName: t.arabicName,
          exists: false,
          count: 0,
          accessible: false,
          error: error.message
        };
      } else {
        results[t.name] = {
          name: t.name,
          arabicName: t.arabicName,
          exists: true,
          count: count || 0,
          accessible: true
        };
      }
    } catch (e: any) {
      allReady = false;
      results[t.name] = {
        name: t.name,
        arabicName: t.arabicName,
        exists: false,
        count: 0,
        accessible: false,
        error: e?.message || 'خطأ'
      };
    }
  }

  return { allReady, tables: results };
}

// ========================================================
// Supabase SQL Schema and Permissions Setup Script
// Ready to run in Supabase SQL Editor with full RLS and Realtime
// ========================================================
export const SUPABASE_SQL_SETUP_SCRIPT = `-- ========================================================
-- سكربت إعداد قاعدة بيانات فندق قصر الضيافة الملكي على Supabase
-- تم إعداده خصيصاً مع تصحيح وتفعيل كافة الصلاحيات والأمان (RLS & Grants)
-- قم بنسخ هذا السكربت بالكامل ولصقه في SQL Editor في لوحة تحكم Supabase
-- ========================================================

-- 1. جدول الغرف الفندقية (Rooms Table)
CREATE TABLE IF NOT EXISTS public.rooms (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  floor INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'غرفة مزدوجة فاخرة',
  name TEXT DEFAULT '',
  capacity INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'available',
  features JSONB DEFAULT '[]'::jsonb,
  direction TEXT DEFAULT 'إطلالة بحرية',
  price_per_night INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. جدول النزلاء والوفود (Guests Table)
CREATE TABLE IF NOT EXISTS public.guests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT DEFAULT 'المملكة العربية السعودية',
  mobile TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  room_number TEXT,
  status TEXT NOT NULL DEFAULT 'resident',
  check_in_date TEXT NOT NULL,
  check_out_date TEXT,
  notes TEXT,
  year TEXT NOT NULL DEFAULT '2026',
  visit_type TEXT NOT NULL DEFAULT 'general_1',
  photo_url TEXT,
  photo_raw_url TEXT,
  photo_quality TEXT,
  photo_size_kb INTEGER,
  photo_dimensions TEXT,
  administrative_role TEXT DEFAULT 'عضو وفد',
  qr_code TEXT,
  national_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. جدول طلبات الخدمات والغرف (Service Requests Table)
CREATE TABLE IF NOT EXISTS public.service_requests (
  id TEXT PRIMARY KEY,
  room_number TEXT NOT NULL,
  guest_name TEXT,
  guest_mobile TEXT,
  service_type TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  completed_at TEXT,
  year TEXT DEFAULT '2026',
  visit_type TEXT DEFAULT 'general_1'
);

-- 4. جدول طلبات الحجز والتسجيل الذاتي (Pending Requests Table)
CREATE TABLE IF NOT EXISTS public.pending_requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT DEFAULT 'المملكة العربية السعودية',
  mobile TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  room_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  check_in_date TEXT,
  check_out_date TEXT,
  companions_count INTEGER DEFAULT 0,
  administrative_role TEXT DEFAULT 'عضو وفد',
  notes TEXT,
  photo_url TEXT,
  year TEXT DEFAULT '2026',
  visit_type TEXT DEFAULT 'general_1',
  assigned_room_number TEXT,
  assigned_guest_id TEXT,
  created_at TEXT NOT NULL
);

-- 5. جدول سجلات البوابات وحركات الدخول والخروج (Gate Logs Table)
CREATE TABLE IF NOT EXISTS public.gate_logs (
  id TEXT PRIMARY KEY,
  guest_id TEXT,
  guest_name TEXT NOT NULL,
  room_number TEXT,
  entry_type TEXT NOT NULL DEFAULT 'دخول',
  gate_name TEXT DEFAULT 'البوابة الرئيسية',
  timestamp TEXT NOT NULL,
  officer_name TEXT,
  notes TEXT
);

-- 6. جدول إعدادات وتكوين النظام (Hotel Settings Table)
CREATE TABLE IF NOT EXISTS public.hotel_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ========================================================
-- تفعيل سياسات الأمان وحماية البيانات (Row Level Security - RLS)
-- ========================================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- تصحيح وتفعيل سياسات الصلاحيات الكاملة لجميع العمليات (CRUD)
-- ========================================================
DROP POLICY IF EXISTS "Public access rooms" ON public.rooms;
CREATE POLICY "Public access rooms" ON public.rooms FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access guests" ON public.guests;
CREATE POLICY "Public access guests" ON public.guests FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access service_requests" ON public.service_requests;
CREATE POLICY "Public access service_requests" ON public.service_requests FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access pending_requests" ON public.pending_requests;
CREATE POLICY "Public access pending_requests" ON public.pending_requests FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access gate_logs" ON public.gate_logs;
CREATE POLICY "Public access gate_logs" ON public.gate_logs FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access hotel_settings" ON public.hotel_settings;
CREATE POLICY "Public access hotel_settings" ON public.hotel_settings FOR ALL TO public, anon, authenticated, service_role USING (true) WITH CHECK (true);

-- ========================================================
-- منح صلاحيات قاعدة البيانات المباشرة (GRANTS)
-- ========================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- ========================================================
-- تفعيل البث المباشر (Realtime Replication) لجميع الجداول
-- ========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.gate_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotel_settings;
`;

// ========================================================
// Client Operations & Two-Way Sync Functions
// ========================================================

// Fetch all data from Supabase
export async function fetchHotelDataFromSupabase(): Promise<{
  rooms?: any[];
  guests?: any[];
  serviceRequests?: any[];
  pendingRequests?: any[];
  gateLogs?: any[];
  hotelSettings?: Record<string, any>;
} | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    const [roomsRes, guestsRes, servicesRes, pendingRes, gatesRes, settingsRes] = await Promise.all([
      sb.from('rooms').select('*').order('number', { ascending: true }),
      sb.from('guests').select('*').order('created_at', { ascending: false }),
      sb.from('service_requests').select('*').order('created_at', { ascending: false }),
      sb.from('pending_requests').select('*').order('created_at', { ascending: false }),
      sb.from('gate_logs').select('*').order('timestamp', { ascending: false }),
      sb.from('hotel_settings').select('*')
    ]);

    const result: any = {};

    if (roomsRes.data && Array.isArray(roomsRes.data)) {
      result.rooms = roomsRes.data.map(r => ({
        id: r.id,
        number: r.number,
        floor: r.floor,
        type: r.type,
        name: r.name || '',
        capacity: r.capacity,
        status: r.status,
        features: Array.isArray(r.features) ? r.features : [],
        direction: r.direction || '',
        pricePerNight: r.price_per_night || 0,
        notes: r.notes || '',
      }));
    }

    if (guestsRes.data && Array.isArray(guestsRes.data)) {
      result.guests = guestsRes.data.map(g => ({
        id: g.id,
        name: g.name,
        country: g.country || 'المملكة العربية السعودية',
        mobile: g.mobile,
        email: g.email || '',
        whatsapp: g.whatsapp || '',
        roomNumber: g.room_number || '',
        status: g.status,
        checkInDate: g.check_in_date,
        checkOutDate: g.check_out_date || '',
        notes: g.notes || '',
        year: g.year || '2026',
        visitType: g.visit_type || 'general_1',
        photoUrl: g.photo_url || '',
        photoRawUrl: g.photo_raw_url || '',
        photoQuality: g.photo_quality || '',
        photoSizeKb: g.photo_size_kb || 0,
        photoDimensions: g.photo_dimensions || '',
        administrativeRole: g.administrative_role || 'عضو وفد',
        qrCode: g.qr_code || '',
        nationalId: g.national_id || '',
      }));
    }

    if (servicesRes.data && Array.isArray(servicesRes.data)) {
      result.serviceRequests = servicesRes.data.map(s => ({
        id: s.id,
        roomNumber: s.room_number,
        guestName: s.guest_name || '',
        guestMobile: s.guest_mobile || '',
        serviceType: s.service_type,
        details: s.details || '',
        status: s.status || 'pending',
        createdAt: s.created_at,
        completedAt: s.completed_at || null,
        year: s.year || '2026',
        visitType: s.visit_type || 'general_1',
      }));
    }

    if (pendingRes.data && Array.isArray(pendingRes.data)) {
      result.pendingRequests = pendingRes.data.map(p => ({
        id: p.id,
        name: p.name,
        country: p.country || 'المملكة العربية السعودية',
        mobile: p.mobile,
        email: p.email || '',
        whatsapp: p.whatsapp || '',
        roomType: p.room_type || '',
        status: p.status || 'pending',
        checkInDate: p.check_in_date || '',
        checkOutDate: p.check_out_date || '',
        companionsCount: p.companions_count || 0,
        administrativeRole: p.administrative_role || 'عضو وفد',
        notes: p.notes || '',
        photoUrl: p.photo_url || '',
        year: p.year || '2026',
        visitType: p.visit_type || 'general_1',
        assignedRoomNumber: p.assigned_room_number || '',
        assignedGuestId: p.assigned_guest_id || '',
        date: p.created_at,
      }));
    }

    if (gatesRes.data && Array.isArray(gatesRes.data)) {
      result.gateLogs = gatesRes.data.map(gl => ({
        id: gl.id,
        guestId: gl.guest_id || '',
        guestName: gl.guest_name,
        roomNumber: gl.room_number || '',
        entryType: gl.entry_type || 'دخول',
        action: gl.entry_type === 'خروج' ? 'exit' : 'entry',
        gateName: gl.gate_name || 'البوابة الرئيسية',
        timestamp: gl.timestamp,
        officerName: gl.officer_name || '',
        notes: gl.notes || '',
      }));
    }

    if (settingsRes.data && Array.isArray(settingsRes.data)) {
      const settingsMap: Record<string, any> = {};
      for (const row of settingsRes.data) {
        settingsMap[row.key] = row.value;
      }
      result.hotelSettings = settingsMap;
    }

    return result;
  } catch (err) {
    console.warn('Failed to fetch hotel data from Supabase:', err);
    return null;
  }
}

// Save rooms to Supabase
export async function saveRoomsToSupabase(rooms: any[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !rooms.length) return false;
  try {
    const payload = rooms.map(r => ({
      id: r.id || `room_${r.number}`,
      number: String(r.number),
      floor: Number(r.floor) || 1,
      type: r.type || 'غرفة مزدوجة',
      name: r.name || '',
      capacity: Number(r.capacity) || 2,
      status: r.status || 'available',
      features: Array.isArray(r.features) ? r.features : [],
      direction: r.direction || '',
      price_per_night: Number(r.pricePerNight) || 0,
      notes: r.notes || '',
      updated_at: new Date().toISOString()
    }));
    const { error } = await sb.from('rooms').upsert(payload, { onConflict: 'number' });
    return !error;
  } catch (err) {
    console.warn('saveRoomsToSupabase error:', err);
    return false;
  }
}

// Save guests to Supabase
export async function saveGuestsToSupabase(guests: any[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !guests.length) return false;
  try {
    const payload = guests.map(g => ({
      id: g.id,
      name: g.name,
      country: g.country || 'المملكة العربية السعودية',
      mobile: g.mobile,
      email: g.email || null,
      whatsapp: g.whatsapp || null,
      room_number: g.roomNumber || null,
      status: g.status || 'resident',
      check_in_date: g.checkInDate || new Date().toISOString(),
      check_out_date: g.checkOutDate || null,
      notes: g.notes || null,
      year: g.year || '2026',
      visit_type: g.visitType || 'general_1',
      photo_url: g.photoUrl || null,
      photo_raw_url: g.photoRawUrl || null,
      photo_quality: g.photoQuality || null,
      photo_size_kb: g.photoSizeKb || null,
      photo_dimensions: g.photoDimensions || null,
      administrative_role: g.administrativeRole || 'عضو وفد',
      qr_code: g.qrCode || null,
      national_id: g.nationalId || null,
      updated_at: new Date().toISOString()
    }));
    const { error } = await sb.from('guests').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('saveGuestsToSupabase error:', err);
    return false;
  }
}

// Delete guest from Supabase
export async function deleteGuestFromSupabase(guestId: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !guestId) return false;
  try {
    const { error } = await sb.from('guests').delete().eq('id', guestId);
    return !error;
  } catch {
    return false;
  }
}

// Save service requests to Supabase
export async function saveServiceRequestsToSupabase(requests: any[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !requests.length) return false;
  try {
    const payload = requests.map(s => ({
      id: s.id,
      room_number: s.roomNumber,
      guest_name: s.guestName || '',
      guest_mobile: s.guestMobile || '',
      service_type: s.serviceType,
      details: s.details || '',
      status: s.status || 'pending',
      created_at: s.createdAt || new Date().toISOString(),
      completed_at: s.completedAt || null,
      year: s.year || '2026',
      visit_type: s.visitType || 'general_1'
    }));
    const { error } = await sb.from('service_requests').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('saveServiceRequestsToSupabase error:', err);
    return false;
  }
}

// Save pending requests to Supabase
export async function savePendingRequestsToSupabase(requests: any[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !requests.length) return false;
  try {
    const payload = requests.map(p => ({
      id: p.id,
      name: p.name,
      country: p.country || 'المملكة العربية السعودية',
      mobile: p.mobile,
      email: p.email || null,
      whatsapp: p.whatsapp || null,
      room_type: p.roomType || null,
      status: p.status || 'pending',
      check_in_date: p.checkInDate || null,
      check_out_date: p.checkOutDate || null,
      companions_count: p.companionsCount || 0,
      administrative_role: p.administrativeRole || 'عضو وفد',
      notes: p.notes || null,
      photo_url: p.photoUrl || null,
      year: p.year || '2026',
      visit_type: p.visitType || 'general_1',
      assigned_room_number: p.assignedRoomNumber || null,
      assigned_guest_id: p.assignedGuestId || null,
      created_at: p.date || p.createdAt || new Date().toISOString()
    }));
    const { error } = await sb.from('pending_requests').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('savePendingRequestsToSupabase error:', err);
    return false;
  }
}

// Save single pending request to Supabase
export async function saveSinglePendingRequestToSupabase(req: any): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !req) return false;
  try {
    const payload = {
      id: req.id,
      name: req.name,
      country: req.country || 'المملكة العربية السعودية',
      mobile: req.mobile,
      email: req.email || null,
      whatsapp: req.whatsapp || null,
      room_type: req.roomType || null,
      status: req.status || 'pending',
      check_in_date: req.checkInDate || null,
      check_out_date: req.checkOutDate || null,
      companions_count: req.companionsCount || 0,
      administrative_role: req.administrativeRole || 'عضو وفد',
      notes: req.notes || null,
      photo_url: req.photoUrl || null,
      year: req.year || '2026',
      visit_type: req.visitType || 'general_1',
      assigned_room_number: req.assignedRoomNumber || null,
      assigned_guest_id: req.assignedGuestId || null,
      created_at: req.date || req.createdAt || new Date().toISOString()
    };
    const { error } = await sb.from('pending_requests').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('saveSinglePendingRequestToSupabase error:', err);
    return false;
  }
}

// Delete pending request from Supabase
export async function deletePendingRequestFromSupabase(requestId: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !requestId) return false;
  try {
    const { error } = await sb.from('pending_requests').delete().eq('id', requestId);
    return !error;
  } catch {
    return false;
  }
}

// Save gate logs to Supabase
export async function saveGateLogsToSupabase(logs: any[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !logs.length) return false;
  try {
    const payload = logs.map(gl => ({
      id: gl.id,
      guest_id: gl.guestId || null,
      guest_name: gl.guestName,
      room_number: gl.roomNumber || null,
      entry_type: gl.entryType || 'دخول',
      gate_name: gl.gateName || 'البوابة الرئيسية',
      timestamp: gl.timestamp || new Date().toISOString(),
      officer_name: gl.officerName || '',
      notes: gl.notes || ''
    }));
    const { error } = await sb.from('gate_logs').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('saveGateLogsToSupabase error:', err);
    return false;
  }
}

// Save setting to Supabase
export async function saveSettingToSupabase(key: string, value: any): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !key) return false;
  try {
    const { error } = await sb.from('hotel_settings').upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
    return !error;
  } catch (err) {
    console.warn('saveSettingToSupabase error:', err);
    return false;
  }
}

// Fetch setting from Supabase
export async function fetchSettingFromSupabase(key: string): Promise<any | null> {
  const sb = getSupabaseClient();
  if (!sb || !key) return null;
  try {
    const { data, error } = await sb.from('hotel_settings').select('value').eq('key', key).single();
    if (error || !data) return null;
    return data.value;
  } catch {
    return null;
  }
}

// Full sync of local data to Supabase
export async function syncAllLocalDataToSupabase(data: {
  rooms?: any[];
  guests?: any[];
  serviceRequests?: any[];
  pendingRequests?: any[];
  gateLogs?: any[];
  hotelSettings?: Record<string, any>;
}): Promise<{ success: boolean; message: string; counts: Record<string, number> }> {
  const sb = getSupabaseClient();
  if (!sb) {
    return { success: false, message: 'Supabase غير مهيأ بعد', counts: {} };
  }

  const counts: Record<string, number> = {};

  try {
    if (data.rooms && data.rooms.length > 0) {
      await saveRoomsToSupabase(data.rooms);
      counts.rooms = data.rooms.length;
    }
    if (data.guests && data.guests.length > 0) {
      await saveGuestsToSupabase(data.guests);
      counts.guests = data.guests.length;
    }
    if (data.serviceRequests && data.serviceRequests.length > 0) {
      await saveServiceRequestsToSupabase(data.serviceRequests);
      counts.serviceRequests = data.serviceRequests.length;
    }
    if (data.pendingRequests && data.pendingRequests.length > 0) {
      await savePendingRequestsToSupabase(data.pendingRequests);
      counts.pendingRequests = data.pendingRequests.length;
    }
    if (data.gateLogs && data.gateLogs.length > 0) {
      await saveGateLogsToSupabase(data.gateLogs);
      counts.gateLogs = data.gateLogs.length;
    }
    if (data.hotelSettings) {
      for (const [k, v] of Object.entries(data.hotelSettings)) {
        await saveSettingToSupabase(k, v);
      }
      counts.settings = Object.keys(data.hotelSettings).length;
    }

    return {
      success: true,
      message: 'تم ترحيل ومزامنة كافة الجداول مع قاعدة بيانات Supabase بنجاح تام!',
      counts
    };
  } catch (err: any) {
    return {
      success: false,
      message: `فشلت المزامنة: ${err?.message || 'خطأ غير متوقع'}`,
      counts
    };
  }
}

// Subscribe to Supabase Realtime changes across all tables
export function subscribeToSupabaseRealtime(handlers: {
  onRoomsChange?: () => void;
  onGuestsChange?: () => void;
  onServicesChange?: () => void;
  onPendingChange?: (payload: any) => void;
  onGatesChange?: () => void;
  onSettingsChange?: (key: string, value: any) => void;
}): () => void {
  const sb = getSupabaseClient();
  if (!sb) return () => {};

  try {
    const channel = sb.channel('hotel_realtime_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        handlers.onRoomsChange?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, () => {
        handlers.onGuestsChange?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
        handlers.onServicesChange?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_requests' }, (payload) => {
        handlers.onPendingChange?.(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gate_logs' }, () => {
        handlers.onGatesChange?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotel_settings' }, (payload) => {
        if (payload.new && (payload.new as any).key) {
          handlers.onSettingsChange?.((payload.new as any).key, (payload.new as any).value);
        }
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}
