// Optional analytics: no network by default. If a host installs Plausible or
// Umami, events are forwarded; otherwise they stay in the local data layer.
// The first meaningful action is kept in localStorage for user-testing notes.

export function track(event, props = {}) {
  try {
    if (!localStorage.getItem('dx_first_action')) {
      localStorage.setItem('dx_first_action', JSON.stringify({
        event, props, at: new Date().toISOString(),
      }))
    }
  } catch {}
  try {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({ event, ...props })
    if (typeof window.plausible === 'function') window.plausible(event, { props })
    if (window.umami && typeof window.umami.track === 'function') window.umami.track(event, props)
  } catch {}
}
