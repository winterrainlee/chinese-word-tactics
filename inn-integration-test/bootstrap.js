/* Loaded before every game script. Never reads, writes, or migrates production keys. */
(() => {
  const prefix='cwt-inn-integration-v1:';
  globalThis.GameStorage=Object.freeze({
    getItem:key=>localStorage.getItem(prefix+key),
    setItem:(key,value)=>localStorage.setItem(prefix+key,value),
    removeItem:key=>localStorage.removeItem(prefix+key)
  });
})();
