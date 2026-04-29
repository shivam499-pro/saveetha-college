import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getToken } from '@/lib/api'
import { login } from '@/lib/auth'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { UserRole } from '@/types'
import { Loader2, ShieldCheck, UserCircle, Search, Scale, ArrowRight } from 'lucide-react'

/* ─── Role card definitions — same data, richer visuals ─── */
const ROLE_META = {
  applicant: {
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #162a45 100%)',
    hoverBorder: '#3B82F6',
    iconBg: 'rgba(59,130,246,0.15)',
    iconColor: '#60A5FA',
    tag: 'Applicant',
    tagBg: 'rgba(59,130,246,0.12)',
    tagColor: '#93C5FD',
  },
  auditor: {
    gradient: 'linear-gradient(135deg, #2d1e5f 0%, #201645 100%)',
    hoverBorder: '#A78BFA',
    iconBg: 'rgba(167,139,250,0.15)',
    iconColor: '#A78BFA',
    tag: 'Auditor',
    tagBg: 'rgba(167,139,250,0.12)',
    tagColor: '#C4B5FD',
  },
  regulator: {
    gradient: 'linear-gradient(135deg, #1a4038 0%, #122d28 100%)',
    hoverBorder: '#34D399',
    iconBg: 'rgba(52,211,153,0.15)',
    iconColor: '#34D399',
    tag: 'Regulator',
    tagBg: 'rgba(52,211,153,0.12)',
    tagColor: '#6EE7B7',
  },
}

const Login: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState<string | null>(null)
  const [hoveredRole, setHoveredRole] = useState<string | null>(null)

  /* ── All original logic preserved ── */
  const handleLogin = async (role: UserRole) => {
    setLoading(role)
    try {
      const response = await getToken(role)
      login(response.access_token)
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
      description: 'Apply for credit and view decisions',
    },
    {
      role: 'auditor' as UserRole,
      icon: Search,
      description: 'Review decisions and verify audit trail',
    },
    {
      role: 'regulator' as UserRole,
      icon: Scale,
      description: 'Monitor fairness and compliance',
    },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;600&display=swap');

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes gridScroll {
          from { background-position: 0 0;    }
          to   { background-position: 60px 60px; }
        }
        @keyframes spinAnim { to { transform: rotate(360deg); } }
        @keyframes pulseGold {
          0%, 100% { opacity: 0.6; transform: scale(1);    }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-8px);  }
        }
        @keyframes shimmerLine {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%);  }
        }

        .login-card-anim { animation: fadeUp 0.5s ease both; }
        .role-card-0     { animation: fadeUp 0.5s 0.15s ease both; opacity: 0; }
        .role-card-1     { animation: fadeUp 0.5s 0.28s ease both; opacity: 0; }
        .role-card-2     { animation: fadeUp 0.5s 0.41s ease both; opacity: 0; }
        .logo-float      { animation: float 4s ease-in-out infinite; }

        .role-btn {
          width: 100%;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: transform 0.22s cubic-bezier(.34,1.56,.64,1),
                      box-shadow 0.22s ease;
          position: relative;
          overflow: hidden;
        }
        .role-btn:hover { transform: translateY(-3px) scale(1.015); }
        .role-btn:active { transform: translateY(0) scale(0.995); }
        .role-btn:disabled { cursor: not-allowed; opacity: 0.7; transform: none; }

        .shimmer-line {
          position: absolute;
          top: 0; left: 0;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
          pointer-events: none;
        }
        .role-btn:hover .shimmer-line {
          animation: shimmerLine 0.6s ease;
        }

        .lang-wrap > * { color: white !important; }
      `}</style>

      {/* ── Full-screen dark background ── */}
      <div style={{
        minHeight: '100vh',
        background: '#060E1C',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"DM Sans", sans-serif',
      }}>

        {/* Moving grid overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(244,185,66,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(244,185,66,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'gridScroll 8s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Ambient glow — left */}
        <div style={{
          position: 'absolute',
          top: '-15%', left: '-10%',
          width: '480px', height: '480px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(244,185,66,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          animation: 'pulseGold 6s ease-in-out infinite',
        }} />

        {/* Ambient glow — right */}
        <div style={{
          position: 'absolute',
          bottom: '-15%', right: '-10%',
          width: '520px', height: '520px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(10,22,40,0) 0%, rgba(244,185,66,0.07) 60%, transparent 80%)',
          pointerEvents: 'none',
        }} />

        {/* Language switcher */}
        <div className="lang-wrap" style={{
          position: 'absolute',
          top: '24px', right: '24px',
          zIndex: 50,
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
          borderRadius: '99px',
          padding: '6px 12px',
          border: '1px solid rgba(255,255,255,0.10)',
        }}>
          <LanguageSwitcher />
        </div>

        {/* ── Main panel ── */}
        <div className="login-card-anim" style={{ width: '100%', maxWidth: '460px' }}>

          {/* Logo lockup */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="logo-float" style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}>
              {/* Shield icon ring */}
              <div style={{
                width: '56px', height: '56px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #F4B942, #E09B1E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(244,185,66,0.35), 0 0 0 1px rgba(244,185,66,0.2)',
              }}>
                <ShieldCheck size={28} color="#0A1628" strokeWidth={2.5} />
              </div>
            </div>

            <h1 style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '28px',
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              margin: '0 0 8px',
            }}>
              XAI Lending
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.42)',
              fontWeight: '500',
              margin: 0,
              letterSpacing: '0.01em',
            }}>
              Explainable AI Credit Decisions
            </p>
          </div>

          {/* Glass card */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '28px',
            padding: '36px 32px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Gold top border accent */}
            <div style={{
              position: 'absolute',
              top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '60%', height: '2px',
              background: 'linear-gradient(90deg, transparent, #F4B942, transparent)',
              borderRadius: '99px',
            }} />

            {/* Heading */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <p style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                margin: '0 0 6px',
              }}>
                SECURE ACCESS PORTAL
              </p>
              <h2 style={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: '18px',
                fontWeight: '700',
                color: '#FFFFFF',
                margin: 0,
                letterSpacing: '-0.01em',
              }}>
                {t('auth.selectRole')}
              </h2>
            </div>

            {/* Divider */}
            <div style={{
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
              marginBottom: '24px',
            }} />

            {/* Role cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roleDetails.map(({ role, icon: Icon, description }, idx) => {
                const meta = ROLE_META[role]
                const isLoading = loading === role
                const isHovered = hoveredRole === role
                const isDisabled = !!loading

                return (
                  <button
                    key={role}
                    className={`role-btn role-card-${idx}`}
                    onClick={() => handleLogin(role)}
                    onMouseEnter={() => setHoveredRole(role)}
                    onMouseLeave={() => setHoveredRole(null)}
                    disabled={isDisabled}
                    style={{
                      background: isHovered
                        ? meta.gradient
                        : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${isHovered ? meta.hoverBorder : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: '16px',
                      padding: '18px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      boxShadow: isHovered
                        ? `0 8px 28px rgba(0,0,0,0.3), 0 0 0 1px ${meta.hoverBorder}22`
                        : '0 2px 8px rgba(0,0,0,0.2)',
                      transition: 'background 0.25s, border-color 0.25s, box-shadow 0.25s',
                    }}
                  >
                    {/* Shimmer sweep on hover */}
                    <div className="shimmer-line" />

                    {/* Icon */}
                    <div style={{
                      width: '48px', height: '48px',
                      borderRadius: '14px',
                      background: isHovered ? meta.iconBg : 'rgba(255,255,255,0.07)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      border: `1px solid ${isHovered ? meta.hoverBorder + '33' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.25s',
                    }}>
                      {isLoading
                        ? <Loader2
                            size={22}
                            color={meta.iconColor}
                            style={{ animation: 'spinAnim 0.8s linear infinite' }}
                          />
                        : <Icon size={22} color={isHovered ? meta.iconColor : 'rgba(255,255,255,0.55)'} />
                      }
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                          fontSize: '15px',
                          fontWeight: '800',
                          color: isHovered ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
                          textTransform: 'capitalize',
                          letterSpacing: '-0.01em',
                          transition: 'color 0.2s',
                        }}>
                          {role}
                        </span>
                        {/* Role tag chip */}
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '99px',
                          background: isHovered ? meta.tagBg : 'rgba(255,255,255,0.06)',
                          color: isHovered ? meta.tagColor : 'rgba(255,255,255,0.3)',
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          border: `1px solid ${isHovered ? meta.hoverBorder + '40' : 'rgba(255,255,255,0.08)'}`,
                          transition: 'all 0.2s',
                        }}>
                          {isLoading ? 'Authenticating…' : 'Access'}
                        </span>
                      </div>
                      <p style={{
                        fontSize: '12px',
                        color: isHovered ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.30)',
                        margin: 0,
                        lineHeight: '1.5',
                        fontWeight: '500',
                        transition: 'color 0.2s',
                      }}>
                        {description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight
                      size={16}
                      style={{
                        color: isHovered ? meta.iconColor : 'rgba(255,255,255,0.15)',
                        transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                    />
                  </button>
                )
              })}
            </div>

            {/* Security note */}
            <div style={{
              marginTop: '24px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(244,185,66,0.06)',
              border: '1px solid rgba(244,185,66,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <ShieldCheck size={14} color="#F4B942" style={{ flexShrink: 0 }} />
              <p style={{
                fontSize: '11px',
                color: 'rgba(255,255,255,0.35)',
                margin: 0,
                fontWeight: '500',
                lineHeight: '1.5',
              }}>
                All sessions are encrypted and logged for compliance auditing.
              </p>
            </div>
          </div>

          {/* Footer */}
          <p style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.18)',
            fontSize: '12px',
            fontWeight: '500',
            marginTop: '28px',
            letterSpacing: '0.01em',
          }}>
            &copy; 2026 Explainable Lending Platform. All Rights Reserved.
          </p>
        </div>
      </div>
    </>
  )
}

export default Login