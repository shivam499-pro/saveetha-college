import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getToken } from '@/lib/api'
import { login } from '@/lib/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { UserRole } from '@/types'
import { Loader2 } from 'lucide-react'

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

  const roles: UserRole[] = ['applicant', 'auditor', 'regulator']

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-4 relative">
      <div className="absolute top-8 right-8">
        <LanguageSwitcher />
      </div>

      <Card className="w-full max-w-md border-none shadow-2xl overflow-hidden">
        <div className="h-2 bg-[#F4B942]" />
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-2xl font-bold text-[#0A1628]">
            {t('auth.loginTitle')}
          </CardTitle>
          <CardDescription className="mt-2">
            {t('auth.selectRole')}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pb-8 px-8">
          {roles.map((role) => (
            <Button
              key={role}
              onClick={() => handleLogin(role)}
              disabled={!!loading}
              className="w-full py-6 text-lg font-semibold bg-white text-[#0A1628] border-2 border-[#0A1628]/10 hover:bg-[#F4B942] hover:border-[#F4B942] hover:text-[#0A1628] transition-all capitalize"
            >
              {loading === role ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              {t('auth.loginButton', { role })}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
