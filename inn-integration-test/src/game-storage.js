/* The test bundle supplies a private adapter before game code. Native storage is the default. */
globalThis.GameStorage = globalThis.GameStorage || {
  getItem: key => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: key => localStorage.removeItem(key)
};
