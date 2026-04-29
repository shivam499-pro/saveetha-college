import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, FileText, ShieldAlert, Scale, Download, LogOut, ShieldCheck, ChevronRight } from 'lucide-react'
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
    <div className="flex h-screen bg-[#F8FAFC] font-sans">
      {/* Sidebar */}
      <aside className="w-[280px] bg-navy text-white flex flex-col shadow-2xl z-20 overflow-hidden relative">
        {/* Sidebar background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16" />
        
        <div className="p-8 relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-gold p-2 rounded-xl">
              <ShieldCheck className="text-navy w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight font-display">XAI Lending</h1>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold rounded-full text-[10px] font-black uppercase tracking-widest text-navy mb-10 shadow-lg shadow-gold/20">
            <div className="w-1.5 h-1.5 rounded-full bg-navy animate-pulse" />
            {role}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 relative z-10">
          {currentNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-semibold",
                location.pathname === item.href
                  ? "bg-gold text-navy shadow-lg shadow-gold/10"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className={cn(
                  "transition-transform duration-300 group-hover:scale-110",
                  location.pathname === item.href ? "text-navy" : "text-white/40 group-hover:text-gold"
                )} />
                {item.label}
              </div>
              {location.pathname === item.href && <ChevronRight size={16} />}
            </Link>
          ))}
        </nav>

        <div className="p-6 relative z-10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-6 py-4 w-full text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-2xl transition-all duration-300 group"
          >
            <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
            {t('nav.logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-gray-100 flex items-center justify-between px-10 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-navy tracking-tight font-display">
              {currentNavItems.find(i => i.href === location.pathname)?.label || t('nav.dashboard')}
            </h2>
            <div className="text-xs font-medium text-gray-400">
              System active & secure
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="bg-navy/5 p-1 rounded-full border border-navy/5">
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout