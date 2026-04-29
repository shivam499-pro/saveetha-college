import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, FileText, ShieldAlert, Scale, Download, LogOut, Menu } from 'lucide-react'
import { cn } from "@/lib/utils"
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
    <div className="flex h-screen bg-[#FFFFFF]">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[#0A1628] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-[#F4B942]">XAI Lending</h1>
          <p className="text-xs text-white/50 uppercase mt-1 tracking-wider">{role}</p>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {currentNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-sm",
                location.pathname === item.href
                  ? "bg-[#F4B942] text-[#0A1628] font-semibold"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-sm text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
          >
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-white">
          <div className="font-semibold text-[#0A1628]">
            {currentNavItems.find(i => i.href === location.pathname)?.label || t('nav.dashboard')}
          </div>
          <div className="bg-[#0A1628] px-4 py-2 rounded-full">
            <LanguageSwitcher />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout