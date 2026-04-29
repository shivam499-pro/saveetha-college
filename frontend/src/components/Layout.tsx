import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Outlet, useLocation } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import { useAuth } from '../lib/auth'

const Layout: React.FC = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { role, isAuthenticated, logout } = useAuth()

  const isLoginPage = location.pathname === '/login'

  const navItems = [
    { key: 'dashboard', label: t('nav.dashboard'), path: `/${role}` },
    { key: 'predict', label: t('nav.predict'), path: `/${role}/predict` },
    { key: 'auditLog', label: t('nav.auditLog'), path: `/${role}/audit` },
    { key: 'fairness', label: t('nav.fairness'), path: `/${role}/fairness` },
    { key: 'export', label: t('nav.export'), path: `/${role}/export` },
  ]

  const getNavItemsForRole = () => {
    if (role === 'applicant') {
      return navItems.filter(item => item.key === 'predict')
    }
    if (role === 'auditor') {
      return navItems.filter(item =>
        item.key === 'dashboard' ||
        item.key === 'auditLog' ||
        item.key === 'fairness'
      )
    }
    if (role === 'regulator') {
      return navItems.filter(item =>
        item.key === 'dashboard' ||
        item.key === 'fairness' ||
        item.key === 'export'
      )
    }
    return []
  }

  const filteredNavItems = isAuthenticated ? getNavItemsForRole() : []

  if (isLoginPage) {
    return <Outlet />
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-white flex flex-col">
        <div className="p-6 border-b border-navy-700">
          <h1 className="text-xl font-bold text-gold-400">
            {t('layout.title')}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {t('layout.subtitle')}
          </p>
        </div>
        
        <nav className="flex-1 py-4">
          {filteredNavItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={`
                flex items-center px-6 py-3 text-sm font-medium
                transition-colors duration-150
                ${location.pathname === item.path
                  ? 'bg-navy-700 text-gold-400 border-l-4 border-gold-400'
                  : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }
              `}
            >
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-700">
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-navy-800 rounded-md transition-colors"
          >
            {t('layout.logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top navbar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-navy-900">
              {t(`nav.${location.pathname.split('/').pop() || 'dashboard'}`)}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {role && t(`role.${role}`)}
            </span>
            <LanguageSwitcher />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout