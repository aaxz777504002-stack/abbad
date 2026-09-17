// Safe storage wrapper that transparently uses in-memory storage if localStorage/sessionStorage are blocked or throw SecurityError in iframes

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

const memoryLocalStorage = createMemoryStorage();
const memorySessionStorage = createMemoryStorage();

export const safeLocalStorage: Storage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Access denied / blocked iframe
    }
    return memoryLocalStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Access denied / blocked iframe
    }
    memoryLocalStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Access denied / blocked iframe
    }
    memoryLocalStorage.removeItem(key);
  },
  clear(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.clear();
        return;
      }
    } catch {
      // Access denied / blocked iframe
    }
    memoryLocalStorage.clear();
  },
  key(index: number): string | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.key(index);
      }
    } catch {
      // Access denied / blocked iframe
    }
    return memoryLocalStorage.key(index);
  },
  get length(): number {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.length;
      }
    } catch {
      // Access denied / blocked iframe
    }
    return memoryLocalStorage.length;
  }
};

export const safeSessionStorage: Storage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {
      // Access denied / blocked iframe
    }
    return memorySessionStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch {
      // Access denied / blocked iframe
    }
    memorySessionStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
        return;
      }
    } catch {
      // Access denied / blocked iframe
    }
    memorySessionStorage.removeItem(key);
  },
  clear(): void {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        window.sessionStorage.clear();
        return;
      }
    } catch {
      // Access denied / blocked iframe
    }
    memorySessionStorage.clear();
  },
  key(index: number): string | null {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return window.sessionStorage.key(index);
      }
    } catch {
      // Access denied / blocked iframe
    }
    return memorySessionStorage.key(index);
  },
  get length(): number {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return window.sessionStorage.length;
      }
    } catch {
      // Access denied / blocked iframe
    }
    return memorySessionStorage.length;
  }
};
