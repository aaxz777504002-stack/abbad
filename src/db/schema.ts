import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Users table (Firebase Auth linkage)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  role: text('role').default('admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Hotel Rooms table (الغرف الفندقية)
export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  number: text('number').notNull().unique(),
  floor: integer('floor').notNull().default(1),
  type: text('type').notNull().default('غرفة مزدوجة'),
  name: text('name').default(''),
  capacity: integer('capacity').notNull().default(2),
  status: text('status').notNull().default('available'), // available, occupied, maintenance, cleaning
  features: jsonb('features').default([]),
  direction: text('direction').default(''),
  pricePerNight: integer('price_per_night').default(0),
  notes: text('notes').default(''),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Hotel Guests table (النزلاء)
export const guests = pgTable('guests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  country: text('country').default('المملكة العربية السعودية'),
  mobile: text('mobile').notNull(),
  email: text('email'),
  whatsapp: text('whatsapp'),
  roomNumber: text('room_number'),
  status: text('status').notNull().default('resident'), // resident, checked_out
  checkInDate: text('check_in_date').notNull(),
  checkOutDate: text('check_out_date'),
  notes: text('notes'),
  year: text('year').notNull().default('2026'),
  visitType: text('visit_type').notNull().default('general_1'), // general_1, general_2, private
  photoUrl: text('photo_url'),
  photoRawUrl: text('photo_raw_url'),
  photoQuality: text('photo_quality'),
  photoSizeKb: integer('photo_size_kb'),
  photoDimensions: text('photo_dimensions'),
  administrativeRole: text('administrative_role').default('عضو وفد'),
  qrCode: text('qr_code'),
  nationalId: text('national_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Service Requests table (طلبات الخدمات والغرف)
export const serviceRequests = pgTable('service_requests', {
  id: text('id').primaryKey(),
  roomNumber: text('room_number').notNull(),
  guestName: text('guest_name'),
  guestMobile: text('guest_mobile'),
  serviceType: text('service_type').notNull(),
  details: text('details'),
  status: text('status').notNull().default('pending'), // pending, in_progress, completed, cancelled
  createdAt: text('created_at').notNull(),
  completedAt: text('completed_at'),
  year: text('year').default('2026'),
  visitType: text('visit_type').default('general_1'),
});

// Pending Registration Requests (طلبات الحجز والتسجيل الذاتي)
export const pendingRequests = pgTable('pending_requests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  country: text('country').default('المملكة العربية السعودية'),
  mobile: text('mobile').notNull(),
  email: text('email'),
  whatsapp: text('whatsapp'),
  roomType: text('room_type'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected
  checkInDate: text('check_in_date'),
  checkOutDate: text('check_out_date'),
  companionsCount: integer('companions_count').default(0),
  administrativeRole: text('administrative_role').default('عضو وفد'),
  notes: text('notes'),
  year: text('year').default('2026'),
  visitType: text('visit_type').default('general_1'),
  createdAt: text('created_at').notNull(),
});

// Gate Entry/Exit Logs (سجلات بوابات الدخول والخروج)
export const gateLogs = pgTable('gate_logs', {
  id: text('id').primaryKey(),
  guestId: text('guest_id'),
  guestName: text('guest_name').notNull(),
  roomNumber: text('room_number'),
  entryType: text('entry_type').notNull().default('دخول'), // دخول, خروج
  gateName: text('gate_name').default('البوابة الرئيسية'),
  timestamp: text('timestamp').notNull(),
  officerName: text('officer_name'),
  notes: text('notes'),
});

// Hotel System Configuration & Settings (إعدادات وتكوينات النظام)
export const hotelSettings = pgTable('hotel_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, () => ({}));
export const roomsRelations = relations(rooms, ({ many }) => ({
  guests: many(guests),
}));
export const guestsRelations = relations(guests, ({ one }) => ({
  room: one(rooms, {
    fields: [guests.roomNumber],
    references: [rooms.number],
  }),
}));
