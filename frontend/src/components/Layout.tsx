import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, FileText, ShieldAlert, Scale, Download, LogOut, ShieldCheck } from 'lucide-react'
import { getRole, logout } from "@/lib/auth"
import LanguageSwitcher from "@/components/LanguageSwitcher"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const role = getRole()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems: Record<string, NavItem[]> = {
    applicant: [
      { label: t('nav.predict'), href: '/applicant', icon: FileText },
    ],
    auditor: [
      { label: t('nav.dashboard'), href: '/auditor', icon: LayoutDashboard },
      { label: t('nav.auditLog'), href: '/auditor/logs', icon: FileText },
      { label: t('nav.anomalies'), href: '/auditor/anomalies', icon: ShieldAlert },
    ],
    regulator: [
      { label: t('nav.fairness'), href: '/regulator', icon: Scale },
      { label: t('nav.export'), href: '/regulator/export', icon: Download },
    ],
  }

  const currentNavItems = role ? navItems[role] || [] : []

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        minWidth: '260px',
        background: '#0A1628',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        position: 'relative',
        zIndex: 20
      }}>
        {/* Logo */}
        <div style={{
          padding: '28px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <ShieldCheck size={28} color="#F4B942" />
            <span style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'white',
              fontFamily: 'Plus Jakarta Sans, sans-serif'
            }}>XAI Lending</span>
          </div>
          {/* Role badge */}
          <div style={{
            background: '#F4B942',
            color: '#0A1628',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'inline-block',
            textTransform: 'capitalize'
          }}>
            {role || 'Guest'}
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {currentNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '4px',
                  textDecoration: 'none',
                  background: isActive ? '#F4B942' : 'transparent',
                  color: isActive ? '#0A1628' : 'rgba(255,255,255,0.75)',
                  fontWeight: isActive ? '600' : '400',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  borderLeft: isActive ? '3px solid #0A1628' : '3px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'
                    ;(e.currentTarget as HTMLElement).style.color = 'white'
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'
                  }
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              borderRadius: '10px',
              width: '100%',
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'
              ;(e.currentTarget as HTMLElement).style.color = '#ef4444'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'
            }}
          >
            <LogOut size={18} />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Top bar */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #E5E7EB',
          padding: '0 32px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: '#0A1628',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}>
            {currentNavItems.find(i => i.href === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px',
          background: '#F8FAFC'
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout