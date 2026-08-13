const configuredDashboardOrigin = (import.meta.env.VITE_MEMCODE_DASHBOARD_URL || '')
  .trim()
  .replace(/\/+$/, '')

export function getDashboardUrl(path = '/dashboard') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!configuredDashboardOrigin) return normalizedPath
  return new URL(normalizedPath, `${configuredDashboardOrigin}/`).toString()
}

export function getDashboardLoginUrl(returnUrl?: string) {
  const params = new URLSearchParams()
  if (returnUrl) params.set('returnUrl', returnUrl)
  const query = params.toString()
  return getDashboardUrl(`/login${query ? `?${query}` : ''}`)
}
