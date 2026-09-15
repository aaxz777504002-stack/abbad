import type { IncomingMessage, ServerResponse } from "http";
import fs from "fs";
import path from "path";

// Candidate paths for config.json
function getConfigFilePath(): string {
  if (process.env.VERCEL) {
    return path.join("/tmp", "config.json");
  }
  const candidates = [
    path.join(process.cwd(), "config.json"),
    path.join(process.cwd(), "public", "config.json"),
    path.join(process.cwd(), "data", "config.json")
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return path.join(process.cwd(), "config.json");
}

function readConfig(): Record<string, any> {
  const tmpPath = path.join("/tmp", "config.json");
  if (fs.existsSync(tmpPath)) {
    try {
      const raw = fs.readFileSync(tmpPath, "utf8");
      return JSON.parse(raw);
    } catch {}
  }

  const p = getConfigFilePath();
  try {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("Failed to read config in serverless function:", e);
  }
  return {
    hotelName: "خدر ليالي الانس",
    registrationLinkStatus: "open"
  };
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

  if (req.method === "GET") {
    const config = readConfig();
    res.statusCode = 200;
    res.end(JSON.stringify(config));
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
    const current = readConfig();
    const updated = { ...current, ...body };
    const p = getConfigFilePath();
    try {
      fs.writeFileSync(p, JSON.stringify(updated, null, 2), "utf8");
    } catch (e) {
      console.warn("Could not write config on serverless filesystem:", e);
    }
    res.statusCode = 200;
    res.end(JSON.stringify(updated));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
