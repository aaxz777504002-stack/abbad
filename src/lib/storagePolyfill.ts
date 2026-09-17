// Safe Storage Polyfill to prevent iframe SecurityError DOMException when cookies or storage are blocked

(function initSafeStorage() {
  if (typeof window === "undefined") return;

  const createMemoryStorage = (): Storage => {
    const store = new Map<string, string>();
    return {
      getItem: (key: string): string | null => {
        return store.has(key) ? store.get(key)! : null;
      },
      setItem: (key: string, value: string): void => {
        store.set(key, String(value));
      },
      removeItem: (key: string): void => {
        store.delete(key);
      },
      clear: (): void => {
        store.clear();
      },
      key: (index: number): string | null => {
        const keys = Array.from(store.keys());
        return keys[index] ?? null;
      },
      get length(): number {
        return store.size;
      }
    };
  };

  const testStorage = (type: "localStorage" | "sessionStorage"): boolean => {
    try {
      const storage = window[type];
      if (!storage) return false;
      const testKey = "__hotel_test_storage__";
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  };

  if (!testStorage("localStorage")) {
    try {
      const memStore = createMemoryStorage();
      const proto = (typeof Window !== "undefined" && Window.prototype) || 
                    (typeof window !== "undefined" && (window as any).Window && (window as any).Window.prototype) || 
                    (typeof window !== "undefined" ? Object.getPrototypeOf(window) : null);
      if (proto) {
        try {
          Object.defineProperty(proto, "localStorage", {
            get: () => memStore,
            configurable: true,
            enumerable: true
          });
        } catch {}
      }
      try {
        Object.defineProperty(window, "localStorage", {
          value: memStore,
          configurable: true,
          enumerable: true,
          writable: true
        });
      } catch {}
    } catch (e) {
      console.warn("Could not patch localStorage:", e);
    }
  }

  if (!testStorage("sessionStorage")) {
    try {
      const memStore = createMemoryStorage();
      const proto = (typeof Window !== "undefined" && Window.prototype) || 
                    (typeof window !== "undefined" && (window as any).Window && (window as any).Window.prototype) || 
                    (typeof window !== "undefined" ? Object.getPrototypeOf(window) : null);
      if (proto) {
        try {
          Object.defineProperty(proto, "sessionStorage", {
            get: () => memStore,
            configurable: true,
            enumerable: true
          });
        } catch {}
      }
      try {
        Object.defineProperty(window, "sessionStorage", {
          value: memStore,
          configurable: true,
          enumerable: true,
          writable: true
        });
      } catch {}
    } catch (e) {
      console.warn("Could not patch sessionStorage:", e);
    }
  }
})();

export {};
