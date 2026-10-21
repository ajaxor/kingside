// Generic helpers with no game knowledge.

/** Remove, in place, every item of `list` that matches `isGone`. */
export function removeWhere(list, isGone) {
  let kept = 0;
  for (let i = 0; i < list.length; i++) if (!isGone(list[i])) list[kept++] = list[i];
  list.length = kept;
}

/** Remove one item from a list in place (does nothing if it is not there). */
export function removeItem(list, item) {
  const at = list.indexOf(item);
  if (at >= 0) list.splice(at, 1);
}

/** localStorage that never throws (private browsing, blocked storage). */
export const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, String(value)); } catch { /* ignore */ } },
};
