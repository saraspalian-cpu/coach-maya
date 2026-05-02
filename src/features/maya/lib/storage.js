/**
 * Safe localStorage readers with shape validation.
 *
 * Why this exists: localStorage values can survive across breaking schema
 * changes, get edited in devtools, or arrive corrupted from cloud sync.
 * `JSON.parse` will happily return any shape, then `.map`/`.filter` crash
 * downstream. These helpers parse + verify the shape, returning a safe
 * fallback if anything's off.
 */

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return undefined
    return JSON.parse(raw)
  } catch { return undefined }
}

/**
 * Read an array from localStorage. Returns `fallback` (default `[]`) if
 * the key is missing, parse fails, or the value isn't an array.
 * Optional `itemGuard(item)` filters out items that fail the predicate.
 */
function readArray(key, { fallback = [], itemGuard } = {}) {
  const v = readJSON(key)
  if (!Array.isArray(v)) return fallback
  if (typeof itemGuard === 'function') return v.filter(itemGuard)
  return v
}

/**
 * Read a plain object from localStorage. Returns `fallback` (default `{}`)
 * if the key is missing, parse fails, or the value isn't a plain object.
 */
function readObject(key, { fallback = {} } = {}) {
  const v = readJSON(key)
  if (!v || typeof v !== 'object' || Array.isArray(v)) return fallback
  return v
}

/**
 * Read a value of an explicit primitive type. Returns `fallback` if the
 * type doesn't match. Useful for boolean flags / numbers / strings.
 */
function readPrimitive(key, type, fallback) {
  const v = readJSON(key)
  return typeof v === type ? v : fallback
}

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

function hasStringField(name) {
  return (item) => isPlainObject(item) && typeof item[name] === 'string'
}

export {
  readJSON,
  readArray,
  readObject,
  readPrimitive,
  isPlainObject,
  hasStringField,
}
