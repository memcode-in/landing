import type { ReactNode } from 'react'
import HomePage from './pages/HomePage'
import CompanyBrainPage from './pages/CompanyBrainPage'
import CodingAgentPage from './pages/CodingAgentPage'
import MemoryInfraPage from './pages/MemoryInfraPage'
import DeveloperDocsPage from './pages/DeveloperDocsPage'
import { BlogPostPage, BlogsPage } from './pages/BlogPages'
import ResearchPage from './pages/ResearchPage'
import ContactPage from './pages/ContactPage'
import RemoteSession from './components/RemoteSession'
import { getDashboardUrl } from './lib/dashboard-routing'
import { useSeo } from './lib/seo'

function NoIndexRoute({ children, title, path }: { children: ReactNode; title: string; path?: string }) {
  useSeo({
    title,
    path,
    noindex: true,
  })

  return <>{children}</>
}

function AppRoutes() {
  const codeMatch = window.location.pathname.match(/^\/code\/([^/]+)/)
  if (codeMatch?.[1]) {
    return (
      <NoIndexRoute title="MemCode Remote Session" path={window.location.pathname}>
        <RemoteSession pairingId={codeMatch[1]} />
      </NoIndexRoute>
    )
  }

  if (
    window.location.pathname === '/dashboard'
    || window.location.pathname === '/login'
    || window.location.pathname === '/oauth/authorize'
  ) {
    const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const dashboardUrl = getDashboardUrl(currentPath)
    if (dashboardUrl !== currentPath && dashboardUrl !== window.location.href) {
      window.location.replace(dashboardUrl)
      return <main className="auth-page auth-page--loading">Opening the MemCode dashboard...</main>
    }

    return (
      <NoIndexRoute title="Dashboard | MemCode" path={window.location.pathname}>
        <main className="auth-page auth-page--loading">
          The dashboard is hosted separately. Configure VITE_MEMCODE_DASHBOARD_URL to connect this landing site.
        </main>
      </NoIndexRoute>
    )
  }

  if (window.location.pathname === '/blogs') {
    return <BlogsPage />
  }

  if (window.location.pathname === '/research') {
    return <ResearchPage />
  }

  if (window.location.pathname === '/contact') {
    return <ContactPage />
  }

  if (window.location.pathname === '/docs' || window.location.pathname === '/docs/memory') {
    return <DeveloperDocsPage />
  }

  const blogMatch = window.location.pathname.match(/^\/blogs\/([^/]+)/)
  if (blogMatch?.[1]) {
    return <BlogPostPage slug={decodeURIComponent(blogMatch[1])} />
  }

  if (window.location.pathname === '/company-brain') {
    return <CompanyBrainPage />
  }

  if (window.location.pathname === '/coding-agent') {
    return <CodingAgentPage />
  }

  if (window.location.pathname === '/memory') {
    return <MemoryInfraPage />
  }

  return <HomePage />
}

export default function App() {
  return <AppRoutes />
}
