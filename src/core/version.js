// How the build is described on the title screen: the short git hash and when that commit was made.
// Both come from src/build-info.js, which the repo's workflow keeps current (tools/stamp.mjs). A copy that was never stamped says 'dev'.

/** "Oct 21, 2026, 10:34 AM PDT" in the viewer's own time zone (or `timeZone`, for tests). Empty when the date cannot be read. */
export function formatUpdated(iso, { locale, timeZone } = {}) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short', timeZone }).format(d);
}

/** The line shown on the title screen. `hash` is 'dev' when the copy was never stamped. */
export function describeBuild({ hash = 'dev', updated } = {}, opts) {
  if (hash === 'dev') return 'Unstamped development build';
  const when = formatUpdated(updated, opts);
  return 'Build ' + hash + (when ? ' · ' + when : '');
}
