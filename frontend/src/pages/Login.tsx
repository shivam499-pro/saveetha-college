import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getToken } from '@/lib/api'
import { login } from '@/lib/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { UserRole } from '@/types'
import { Loader2, ShieldCheck, UserCircle, Search, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

const Login: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)

  const handleLogin = async (role: UserRole) => {
    setLoading(role)
    try {
      const response = await getToken(role)
      login(response.access_token)
      // Navigate based on role
      if (role === 'applicant') navigate('/applicant')
      else if (role === 'auditor') navigate('/auditor')
      else if (role === 'regulator') navigate('/regulator')
    } catch (error) {
      console.error('Login failed', error)
      alert(t('common.error'))
    } finally {
      setLoading(null)
    }
  }

  const roleDetails = [
    {
      role: 'applicant' as UserRole,
      icon: UserCircle,
      color: 'text-blue-500 bg-blue-50',
      description: 'Apply for credit and view decisions'
    },
    {
      role: 'auditor' as UserRole,
      icon: Search,
      color: 'text-purple-500 bg-purple-50',
      description: 'Review decisions and verify audit trail'
    },
    {
      role: 'regulator' as UserRole,
      icon: Scale,
      color: 'text-emerald-500 bg-emerald-50',
      description: 'Monitor fairness and compliance'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1628] via-[#1a2d4a] to-[#0A1628] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gold-light blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gold-dark blur-[120px]" />
      </div>

      <div className="absolute top-8 right-8 z-50">
        <div className="bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20">
          <LanguageSwitcher />
        </div>
      </div>

      <div className="w-full max-w-lg animate-fadeIn">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10 backdrop-blur-sm">
            <ShieldCheck className="text-gold w-8 h-8" />
            <span className="text-2xl font-bold text-white tracking-tight font-display">XAI Lending</span>
          </div>
          <p className="text-white/60 text-lg font-medium">
            Explainable AI Credit Decisions
          </p>
        </div>

        <div className="glass rounded-[2rem] shadow-2xl p-8 relative overflow-hidden border-t-4 border-t-gold">
          <div className="relative z-10 space-y-6">
            <h2 className="text-white text-xl font-bold text-center mb-8">
              {t('auth.selectRole')}
            </h2>

            <div className="grid gap-4">
              {roleDetails.map(({ role, icon: Icon, color, description }) => (
                <button
                  key={role}
                  onClick={() => handleLogin(role)}
                  disabled={!!loading}
                  className={cn(
                    "group relative w-full bg-white rounded-2xl p-5 flex items-center gap-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:ring-2 hover:ring-gold border-2 border-transparent text-left",
                    loading === role ? "opacity-90" : ""
                  )}
                >
                  <div className={cn("p-3 rounded-xl transition-colors duration-300 group-hover:bg-gold/10", color)}>
                    {loading === role ? (
                      <Loader2 className="w-8 h-8 animate-spin" />
                    ) : (
                      <Icon className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-navy text-lg capitalize tracking-tight font-display">{role}</div>
                    <div className="text-gray-500 text-sm font-medium">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-white/40 text-sm font-medium">
            &copy; 2026 Explainable Lending Platform. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
