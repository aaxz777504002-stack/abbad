import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  Auth 
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  Firestore
} from "firebase/firestore";
import type { PendingRequest, Room, Guest, ServiceRequest, GateEntryLog } from "../types";
import firebaseConfigJson from "../../firebase-applet-config.json";
import rootConfigJson from "../../config.json";

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  oAuthClientId?: string;
}

export interface AuthErrorDetails {
  code: string;
  title: string;
  message: string;
  isUnauthorizedDomain: boolean;
  isPopupBlocked: boolean;
  isCancelled: boolean;
  isNetworkError: boolean;
  domain: string;
  suggestedAction: string;
}

export const getCurrentDomain = (): string => {
  if (typeof window !== "undefined") {
    return window.location.hostname;
  }
  return "";
};

export const isInIframe = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
};

export const hasCustomFirebaseConfig = (): boolean => {
  if (typeof window !== "undefined") {
    return !!localStorage.getItem("custom_firebase_config");
  }
  return false;
};

export const saveCustomFirebaseConfig = (config: FirebaseAppConfig) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("custom_firebase_config", JSON.stringify(config));
    window.location.reload();
  }
};

export const resetCustomFirebaseConfig = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("custom_firebase_config");
    window.location.reload();
  }
};

export const parseAuthError = (error: any): AuthErrorDetails => {
  const currentDomain = getCurrentDomain();
  const code = error?.code || (typeof error?.message === "string" ? error.message : "");
  
  if (
    code.includes("auth/unauthorized-domain") || 
    (typeof error?.message === "string" && error.message.includes("unauthorized-domain")) ||
    (typeof error?.message === "string" && error.message.includes("not authorized"))
  ) {
    return {
      code: "auth/unauthorized-domain",
      title: "نطاق الموقع غير مصرح به في فيربيز (Unauthorized Domain)",
      message: `نطاق موقعك الحالي على Vercel (${currentDomain}) غير مضاف في قائمة النطاقات المصرح بها (Authorized Domains) في إعدادات Firebase Authentication.`,
      isUnauthorizedDomain: true,
      isPopupBlocked: false,
      isCancelled: false,
      isNetworkError: false,
      domain: currentDomain,
      suggestedAction: "أضف هذا النطاق إلى Authorized Domains في Firebase Console، أو استخدم رمز وصول مباشر (Access Token)."
    };
  }

  if (
    code.includes("auth/popup-blocked") || 
    (typeof error?.message === "string" && error.message.includes("popup-blocked"))
  ) {
    return {
      code: "auth/popup-blocked",
      title: "تم حظر النافذة المنبثقة من المتصفح (Popup Blocked)",
      message: "قام المتصفح بحظر نافذة تسجيل الدخول المنبثقة. يرجى السماح بالنوافذ المنبثقة لموقعك أو تجربة تسجيل الدخول بإعادة التوجيه (Redirect).",
      isUnauthorizedDomain: false,
      isPopupBlocked: true,
      isCancelled: false,
      isNetworkError: false,
      domain: currentDomain,
      suggestedAction: "اسمح بالنوافذ المنبثقة (Popups) أو اضغط على زر تسجيل الدخول بإعادة التوجيه."
    };
  }

  if (
    code.includes("auth/popup-closed-by-user") || 
    code.includes("auth/cancelled-popup-request") ||
    (typeof error?.message === "string" && (
      error.message.includes("cancelled-popup-request") ||
      error.message.includes("Pending promise was never set") ||
      error.message.includes("popup-closed-by-user")
    ))
  ) {
    return {
      code: "auth/popup-closed-by-user",
      title: "تم إلغاء نافذة تسجيل الدخول",
      message: "تم إلغاء أو إغلاق نافذة المصادقة. يمكنك النقر مجدداً للمحاولة.",
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isCancelled: true,
      isNetworkError: false,
      domain: currentDomain,
      suggestedAction: "أعد النقر على زر تسجيل الدخول بحساب Google واختر حسابك المطلوب."
    };
  }

  if (
    code.includes("auth/network-request-failed") ||
    (typeof error?.message === "string" && error.message.includes("network-request-failed"))
  ) {
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    return {
      code: "auth/network-request-failed",
      title: isOffline ? "لا يوجد اتصال بالإنترنت" : "تعذر الاتصال بالشبكة بخوادم المصادقة (Network Error)",
      message: isOffline 
        ? "جهازك غير متصل بالإنترنت حالياً. يرجى التأكد من تشغيل الواي فاي أو بيانات الهاتف المحمول."
        : "تعذر على المتصفح الوصول لخوادم Google/Firebase. قد يكون ذلك بسبب تذبذب الاتصال، أو حظر ملفات تعريف الارتباط للطرف الثالث (Third-party Cookies)، أو تفعيل إضافة مانع الإعلانات (AdBlock / Brave Shields).",
      isUnauthorizedDomain: false,
      isPopupBlocked: false,
      isCancelled: false,
      isNetworkError: true,
      domain: currentDomain,
      suggestedAction: "تحقق من اتصال الإنترنت، أو عطل مانع الإعلانات للموقع، أو استخدم خيار (تسجيل الدخول المباشر فوراً Redirect)."
    };
  }

  return {
    code: code || "auth/unknown",
    title: "فشل تسجيل الدخول بحساب Google",
    message: error?.message || "حدث خطأ غير متوقع أثناء محاولة تسجيل الدخول.",
    isUnauthorizedDomain: false,
    isPopupBlocked: false,
    isCancelled: false,
    isNetworkError: false,
    domain: currentDomain,
    suggestedAction: "تحقق من إعدادات الحساب وكرر المحاولة."
  };
};

export const getFirebaseConfig = (): FirebaseAppConfig => {
  // Check if user set custom config in localStorage
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("custom_firebase_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse custom_firebase_config:", e);
    }
  }

  const metaEnv = (import.meta as any).env || {};
  const fbConfig = (rootConfigJson as any)?.firebase || rootConfigJson || {};
  const projectId = metaEnv.VITE_FIREBASE_PROJECT_ID || fbConfig.projectId || firebaseConfigJson.projectId || "";
  const authDomain = metaEnv.VITE_FIREBASE_AUTH_DOMAIN || fbConfig.authDomain || (projectId ? `${projectId}.firebaseapp.com` : firebaseConfigJson.authDomain);

  return {
    projectId,
    appId: metaEnv.VITE_FIREBASE_APP_ID || fbConfig.appId || firebaseConfigJson.appId || "",
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || fbConfig.apiKey || firebaseConfigJson.apiKey || "",
    authDomain,
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || fbConfig.storageBucket || firebaseConfigJson.storageBucket || "",
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || fbConfig.messagingSenderId || firebaseConfigJson.messagingSenderId || "",
    oAuthClientId: metaEnv.VITE_FIREBASE_OAUTH_CLIENT_ID || fbConfig.oAuthClientId || (firebaseConfigJson as any).oAuthClientId || "",
  };
};

const activeConfig = getFirebaseConfig();
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(activeConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

export const provider = new GoogleAuthProvider();
// Add required Workspace scopes for Google Sheets and Google Drive (creating & reading spreadsheets)
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.setCustomParameters({
  prompt: "select_account"
});

let activeSignInPromise: Promise<{ user: User; accessToken: string } | null> | null = null;
let lastSignInAttempt = 0;
let cachedAccessToken: string | null = null;
let cachedTokenExpiry: number | null = null;

export const isSigningInProgress = (): boolean => activeSignInPromise !== null;

// Clear invalid/expired token and notify app components
export const clearStoredToken = () => {
  cachedAccessToken = null;
  cachedTokenExpiry = null;
  sessionStorage.removeItem("google_sheets_token");
  sessionStorage.removeItem("google_sheets_token_expires_at");
  localStorage.removeItem("google_sheets_token");
  localStorage.removeItem("google_sheets_token_expires_at");
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("google_auth_expired"));
  }
};

// Set manual token (for alternative direct access without OAuth popup)
export const setManualAccessToken = (token: string, expiresInHours = 2) => {
  cachedAccessToken = token.trim();
  const expiresAt = Date.now() + (expiresInHours * 60 * 60 * 1000);
  cachedTokenExpiry = expiresAt;

  sessionStorage.setItem("google_sheets_token", cachedAccessToken);
  sessionStorage.setItem("google_sheets_token_expires_at", String(expiresAt));
  localStorage.setItem("google_sheets_token", cachedAccessToken);
  localStorage.setItem("google_sheets_token_expires_at", String(expiresAt));

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("google_auth_renewed", { detail: { token: cachedAccessToken } }));
  }
};

// Check if token is expired or about to expire in the next 60 seconds
export const isTokenExpired = (): boolean => {
  if (!cachedTokenExpiry) {
    const storedExpiry = sessionStorage.getItem("google_sheets_token_expires_at") || localStorage.getItem("google_sheets_token_expires_at");
    if (storedExpiry) {
      cachedTokenExpiry = parseInt(storedExpiry, 10);
    }
  }
  if (!cachedTokenExpiry) return false; // If no expiry recorded, assume valid until proven 401
  return Date.now() >= (cachedTokenExpiry - 60000);
};

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = getAccessToken();
      if (token && !isTokenExpired()) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else {
        // If there's a user in Firebase Auth but token is missing/expired
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedTokenExpiry = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Log in / Renew Token with detailed error capture and concurrent promise lock
export const googleSignIn = async (options?: { preferRedirect?: boolean }): Promise<{ user: User; accessToken: string } | null> => {
  // If an active popup/sign-in promise is already in flight, reuse it!
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  // Prevent rapid double-clicks (within 800ms)
  const now = Date.now();
  if (now - lastSignInAttempt < 800) {
    const existingToken = getAccessToken();
    if (existingToken && auth.currentUser) {
      return { user: auth.currentUser, accessToken: existingToken };
    }
    return null;
  }
  lastSignInAttempt = now;

  // Check if we already have valid session and token
  const currentToken = getAccessToken();
  if (currentToken && !isTokenExpired() && auth.currentUser) {
    return { user: auth.currentUser, accessToken: currentToken };
  }

  // If redirect is explicitly requested and we are not restricted inside an iframe
  if (options?.preferRedirect && !isInIframe()) {
    await googleSignInRedirect();
    return null;
  }

  activeSignInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error("Failed to get access token from Firebase Auth credential");
      }

      cachedAccessToken = credential.accessToken;
      // Set 1 hour expiry (58 minutes buffer)
      const expiresAt = Date.now() + (58 * 60 * 1000);
      cachedTokenExpiry = expiresAt;

      // Save in storage to preserve token during page reloads
      sessionStorage.setItem("google_sheets_token", cachedAccessToken);
      sessionStorage.setItem("google_sheets_token_expires_at", String(expiresAt));
      localStorage.setItem("google_sheets_token", cachedAccessToken);
      localStorage.setItem("google_sheets_token_expires_at", String(expiresAt));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("google_auth_renewed", { detail: { token: cachedAccessToken } }));
      }

      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      const code = error?.code || (typeof error?.message === "string" ? error.message : "");
      
      // If user cancelled, closed the popup, or a duplicate cancelled request occurred:
      if (
        code.includes("auth/popup-closed-by-user") ||
        code.includes("auth/cancelled-popup-request") ||
        (typeof error?.message === "string" && (
          error.message.includes("cancelled-popup-request") ||
          error.message.includes("Pending promise was never set") ||
          error.message.includes("popup-closed-by-user")
        ))
      ) {
        console.warn("Google sign-in popup cancelled or closed by user:", code);
        return null;
      }

      // If popup was blocked by browser:
      if (code.includes("auth/popup-blocked")) {
        console.warn("Google sign-in popup blocked by browser:", code);
        throw error;
      }

      // If network error and user appears online, try a fast automatic retry after 800ms
      if (
        (code.includes("auth/network-request-failed") || (typeof error?.message === "string" && error.message.includes("network-request-failed"))) &&
        (typeof navigator === "undefined" || navigator.onLine)
      ) {
        console.warn("Network glitch during popup sign-in, attempting automatic retry in 800ms...");
        await new Promise((resolve) => setTimeout(resolve, 800));
        try {
          const retryResult = await signInWithPopup(auth, provider);
          const credential = GoogleAuthProvider.credentialFromResult(retryResult);
          if (credential?.accessToken) {
            cachedAccessToken = credential.accessToken;
            const expiresAt = Date.now() + (58 * 60 * 1000);
            cachedTokenExpiry = expiresAt;

            sessionStorage.setItem("google_sheets_token", cachedAccessToken);
            sessionStorage.setItem("google_sheets_token_expires_at", String(expiresAt));
            localStorage.setItem("google_sheets_token", cachedAccessToken);
            localStorage.setItem("google_sheets_token_expires_at", String(expiresAt));

            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("google_auth_renewed", { detail: { token: cachedAccessToken } }));
            }

            return { user: retryResult.user, accessToken: cachedAccessToken };
          }
        } catch (retryError: any) {
          console.warn("Automatic retry also failed:", retryError);
          error = retryError;
        }
      }

      console.error("Sign in error:", error);
      throw error;
    } finally {
      setTimeout(() => {
        activeSignInPromise = null;
      }, 400);
    }
  })();

  return activeSignInPromise;
};

// Sign in via Redirect (Alternative if popup is blocked by browser or mobile)
export const googleSignInRedirect = async () => {
  if (isInIframe()) {
    // Cannot redirect inside iframe due to X-Frame-Options on accounts.google.com
    if (typeof window !== "undefined") {
      window.open(window.location.href, "_blank");
    }
    return;
  }
  try {
    await signInWithRedirect(auth, provider);
  } catch (error: any) {
    console.error("Redirect sign in error:", error);
    throw error;
  }
};

// Check for redirect result upon page reload (with timeout to prevent blocking preview)
export const checkRedirectResult = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200));
    const result = await Promise.race([getRedirectResult(auth), timeoutPromise]);
    if (!result) return null;
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      const expiresAt = Date.now() + (58 * 60 * 1000);
      cachedTokenExpiry = expiresAt;

      sessionStorage.setItem("google_sheets_token", cachedAccessToken);
      sessionStorage.setItem("google_sheets_token_expires_at", String(expiresAt));
      localStorage.setItem("google_sheets_token", cachedAccessToken);
      localStorage.setItem("google_sheets_token_expires_at", String(expiresAt));

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("google_auth_renewed", { detail: { token: cachedAccessToken } }));
      }
      return { user: result.user, accessToken: cachedAccessToken };
    }
  } catch (error: any) {
    console.warn("Check redirect result error:", error);
  }
  return null;
};

// Retrieve token (with auto expiry check)
export const getAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    cachedAccessToken = sessionStorage.getItem("google_sheets_token") || localStorage.getItem("google_sheets_token");
  }
  if (!cachedTokenExpiry) {
    const storedExpiry = sessionStorage.getItem("google_sheets_token_expires_at") || localStorage.getItem("google_sheets_token_expires_at");
    if (storedExpiry) {
      cachedTokenExpiry = parseInt(storedExpiry, 10);
    }
  }

  // If token is definitely expired, clear and return null
  if (cachedAccessToken && cachedTokenExpiry && Date.now() >= cachedTokenExpiry) {
    clearStoredToken();
    return null;
  }

  return cachedAccessToken;
};

// Log out
export const logout = async () => {
  try {
    await auth.signOut();
  } catch (e) {
    console.warn("Auth signout error:", e);
  }
  clearStoredToken();
};

/* =========================================================================
   FIRESTORE CLOUD PERSISTENCE & REAL-TIME SYNC
   Ensures self-registration requests from Vercel links, reception desk updates,
   and hotel settings sync directly with zero config friction.
   ========================================================================= */

let firestoreDbAvailable = true;

/**
 * Save or update a guest pending self-registration request to Firestore
 */
export const savePendingRequestToFirestore = async (request: PendingRequest): Promise<boolean> => {
  if (!firestoreDbAvailable) return false;
  try {
    const docRef = doc(db, "pending_requests", request.id);
    await setDoc(docRef, {
      ...request,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.code === "not-found") {
      firestoreDbAvailable = false;
    }
    console.warn("Firestore savePendingRequest warning:", err);
    return false;
  }
};

/**
 * Delete a pending request from Firestore (e.g. after approval or rejection)
 */
export const deletePendingRequestFromFirestore = async (id: string): Promise<boolean> => {
  if (!firestoreDbAvailable) return false;
  try {
    const docRef = doc(db, "pending_requests", id);
    await deleteDoc(docRef);
    return true;
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.code === "not-found") {
      firestoreDbAvailable = false;
    }
    console.warn("Firestore deletePendingRequest warning:", err);
    return false;
  }
};

/**
 * Fetch all pending requests from Firestore once (with timeout)
 */
export const fetchPendingRequestsFromFirestore = async (): Promise<PendingRequest[]> => {
  if (!firestoreDbAvailable) return [];
  try {
    const coll = collection(db, "pending_requests");
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Firestore fetch timeout")), 1200)
    );
    const snapshot = await Promise.race([getDocs(coll), timeoutPromise]);
    const list: PendingRequest[] = [];
    snapshot.forEach((d) => {
      const data = d.data() as PendingRequest;
      list.push({ ...data, id: d.id });
    });
    list.sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id.localeCompare(a.id));
    return list;
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.code === "not-found") {
      firestoreDbAvailable = false;
    }
    console.warn("Firestore fetchPendingRequests warning/timeout:", err);
    return [];
  }
};

/**
 * Real-time listener for pending requests.
 * Fires instantly when anyone submits via the Vercel link!
 */
export const subscribeToPendingRequests = (
  onData: (requests: PendingRequest[]) => void,
  onError?: (err: any) => void
): (() => void) => {
  if (!firestoreDbAvailable) return () => {};
  try {
    const coll = collection(db, "pending_requests");
    return onSnapshot(coll, (snapshot) => {
      const list: PendingRequest[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as PendingRequest;
        list.push({ ...data, id: d.id });
      });
      list.sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id.localeCompare(a.id));
      onData(list);
    }, (err) => {
      if (err?.message?.includes("not found") || err?.code === "not-found") {
        firestoreDbAvailable = false;
      }
      console.warn("Firestore subscribeToPendingRequests snapshot error:", err);
      if (onError) onError(err);
    });
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.code === "not-found") {
      firestoreDbAvailable = false;
    }
    console.warn("Firestore subscribeToPendingRequests init warning:", err);
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Save hotel global config (e.g., registrationLinkStatus: "open" | "closed")
 */
export const saveHotelConfigToFirestore = async (cfg: { registrationLinkStatus?: string; hotelName?: string }): Promise<boolean> => {
  if (!firestoreDbAvailable) return false;
  try {
    const docRef = doc(db, "config", "hotel_settings");
    await setDoc(docRef, { ...cfg, updatedAt: new Date().toISOString() }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.code === "not-found") {
      firestoreDbAvailable = false;
    }
    console.warn("Firestore saveHotelConfig warning:", err);
    return false;
  }
};

/**
 * Subscribe to hotel config in real-time
 */
export const subscribeToHotelConfig = (
  onData: (cfg: { registrationLinkStatus?: string; hotelName?: string }) => void
): (() => void) => {
  if (!firestoreDbAvailable) return () => {};
  try {
    const docRef = doc(db, "config", "hotel_settings");
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        onData(snap.data() as any);
      }
    }, (err) => {
      if (err?.message?.includes("not found") || err?.code === "not-found") {
        firestoreDbAvailable = false;
      }
      console.warn("Firestore subscribeToHotelConfig snapshot error:", err);
    });
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.code === "not-found") {
      firestoreDbAvailable = false;
    }
    console.warn("Firestore subscribeToHotelConfig init warning:", err);
    return () => {};
  }
};

/**
 * Fetch hotel config once (with timeout)
 */
export const fetchHotelConfigFromFirestore = async (): Promise<{ registrationLinkStatus?: string; hotelName?: string } | null> => {
  if (!firestoreDbAvailable) return null;
  try {
    const docRef = doc(db, "config", "hotel_settings");
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("Firestore config fetch timeout")), 1200)
    );
    const snap = await Promise.race([getDoc(docRef), timeoutPromise]);
    if (snap.exists()) {
      return snap.data() as any;
    }
    return null;
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.code === "not-found") {
      firestoreDbAvailable = false;
    }
    console.warn("Firestore fetchHotelConfig warning/timeout:", err);
    return null;
  }
};

/**
 * Backup / sync full hotel state (rooms, guests, serviceRequests, gateLogs) to Firestore
 */
export const saveHotelFullStateToFirestore = async (data: {
  rooms?: Room[];
  guests?: Guest[];
  serviceRequests?: ServiceRequest[];
  gateLogs?: GateEntryLog[];
}): Promise<boolean> => {
  if (!firestoreDbAvailable) return false;
  try {
    const docRef = doc(db, "config", "hotel_live_data");
    await setDoc(docRef, {
      ...data,
      lastSyncedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.code === "not-found") {
      firestoreDbAvailable = false;
    }
    console.warn("Firestore saveHotelFullState warning:", err);
    return false;
  }
};

/**
 * Fetch full hotel state from Firestore
 */
export const fetchHotelFullStateFromFirestore = async (): Promise<{
  rooms?: Room[];
  guests?: Guest[];
  serviceRequests?: ServiceRequest[];
  gateLogs?: GateEntryLog[];
} | null> => {
  if (!firestoreDbAvailable) return null;
  try {
    const docRef = doc(db, "config", "hotel_live_data");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as any;
    }
    return null;
  } catch (err) {
    console.warn("Firestore fetchHotelFullState warning:", err);
    return null;
  }
};

