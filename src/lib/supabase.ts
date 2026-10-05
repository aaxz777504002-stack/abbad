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
      }
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
export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; tablesFound?: string[] }> {
  try {
    const cleanUrl = url.trim();
    const cleanKey = key.trim();
    if (!cleanUrl || !cleanKey) {
      return { success: false, message: 'يرجى إدخال رابط المشروع (Project URL) والمفتاح (API Key) الخاص بـ Supabase.' };
    }

    const testClient = createClient(cleanUrl, cleanKey);
    // Try to query rooms or health
    const { error: roomsError } = await testClient.from('rooms').select('count', { count: 'exact', head: true });

    if (roomsError) {
      // If table doesn't exist yet, it's still a valid connection to Supabase!
      if (roomsError.code === '42P01' || roomsError.message?.toLowerCase().includes('does not exist') || roomsError.message?.toLowerCase().includes('relation')) {
        return {
          success: true,
          message: 'تم الاتصال بمشروع Supabase بنجاح! الجداول غير منشأة بعد، يمكنك نسخ سكربت SQL وتشغيله لإنشاء الجداول فوراً.'
        };
      }
      // If unauthorized
      if (roomsError.code === 'PGRST301' || roomsError.message?.toLowerCase().includes('jwt') || roomsError.message?.toLowerCase().includes('apikey')) {
        return {
          success: false,
          message: 'فشل التحقق من مفتاح Supabase API Key (تأكد من صحة Anon Key أو Service Role Key).'
        };
      }
      return {
        success: false,
        message: `خطأ في الاتصال بـ Supabase: ${roomsError.message}`
      };
    }

    return {
      success: true,
      message: 'تم الاتصال بنجاح بقاعدة بيانات Supabase، والجداول جاهزة ومتاحة!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `تعذر الاتصال بـ Supabase: ${err?.message || 'خطأ غير معروف'}`
    };
  }
}

// Supabase SQL Schema generator script (ready to run in Supabase SQL editor)
export const SUPABASE_SQL_SETUP_SCRIPT = `-- ========================================================
-- سكربت إعداد قاعدة بيانات فندق قصر الضيافة الملكي على Supabase
-- تم إعداده خصيصاً للتوافق الكامل مع النظام (PostgreSQL / Supabase)
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
  year TEXT DEFAULT '2026',
  visit_type TEXT DEFAULT 'general_1',
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

-- تفعيل سياسات الأمان والحماية (Row Level Security - RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_settings ENABLE ROW LEVEL SECURITY;

-- السماح بالقراءة والتحديث لجميع الجداول
DROP POLICY IF EXISTS "Public access rooms" ON public.rooms;
CREATE POLICY "Public access rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access guests" ON public.guests;
CREATE POLICY "Public access guests" ON public.guests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access service_requests" ON public.service_requests;
CREATE POLICY "Public access service_requests" ON public.service_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access pending_requests" ON public.pending_requests;
CREATE POLICY "Public access pending_requests" ON public.pending_requests FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access gate_logs" ON public.gate_logs;
CREATE POLICY "Public access gate_logs" ON public.gate_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access hotel_settings" ON public.hotel_settings;
CREATE POLICY "Public access hotel_settings" ON public.hotel_settings FOR ALL USING (true) WITH CHECK (true);
`;
