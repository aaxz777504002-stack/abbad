import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "https://eiuftadyyxmczizxmkin.supabase.co").trim();
  const key = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
  if (!url || !key) return null;
  try {
    return createClient(url, key, { auth: { persistSession: false } });
  } catch {
    return null;
  }
}

function getRequestsFilePath(): string {
  const tmpPath = path.join("/tmp", "pending_requests.json");
  const localDir = path.join(process.cwd(), "data");
  const localPath = path.join(localDir, "pending_requests.json");

  if (process.env.VERCEL) {
    return tmpPath;
  }

  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localPath;
  } catch {
    return tmpPath;
  }
}

function readRequests(): any[] {
  const tmpPath = path.join("/tmp", "pending_requests.json");
  const localPath = path.join(process.cwd(), "data", "pending_requests.json");

  if (fs.existsSync(tmpPath)) {
    try {
      const raw = fs.readFileSync(tmpPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  if (fs.existsSync(localPath)) {
    try {
      const raw = fs.readFileSync(localPath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }

  return [];
}

function saveRequests(list: any[]): void {
  const targetPath = getRequestsFilePath();
  try {
    fs.writeFileSync(targetPath, JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    try {
      fs.writeFileSync(path.join("/tmp", "pending_requests.json"), JSON.stringify(list, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not write requests in action:", e);
    }
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === "POST") {
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const { id, action, assignedRoomNumber, assignedGuestId } = body || {};
    if (!id || !action) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: "ID and Action are required" }));
      return;
    }

    const sb = getSupabaseClient();
    let requests = readRequests();

    if (action === "delete") {
      requests = requests.filter(r => r.id !== id);
      if (sb) {
        try {
          await sb.from("reservations").delete().eq("id", id);
        } catch {}
        try {
          await sb.from("pending_requests").delete().eq("id", id);
        } catch {}
      }
    } else {
      const updatedStatus = action === "approve" ? "approved" : action === "reset" ? "pending" : "rejected";
      requests = requests.map(r => {
        if (r.id === id) {
          return {
            ...r,
            status: updatedStatus,
            assignedRoomNumber: assignedRoomNumber !== undefined ? assignedRoomNumber : r.assignedRoomNumber,
            assignedGuestId: assignedGuestId !== undefined ? assignedGuestId : r.assignedGuestId
          };
        }
        return r;
      });

      if (sb) {
        try {
          await sb.from("reservations").update({
            status: updatedStatus,
            assigned_room_number: assignedRoomNumber || null,
            assigned_guest_id: assignedGuestId || null
          }).eq("id", id);
        } catch {}
        try {
          await sb.from("pending_requests").update({
            status: updatedStatus,
            assigned_room_number: assignedRoomNumber || null,
            assigned_guest_id: assignedGuestId || null
          }).eq("id", id);
        } catch {}
      }
    }

    saveRequests(requests);
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
