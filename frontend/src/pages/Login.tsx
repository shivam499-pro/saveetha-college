import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Alert, AlertDescription } from "../components/ui/alert"
import { AlertCircle } from "lucide-react"

const Login: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [token, setToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const from = (location.state as any)?.from?.pathname || "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // In a real app, you'd authenticate against the backend
      // For now, we'll accept any token and store it
      if (!token.trim()) {
        throw new Error(t("login.error.tokenRequired"))
      }

      login(token)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.error.invalid"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t("login.title")}</CardTitle>
          <CardDescription className="text-center">
            {t("login.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="token">{t("login.token")}</Label>
              <Input
                id="token"
                type="text"
                placeholder={t("login.tokenPlaceholder")}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("login.signingIn") : t("login.signIn")}
            </Button>

            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>{t("login.demoNote")}</p>
              <div className="space-y-1">
                <p className="font-medium">{t("login.demoRoles")}:</p>
                <p className="text-xs">• applicant - Applicant access</p>
                <p className="text-xs">• auditor - Auditor access</p>
                <p className="text-xs">• regulator - Regulator access</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
