(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports && typeof require === 'function') module.exports = api;
  root.TrainerStorage = api;
})(globalThis, function () {
  function read(storage, key) {
    try {
      const raw = storage.getItem(key);
      if (raw === null) return { status: 'absent', value: null };
      try { return { status: 'valid', value: JSON.parse(raw), raw }; }
      catch { return { status: 'corrupt', value: null, raw }; }
    } catch { return { status: 'unavailable', value: null }; }
  }
  function write(storage, key, value, isValid = () => true) {
    try {
      const old = read(storage, key);
      if (old.status === 'unavailable') return false;
      if (old.status === 'corrupt' || (old.status === 'valid' && !isValid(old.value))) {
        // Keep the source on this device before replacing a damaged record.
        let backup = `${key}.recovery`;
        let suffix = 0;
        while (storage.getItem(backup) !== null) backup = `${key}.recovery.${++suffix}`;
        storage.setItem(backup, old.raw);
      }
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch { return false; }
  }
  function remove(storage, keys) {
    try {
      const targets=new Set(keys);
      for(let i=0;i<(storage.length||0);i++){const key=storage.key(i);if(key&&keys.some(k=>key===k||key.startsWith(k+'.recovery')))targets.add(key);}
      for(const key of targets)storage.removeItem(key);
      return true;
    }catch{return false;}
  }
  function browser(){try{return window.localStorage;}catch{return {getItem:()=>null,setItem:()=>{throw Error('storage unavailable');},removeItem:()=>{throw Error('storage unavailable');}};}}
  return { read, write, remove, browser };
});
