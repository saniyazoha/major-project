export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

export function load(key, defaultValue = null) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}
