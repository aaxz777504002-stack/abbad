import { db } from './index.ts';
import { rooms, guests, serviceRequests, pendingRequests, gateLogs, hotelSettings } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

// ROOMS OPERATIONS
export async function getAllRooms() {
  try {
    return await db.select().from(rooms);
  } catch (error) {
    console.error("Database query failed in getAllRooms:", error);
    throw new Error("Failed to fetch hotel rooms.", { cause: error });
  }
}

export async function upsertRooms(roomList: any[]) {
  try {
    if (!roomList || roomList.length === 0) return [];
    const results = [];
    for (const r of roomList) {
      const inserted = await db.insert(rooms)
        .values({
          id: r.id || `room_${r.number}`,
          number: String(r.number),
          floor: Number(r.floor) || 1,
          type: r.type || 'غرفة مزدوجة',
          name: r.name || '',
          capacity: Number(r.capacity) || 2,
          status: r.status || 'available',
          features: r.features || [],
          direction: r.direction || '',
          pricePerNight: Number(r.pricePerNight) || 0,
          notes: r.notes || '',
        })
        .onConflictDoUpdate({
          target: rooms.number,
          set: {
            floor: Number(r.floor) || 1,
            type: r.type || 'غرفة مزدوجة',
            name: r.name || '',
            capacity: Number(r.capacity) || 2,
            status: r.status || 'available',
            features: r.features || [],
            direction: r.direction || '',
            pricePerNight: Number(r.pricePerNight) || 0,
            notes: r.notes || '',
          },
        })
        .returning();
      results.push(inserted[0]);
    }
    return results;
  } catch (error) {
    console.error("Database query failed in upsertRooms:", error);
    throw new Error("Failed to upsert hotel rooms.", { cause: error });
  }
}

// GUESTS OPERATIONS
export async function getAllGuests() {
  try {
    return await db.select().from(guests).orderBy(desc(guests.createdAt));
  } catch (error) {
    console.error("Database query failed in getAllGuests:", error);
    throw new Error("Failed to fetch hotel guests.", { cause: error });
  }
}

export async function upsertGuest(guestData: any) {
  try {
    const result = await db.insert(guests)
      .values({
        id: guestData.id,
        name: guestData.name,
        country: guestData.country || 'المملكة العربية السعودية',
        mobile: guestData.mobile,
        email: guestData.email || null,
        whatsapp: guestData.whatsapp || null,
        roomNumber: guestData.roomNumber || null,
        status: guestData.status || 'resident',
        checkInDate: guestData.checkInDate || new Date().toISOString(),
        checkOutDate: guestData.checkOutDate || null,
        notes: guestData.notes || null,
        year: guestData.year || '2026',
        visitType: guestData.visitType || 'general_1',
        photoUrl: guestData.photoUrl || null,
        photoRawUrl: guestData.photoRawUrl || null,
        photoQuality: guestData.photoQuality || null,
        photoSizeKb: guestData.photoSizeKb || null,
        photoDimensions: guestData.photoDimensions || null,
        administrativeRole: guestData.administrativeRole || 'عضو وفد',
        qrCode: guestData.qrCode || null,
        nationalId: guestData.nationalId || null,
      })
      .onConflictDoUpdate({
        target: guests.id,
        set: {
          name: guestData.name,
          country: guestData.country || 'المملكة العربية السعودية',
          mobile: guestData.mobile,
          email: guestData.email || null,
          whatsapp: guestData.whatsapp || null,
          roomNumber: guestData.roomNumber || null,
          status: guestData.status || 'resident',
          checkInDate: guestData.checkInDate || new Date().toISOString(),
          checkOutDate: guestData.checkOutDate || null,
          notes: guestData.notes || null,
          year: guestData.year || '2026',
          visitType: guestData.visitType || 'general_1',
          photoUrl: guestData.photoUrl || null,
          photoRawUrl: guestData.photoRawUrl || null,
          photoQuality: guestData.photoQuality || null,
          photoSizeKb: guestData.photoSizeKb || null,
          photoDimensions: guestData.photoDimensions || null,
          administrativeRole: guestData.administrativeRole || 'عضو وفد',
          qrCode: guestData.qrCode || null,
          nationalId: guestData.nationalId || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query failed in upsertGuest:", error);
    throw new Error("Failed to upsert guest record.", { cause: error });
  }
}

export async function deleteGuest(guestId: string) {
  try {
    return await db.delete(guests).where(eq(guests.id, guestId)).returning();
  } catch (error) {
    console.error("Database query failed in deleteGuest:", error);
    throw new Error("Failed to delete guest record.", { cause: error });
  }
}

// SERVICE REQUESTS
export async function getAllServiceRequests() {
  try {
    return await db.select().from(serviceRequests).orderBy(desc(serviceRequests.createdAt));
  } catch (error) {
    console.error("Database query failed in getAllServiceRequests:", error);
    throw new Error("Failed to fetch service requests.", { cause: error });
  }
}

export async function upsertServiceRequest(reqData: any) {
  try {
    const result = await db.insert(serviceRequests)
      .values({
        id: reqData.id,
        roomNumber: reqData.roomNumber,
        guestName: reqData.guestName || '',
        guestMobile: reqData.guestMobile || '',
        serviceType: reqData.serviceType,
        details: reqData.details || '',
        status: reqData.status || 'pending',
        createdAt: reqData.createdAt || new Date().toISOString(),
        completedAt: reqData.completedAt || null,
        year: reqData.year || '2026',
        visitType: reqData.visitType || 'general_1',
      })
      .onConflictDoUpdate({
        target: serviceRequests.id,
        set: {
          status: reqData.status || 'pending',
          completedAt: reqData.completedAt || null,
          details: reqData.details || '',
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query failed in upsertServiceRequest:", error);
    throw new Error("Failed to upsert service request.", { cause: error });
  }
}

// PENDING REGISTRATION REQUESTS
export async function getAllPendingRequests() {
  try {
    return await db.select().from(pendingRequests).orderBy(desc(pendingRequests.createdAt));
  } catch (error) {
    console.error("Database query failed in getAllPendingRequests:", error);
    throw new Error("Failed to fetch pending requests.", { cause: error });
  }
}

export async function upsertPendingRequest(reqData: any) {
  try {
    const result = await db.insert(pendingRequests)
      .values({
        id: reqData.id,
        name: reqData.name,
        country: reqData.country || 'المملكة العربية السعودية',
        mobile: reqData.mobile,
        email: reqData.email || null,
        whatsapp: reqData.whatsapp || null,
        roomType: reqData.roomType || null,
        status: reqData.status || 'pending',
        checkInDate: reqData.checkInDate || null,
        checkOutDate: reqData.checkOutDate || null,
        companionsCount: Number(reqData.companionsCount) || 0,
        administrativeRole: reqData.administrativeRole || 'عضو وفد',
        notes: reqData.notes || null,
        year: reqData.year || '2026',
        visitType: reqData.visitType || 'general_1',
        createdAt: reqData.createdAt || new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: pendingRequests.id,
        set: {
          status: reqData.status || 'pending',
          notes: reqData.notes || null,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Database query failed in upsertPendingRequest:", error);
    throw new Error("Failed to upsert pending request.", { cause: error });
  }
}

// GATE LOGS
export async function getAllGateLogs() {
  try {
    return await db.select().from(gateLogs);
  } catch (error) {
    console.error("Database query failed in getAllGateLogs:", error);
    return [];
  }
}

export async function upsertGateLog(logData: any) {
  try {
    const result = await db.insert(gateLogs)
      .values({
        id: logData.id,
        guestId: logData.guestId || null,
        guestName: logData.guestName,
        roomNumber: logData.roomNumber || null,
        entryType: logData.entryType || 'دخول',
        gateName: logData.gateName || 'البوابة الرئيسية',
        timestamp: logData.timestamp || new Date().toISOString(),
        officerName: logData.officerName || '',
        notes: logData.notes || '',
      })
      .onConflictDoUpdate({
        target: gateLogs.id,
        set: {
          guestName: logData.guestName,
          entryType: logData.entryType || 'دخول',
          gateName: logData.gateName || 'البوابة الرئيسية',
          timestamp: logData.timestamp || new Date().toISOString(),
          officerName: logData.officerName || '',
          notes: logData.notes || '',
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error("Database query failed in upsertGateLog:", error);
    throw new Error("Failed to upsert gate log.", { cause: error });
  }
}

// HOTEL SETTINGS
export async function getSetting(key: string) {
  try {
    const res = await db.select().from(hotelSettings).where(eq(hotelSettings.key, key));
    return res[0]?.value || null;
  } catch (error) {
    console.error("Database query failed in getSetting:", error);
    return null;
  }
}

export async function setSetting(key: string, value: any) {
  try {
    const res = await db.insert(hotelSettings)
      .values({
        key,
        value,
      })
      .onConflictDoUpdate({
        target: hotelSettings.key,
        set: {
          value,
          updatedAt: new Date(),
        },
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error("Database query failed in setSetting:", error);
    throw new Error("Failed to save setting.", { cause: error });
  }
}

// COMPLETE DATABASE RESET TO DEFAULT STATE
export async function resetAllHotelDataToDefault(defaultData: any) {
  try {
    // 1. Clear existing records in proper dependency order
    await db.delete(serviceRequests);
    await db.delete(pendingRequests);
    await db.delete(gateLogs);
    await db.delete(guests);
    await db.delete(rooms);

    // 2. Insert rooms
    if (defaultData.rooms && defaultData.rooms.length > 0) {
      await upsertRooms(defaultData.rooms);
    }

    // 3. Insert guests
    if (defaultData.guests && defaultData.guests.length > 0) {
      for (const g of defaultData.guests) {
        await upsertGuest(g);
      }
    }

    // 4. Insert service requests
    if (defaultData.serviceRequests && defaultData.serviceRequests.length > 0) {
      for (const s of defaultData.serviceRequests) {
        await upsertServiceRequest(s);
      }
    }

    // 5. Insert pending requests
    if (defaultData.pendingRequests && defaultData.pendingRequests.length > 0) {
      for (const p of defaultData.pendingRequests) {
        await upsertPendingRequest(p);
      }
    }

    // 6. Insert gate logs
    if (defaultData.gateLogs && defaultData.gateLogs.length > 0) {
      for (const gl of defaultData.gateLogs) {
        await upsertGateLog(gl);
      }
    }

    // 7. Insert settings
    if (defaultData.hotelSettings) {
      await setSetting("config", defaultData.hotelSettings);
    }

    return { success: true };
  } catch (error) {
    console.error("Database reset failed in resetAllHotelDataToDefault:", error);
    throw new Error("Failed to reset database tables.", { cause: error });
  }
}
