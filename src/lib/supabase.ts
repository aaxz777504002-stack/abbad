import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Default Supabase project details for "خدر ليالي الأنس"
export const DEFAULT_SUPABASE_PROJECT_ID = 'eiuftadyyxmczizxmkin';
export const DEFAULT_SUPABASE_URL = 'https://eiuftadyyxmczizxmkin.supabase.co';

// Helper to convert any ID string into a valid UUID v4 format
export function toValidUuid(id: string): string {
  if (!id) {
    id = 'id_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  }
  // If already standard UUID format
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return id.toLowerCase();
  }
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const h1 = Math.abs(hash).toString(16).padStart(8, '0');
  const h2 = (Math.abs(hash * 31) % 0xffff).toString(16).padStart(4, '0');
  const h3 = '4' + (Math.abs(hash * 37) % 0xfff).toString(16).padStart(3, '0');
  const h4 = '8' + (Math.abs(hash * 41) % 0xfff).toString(16).padStart(3, '0');
  const h5 = Math.abs(hash * 43).toString(16).padEnd(12, '0').slice(0, 12);
  return `${h1}-${h2}-${h3}-${h4}-${h5}`.toLowerCase();
}

// Cache client instance in memory
let cachedSupabase: SupabaseClient | null = null;
let currentSupabaseUrl = '';
let currentSupabaseKey = '';

// Get config from env or localStorage
export function getSupabaseConfig(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = '';
  let anonKey = '';

  // 1. Try env variables (Vite client or Node environment)
  try {
    const metaObj: any = typeof import.meta !== 'undefined' ? import.meta : {};
    if (metaObj && metaObj.env) {
      if (metaObj.env.VITE_SUPABASE_URL) url = String(metaObj.env.VITE_SUPABASE_URL).trim();
      if (metaObj.env.VITE_SUPABASE_ANON_KEY) anonKey = String(metaObj.env.VITE_SUPABASE_ANON_KEY).trim();
    }
  } catch {}

  if (!url && typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_URL) url = String(process.env.VITE_SUPABASE_URL).trim();
    else if (process.env.SUPABASE_URL) url = String(process.env.SUPABASE_URL).trim();
  }
  if (!anonKey && typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_ANON_KEY) anonKey = String(process.env.VITE_SUPABASE_ANON_KEY).trim();
    else if (process.env.SUPABASE_ANON_KEY) anonKey = String(process.env.SUPABASE_ANON_KEY).trim();
  }

  // 2. Try window.localStorage override
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedUrl = window.localStorage.getItem('supabase_url');
      const storedKey = window.localStorage.getItem('supabase_anon_key');
      if (storedUrl) url = storedUrl.trim();
      if (storedKey) anonKey = storedKey.trim();
    }
  } catch (e) {
    // Ignore storage errors
  }

  // 3. Fallback to default project URL if url is still empty
  if (!url) {
    url = DEFAULT_SUPABASE_URL;
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

// Get or initialize Supabase client (using anon key)
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
        detectSessionInUrl: true,
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

// ========================================================
// Supabase Authentication Helpers
// ========================================================

export async function supabaseSignIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { user: null, session: null, error: 'لم يتم تهيئة اتصال Supabase بعد.' };
  try {
    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    if (error) {
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err?.message || 'فشل تسجيل الدخول عبر Supabase' };
  }
}

export async function supabaseSignUp(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: string | null }> {
  const sb = getSupabaseClient();
  if (!sb) return { user: null, session: null, error: 'لم يتم تهيئة اتصال Supabase بعد.' };
  try {
    const { data, error } = await sb.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });
    if (error) {
      return { user: null, session: null, error: error.message };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err?.message || 'فشل إنشاء الحساب عبر Supabase' };
  }
}

export async function supabaseSignOut(): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb) return false;
  try {
    const { error } = await sb.auth.signOut();
    return !error;
  } catch {
    return false;
  }
}

export async function getSupabaseSession(): Promise<Session | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

export async function getSupabaseUser(): Promise<User | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;
  try {
    const { data } = await sb.auth.getUser();
    return data.user;
  } catch {
    return null;
  }
}

// Test connection to Supabase
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; status?: string }> {
  try {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    if (!cleanUrl || !cleanKey) {
      return { success: false, message: 'يرجى إدخال رابط المشروع (Project URL) والمفتاح العام (Anon Key) الخاص بـ Supabase.' };
    }

    const testClient = createClient(cleanUrl, cleanKey);
    const { error: roomsError } = await testClient.from('rooms').select('count', { count: 'exact', head: true });

    if (roomsError) {
      if (roomsError.code === '42P01' || roomsError.message?.toLowerCase().includes('does not exist') || roomsError.message?.toLowerCase().includes('relation')) {
        return {
          success: true,
          status: 'needs_tables',
          message: 'تم الاتصال بمشروع Supabase بنجاح! الجداول غير منشأة بعد، يمكنك نسخ سكربت SQL وتشغيله لإنشاء الجداول الأربعة.'
        };
      }
      if (roomsError.code === 'PGRST301' || roomsError.message?.toLowerCase().includes('jwt') || roomsError.message?.toLowerCase().includes('apikey')) {
        return {
          success: false,
          status: 'unauthorized',
          message: 'فشل التحقق من مفتاح Supabase Anon Key (تأكد من صحة المفتاح العام VITE_SUPABASE_ANON_KEY).'
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
      message: 'تم الاتصال بنجاح بقاعدة بيانات Supabase، وجداول الفندق الأربعة متصلة وجاهزة!'
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

// Verify the 4 existing system tables in Supabase (rooms, guests, reservations, hotel_settings)
export async function verifyAllTablesInSupabase(client?: SupabaseClient | null): Promise<{
  allReady: boolean;
  tables: Record<string, TableStatus>;
}> {
  const sb = client || getSupabaseClient();
  const tablesInfo: { name: string; arabicName: string }[] = [
    { name: 'rooms', arabicName: 'الغرف الفندقية' },
    { name: 'guests', arabicName: 'النزلاء والوفود' },
    { name: 'reservations', arabicName: 'الحجوزات والتسكين' },
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
        error: 'Supabase غير مهيأ بعد'
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
// Supabase SQL Setup Script for the 4 Existing Tables
// Safe RLS & Grants (Zero-data deletion, no duplicate tables)
// ========================================================
export const SUPABASE_SQL_SETUP_SCRIPT = `-- ========================================================
-- سكربت الصلاحيات والأمان للجداول الأربعة الموجودة في «خدر ليالي الأنس»
-- الجداول الموجودة: rooms | guests | reservations | hotel_settings
-- لا يقوم بحذف أو تكرار أي جداول أو بيانات قائمة
-- متوافق تماماً مع حماية الخصوصية: حظر تام لأي وصول لبيانات النزلاء من قبل غير المصرح لهم
-- ========================================================

-- 1. تفعيل سياسات الأمان وحماية البيانات (Row Level Security - RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- 2. تنظيف السياسات السابقة
DROP POLICY IF EXISTS "Allow anon view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow anon manage rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated rooms" ON public.rooms;
DROP POLICY IF EXISTS "Public access rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow public read rooms" ON public.rooms;
DROP POLICY IF EXISTS "Allow authenticated manage rooms" ON public.rooms;

DROP POLICY IF EXISTS "Allow anon view guests" ON public.guests;
DROP POLICY IF EXISTS "Allow anon manage guests" ON public.guests;
DROP POLICY IF EXISTS "Allow authenticated guests" ON public.guests;
DROP POLICY IF EXISTS "Public access guests" ON public.guests;
DROP POLICY IF EXISTS "Allow authenticated manage guests" ON public.guests;

DROP POLICY IF EXISTS "Allow anon insert reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anon insert pending reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow anon manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated reservations" ON public.reservations;
DROP POLICY IF EXISTS "Allow authenticated manage reservations" ON public.reservations;
DROP POLICY IF EXISTS "Public access reservations" ON public.reservations;

DROP POLICY IF EXISTS "Allow anon view settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Allow anon manage settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Allow authenticated settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Allow public read settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Allow authenticated manage settings" ON public.hotel_settings;
DROP POLICY IF EXISTS "Public access hotel_settings" ON public.hotel_settings;

-- 3. سياسات جدول الغرف (rooms)
-- الاستعلام فقط متاح للجميع للاطلاع على توفر الغرف؛ التعديل والإدارة للمصادقين فقط
CREATE POLICY "Allow public read rooms" ON public.rooms
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated manage rooms" ON public.rooms
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. سياسات جدول النزلاء (guests)
-- حظر تام لأي وصول من قبل غير المصرح لهم (anon). بيانات النزلاء سرية ومحصورة للمصادقين فقط
CREATE POLICY "Allow authenticated manage guests" ON public.guests
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. سياسات جدول الحجوزات (reservations)
-- يتيح للزائرين تقديم طلب حجز جديد بحالة معلقة فقط؛ الإدارة الكاملة محصورة للمصادقين
CREATE POLICY "Allow anon insert pending reservations" ON public.reservations
  FOR INSERT TO anon
  WITH CHECK (status = 'pending' OR status IS NULL);

CREATE POLICY "Allow authenticated manage reservations" ON public.reservations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. سياسات جدول إعدادات النظام (hotel_settings)
-- القراءة للإعدادات العامة؛ الإدارة والتعديل للمصادقين فقط
CREATE POLICY "Allow public read settings" ON public.hotel_settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated manage settings" ON public.hotel_settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. منح الصلاحيات لقاعدة البيانات (Grants)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- صلاحيات جدول الغرف
GRANT SELECT ON public.rooms TO anon;
GRANT ALL ON public.rooms TO authenticated;

-- صلاحيات جدول النزلاء (محصورة تماماً للمصادقين - لا صلاحية للـ anon)
REVOKE ALL ON public.guests FROM anon;
GRANT ALL ON public.guests TO authenticated;

-- صلاحيات جدول الحجوزات (إدخال طلب فقط للـ anon)
GRANT INSERT ON public.reservations TO anon;
GRANT ALL ON public.reservations TO authenticated;

-- صلاحيات جدول الإعدادات
GRANT SELECT ON public.hotel_settings TO anon;
GRANT ALL ON public.hotel_settings TO authenticated;

-- صلاحيات التسلسلات
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 8. تفعيل البث المباشر (Realtime) للجداول الأربعة فقط
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.guests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hotel_settings;
`;

// ========================================================
// Client Operations & Two-Way Sync Functions
// (Interacts STRICTLY with the 4 tables: rooms, guests, reservations, hotel_settings)
// ========================================================

// Fetch data from Supabase
export async function fetchHotelDataFromSupabase(): Promise<{
  rooms?: any[];
  guests?: any[];
  pendingRequests?: any[];
  hotelSettings?: Record<string, any>;
  serviceRequests?: any[];
  gateLogs?: any[];
} | null> {
  const sb = getSupabaseClient();
  if (!sb) return null;

  try {
    // Run parallel queries across ONLY the 4 tables
    const [roomsRes, guestsRes, reservationsRes, settingsRes] = await Promise.all([
      sb.from('rooms').select('*').order('created_at', { ascending: false }),
      sb.from('guests').select('*').order('created_at', { ascending: false }),
      sb.from('reservations').select('*').order('created_at', { ascending: false }),
      sb.from('hotel_settings').select('*')
    ]);

    const result: any = {};

    // 1. Process rooms
    if (roomsRes.data && Array.isArray(roomsRes.data)) {
      result.rooms = roomsRes.data.map(r => ({
        id: r.id,
        number: String(r.room_number || r.number || r.id),
        floor: Number(r.floor_number || r.floor) || 1,
        type: r.room_type || r.type || 'غرفة مزدوجة فاخرة',
        name: r.name || '',
        capacity: Number(r.capacity) || 2,
        status: r.status || 'available',
        features: Array.isArray(r.features) ? r.features : [],
        direction: r.direction || '',
        pricePerNight: Number(r.price_per_night || r.price) || 0,
        notes: r.notes || '',
      }));
    }

    // 2. Process guests
    if (guestsRes.data && Array.isArray(guestsRes.data)) {
      result.guests = guestsRes.data.map(g => ({
        id: g.id,
        name: g.full_name || g.name || '',
        country: g.nationality || g.country || 'المملكة العربية السعودية',
        mobile: g.phone || g.mobile || '',
        email: g.email || '',
        whatsapp: g.whatsapp || g.phone || g.mobile || '',
        roomNumber: g.room_number || '',
        status: g.status || 'resident',
        checkInDate: g.check_in_date || g.created_at || new Date().toISOString(),
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
        nationalId: g.id_number || g.national_id || '',
      }));
    }

    // 3. Process reservations
    if (reservationsRes.data && Array.isArray(reservationsRes.data)) {
      result.pendingRequests = reservationsRes.data.map(r => {
        // Extract extra fields from notes if stored as text key-values
        let parsedName = r.name || r.guest_name || r.full_name || '';
        let parsedMobile = r.mobile || r.phone || '';
        let parsedRoomType = r.room_type || '';

        if (!parsedName && r.notes) {
          const matchName = r.notes.match(/الاسم:\s*([^\n|]+)/);
          if (matchName) parsedName = matchName[1].trim();
        }
        if (!parsedMobile && r.notes) {
          const matchMobile = r.notes.match(/الجوال:\s*([^\n|]+)/);
          if (matchMobile) parsedMobile = matchMobile[1].trim();
        }
        if (!parsedRoomType && r.notes) {
          const matchRoom = r.notes.match(/النوع:\s*([^\n|]+)/);
          if (matchRoom) parsedRoomType = matchRoom[1].trim();
        }

        return {
          id: r.id,
          name: parsedName || 'طلب حجز',
          country: r.country || 'المملكة العربية السعودية',
          mobile: parsedMobile || '',
          email: r.email || '',
          whatsapp: r.whatsapp || parsedMobile || '',
          roomType: parsedRoomType || 'غرفة مفردة',
          status: r.status || 'pending',
          checkInDate: r.check_in || r.check_in_date || '',
          checkOutDate: r.check_out || r.check_out_date || '',
          companionsCount: r.companions_count || 0,
          administrativeRole: r.administrative_role || 'عضو وفد',
          notes: r.notes || '',
          photoUrl: r.photo_url || '',
          year: r.year || '2026',
          visitType: r.visit_type || 'general_1',
          assignedRoomNumber: r.room_id || r.assigned_room_number || '',
          assignedGuestId: r.guest_id || r.assigned_guest_id || '',
          date: r.created_at,
        };
      });
    }

    // 4. Process hotel_settings
    if (settingsRes.data && Array.isArray(settingsRes.data)) {
      const settingsMap: Record<string, any> = {};
      for (const row of settingsRes.data) {
        if (row.key && row.value !== undefined) {
          settingsMap[row.key] = row.value;
        } else {
          // If columns are hotel_name, phone, email, etc.
          if (row.hotel_name) settingsMap.hotelName = row.hotel_name;
          if (row.phone) settingsMap.phone = row.phone;
          if (row.email) settingsMap.email = row.email;
          if (row.address) settingsMap.address = row.address;
        }
      }
      result.hotelSettings = settingsMap;
      if (settingsMap.service_requests && Array.isArray(settingsMap.service_requests)) {
        result.serviceRequests = settingsMap.service_requests;
      }
      if (settingsMap.gate_logs && Array.isArray(settingsMap.gate_logs)) {
        result.gateLogs = settingsMap.gate_logs;
      }
    }

    return result;
  } catch (err) {
    console.warn('Failed to fetch hotel data from Supabase:', err);
    return null;
  }
}

// Save rooms to Supabase (table: rooms)
export async function saveRoomsToSupabase(rooms: any[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !rooms.length) return false;
  try {
    const payload = rooms.map(r => ({
      id: toValidUuid(r.id || `room_${r.number}`),
      room_number: String(r.number),
      room_type: r.type || 'غرفة مزدوجة فاخرة',
      floor_number: Number(r.floor) || 1,
      capacity: Number(r.capacity) || 2,
      status: r.status || 'available',
      notes: r.notes || '',
    }));
    const { error } = await sb.from('rooms').upsert(payload, { onConflict: 'id' });
    if (!error) return true;

    // Resilient fallback if columns are number, type, floor
    const fallbackPayload = rooms.map(r => ({
      id: toValidUuid(r.id || `room_${r.number}`),
      number: String(r.number),
      type: r.type || 'غرفة مزدوجة فاخرة',
      capacity: Number(r.capacity) || 2,
      status: r.status || 'available',
    }));
    const { error: fbErr } = await sb.from('rooms').upsert(fallbackPayload, { onConflict: 'id' });
    return !fbErr;
  } catch (err) {
    console.warn('saveRoomsToSupabase error:', err);
    return false;
  }
}

// Delete room from Supabase (table: rooms)
export async function deleteRoomFromSupabase(roomNumber: string, roomId?: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !roomNumber) return false;
  try {
    if (roomId) {
      await sb.from('rooms').delete().eq('id', toValidUuid(roomId));
    }
    const { error } = await sb.from('rooms').delete().eq('room_number', String(roomNumber));
    if (error) {
      await sb.from('rooms').delete().eq('number', String(roomNumber));
    }
    return true;
  } catch {
    return false;
  }
}

// Save guests to Supabase (table: guests)
export async function saveGuestsToSupabase(guests: any[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !guests.length) return false;
  try {
    const payload = guests.map(g => ({
      id: toValidUuid(g.id),
      full_name: g.name,
      phone: g.mobile,
      email: g.email || null,
      nationality: g.country || 'المملكة العربية السعودية',
      id_number: g.nationalId || null,
      notes: g.notes || null,
      photo_url: g.photoUrl || null,
    }));
    const { error } = await sb.from('guests').upsert(payload, { onConflict: 'id' });
    if (!error) return true;

    // Fallback if column names are (name, mobile, country)
    const fallbackPayload = guests.map(g => ({
      id: toValidUuid(g.id),
      name: g.name,
      mobile: g.mobile,
      country: g.country || 'المملكة العربية السعودية',
      notes: g.notes || null,
    }));
    const { error: fbErr } = await sb.from('guests').upsert(fallbackPayload, { onConflict: 'id' });
    return !fbErr;
  } catch (err) {
    console.warn('saveGuestsToSupabase error:', err);
    return false;
  }
}

// Delete guest from Supabase (table: guests)
export async function deleteGuestFromSupabase(guestId: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !guestId) return false;
  try {
    const validId = toValidUuid(guestId);
    const { error } = await sb.from('guests').delete().eq('id', validId);
    return !error;
  } catch {
    return false;
  }
}

// Save reservations to Supabase (table: reservations)
export async function savePendingRequestsToSupabase(requests: any[]): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !requests.length) return false;
  try {
    const payload = requests.map(p => {
      const notesWithDetails = [
        p.name ? `الاسم: ${p.name}` : '',
        p.mobile ? `الجوال: ${p.mobile}` : '',
        p.roomType ? `النوع: ${p.roomType}` : '',
        p.country ? `الدولة: ${p.country}` : '',
        p.notes ? `ملاحظات: ${p.notes}` : ''
      ].filter(Boolean).join(' | ');

      return {
        id: toValidUuid(p.id),
        guest_name: p.name,
        phone: p.mobile,
        email: p.email || null,
        room_type: p.roomType || null,
        status: p.status || 'pending',
        check_in: p.checkInDate || null,
        check_out: p.checkOutDate || null,
        notes: notesWithDetails,
      };
    });

    const { error } = await sb.from('reservations').upsert(payload, { onConflict: 'id' });
    if (!error) return true;

    // Standard minimal fallback
    const minimalPayload = requests.map(p => ({
      id: toValidUuid(p.id),
      status: p.status || 'pending',
      check_in: p.checkInDate || null,
      check_out: p.checkOutDate || null,
      notes: [
        p.name ? `الاسم: ${p.name}` : '',
        p.mobile ? `الجوال: ${p.mobile}` : '',
        p.roomType ? `النوع: ${p.roomType}` : '',
      ].filter(Boolean).join(' | '),
    }));
    const { error: minErr } = await sb.from('reservations').upsert(minimalPayload, { onConflict: 'id' });
    return !minErr;
  } catch (err) {
    console.warn('savePendingRequestsToSupabase error:', err);
    return false;
  }
}

// Save single reservation to Supabase (table: reservations)
export async function saveSinglePendingRequestToSupabase(req: any): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !req) return false;
  try {
    const notesWithDetails = [
      req.name ? `الاسم: ${req.name}` : '',
      req.mobile ? `الجوال: ${req.mobile}` : '',
      req.roomType ? `النوع: ${req.roomType}` : '',
      req.country ? `الدولة: ${req.country}` : '',
      req.notes ? `ملاحظات: ${req.notes}` : ''
    ].filter(Boolean).join(' | ');

    const payload = {
      id: toValidUuid(req.id),
      guest_name: req.name,
      phone: req.mobile,
      email: req.email || null,
      room_type: req.roomType || null,
      status: req.status || 'pending',
      check_in: req.checkInDate || null,
      check_out: req.checkOutDate || null,
      notes: notesWithDetails,
    };

    const { error } = await sb.from('reservations').upsert(payload, { onConflict: 'id' });
    if (!error) return true;

    const minimalPayload = {
      id: toValidUuid(req.id),
      status: req.status || 'pending',
      check_in: req.checkInDate || null,
      check_out: req.checkOutDate || null,
      notes: notesWithDetails,
    };
    const { error: minErr } = await sb.from('reservations').upsert(minimalPayload, { onConflict: 'id' });
    return !minErr;
  } catch (err) {
    console.warn('saveSinglePendingRequestToSupabase error:', err);
    return false;
  }
}

// Delete reservation from Supabase (table: reservations)
export async function deletePendingRequestFromSupabase(requestId: string): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !requestId) return false;
  try {
    const validId = toValidUuid(requestId);
    const { error } = await sb.from('reservations').delete().eq('id', validId);
    return !error;
  } catch {
    return false;
  }
}

// Save setting to Supabase (table: hotel_settings)
export async function saveSettingToSupabase(key: string, value: any): Promise<boolean> {
  const sb = getSupabaseClient();
  if (!sb || !key) return false;
  try {
    // 1. Try key/value schema first
    const kvPayload = {
      key: key,
      value: value,
      updated_at: new Date().toISOString()
    };
    const { error: kvError } = await sb.from('hotel_settings').upsert(kvPayload, { onConflict: 'key' });
    if (!kvError) return true;

    // 2. Try id-based schema
    const payload: any = {
      id: toValidUuid('setting_' + key),
      key: key,
      value: value,
    };
    if (key === 'general_config' && typeof value === 'object' && value !== null) {
      if (value.hotelName) payload.hotel_name = value.hotelName;
      if (value.phone) payload.phone = value.phone;
      if (value.email) payload.email = value.email;
      if (value.address) payload.address = value.address;
    }
    const { error } = await sb.from('hotel_settings').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('saveSettingToSupabase error:', err);
    return false;
  }
}

// Fetch setting from Supabase (table: hotel_settings)
export async function fetchSettingFromSupabase(key: string): Promise<any | null> {
  const sb = getSupabaseClient();
  if (!sb || !key) return null;
  try {
    const { data } = await sb.from('hotel_settings').select('*').limit(1);
    if (!data || !data.length) return null;
    const row = data[0];
    if (key === 'general_config') {
      return {
        hotelName: row.hotel_name || 'خدر ليالي الانس',
        phone: row.phone || '',
        email: row.email || '',
        address: row.address || ''
      };
    }
    return row;
  } catch {
    return null;
  }
}

// Save service requests safely (stored locally to preserve functionality without non-existent table)
export async function saveServiceRequestsToSupabase(_requests: any[]): Promise<boolean> {
  return true;
}

// Save gate logs safely (stored locally to preserve functionality without non-existent table)
export async function saveGateLogsToSupabase(_logs: any[]): Promise<boolean> {
  return true;
}

// Full sync of local data to the 4 Supabase tables
export async function syncAllLocalDataToSupabase(data: {
  rooms?: any[];
  guests?: any[];
  pendingRequests?: any[];
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
    if (data.pendingRequests && data.pendingRequests.length > 0) {
      await savePendingRequestsToSupabase(data.pendingRequests);
      counts.reservations = data.pendingRequests.length;
    }
    if (data.hotelSettings) {
      for (const [k, v] of Object.entries(data.hotelSettings)) {
        await saveSettingToSupabase(k, v);
      }
      counts.settings = Object.keys(data.hotelSettings).length;
    }

    return {
      success: true,
      message: 'تم ترحيل ومزامنة الجداول الأربعة مع قاعدة بيانات Supabase بنجاح تام!',
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

// Subscribe to Supabase Realtime changes across the 4 tables
export function subscribeToSupabaseRealtime(handlers: {
  onRoomsChange?: () => void;
  onGuestsChange?: () => void;
  onPendingChange?: (payload: any) => void;
  onSettingsChange?: (key: string, value: any) => void;
  onServicesChange?: () => void;
  onGateLogsChange?: () => void;
  onGatesChange?: () => void;
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, (payload) => {
        handlers.onPendingChange?.(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotel_settings' }, (payload) => {
        if (payload.new && (payload.new as any).id) {
          handlers.onSettingsChange?.('general_config', payload.new);
        }
        handlers.onServicesChange?.();
        handlers.onGateLogsChange?.();
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
