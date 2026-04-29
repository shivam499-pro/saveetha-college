import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getDashboardStats, getAuditLog, verifyChain } from '@/lib/api'
import { DashboardStats, AuditEntry } from '@/types'
import {
  LayoutDashboard, FileText, ShieldAlert, CheckCircle2, AlertTriangle,
  Loader2, Users, CheckCircle, XCircle, Zap, RefreshCcw, Shield, Lock
} from 'lucide-react'
import Layout from '@/components/Layout'

/* ─────────────────────────────────────────────
   Design tokens — matches ApplicantView system
───────────────────────────────────────────── */
const TOKEN = {
  navy:      '#0A1628',
  gold:      '#F4B942',
  goldLight: '#FEF3C7',
  white:     '#FFFFFF',
  surface:   '#F8FAFC',
  border:    '#E2E8F0',
  muted:     '#94A3B8',
  green:     '#16A34A',
  greenBg:   '#DCFCE7',
  greenBdr:  '#86EFAC',
  red:       '#DC2626',
  redBg:     '#FEE2E2',
  redBdr:    '#FCA5A5',
  amber:     '#D97706',
  amberBg:   '#FEF3C7',
  amberBdr:  '#FDE68A',
}

const S = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Inter, sans-serif',
  } as React.CSSProperties,

  /* ── Stat Cards ── */
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  } as React.CSSProperties,

  statCard: (accent: string, bg: string): React.CSSProperties => ({
    background: TOKEN.white,
    borderRadius: '20px',
    padding: '24px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
    border: `1px solid ${TOKEN.border}`,
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default',
  }),

  statAccentStripe: (color: string): React.CSSProperties => ({
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '3px',
    background: color,
    borderRadius: '20px 20px 0 0',
  }),

  statIconWrap: (bg: string): React.CSSProperties => ({
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  }),

  statValue: {
    fontSize: '32px',
    fontWeight: '900',
    color: TOKEN.navy,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    letterSpacing: '-0.03em',
    lineHeight: 1,
    marginBottom: '6px',
  } as React.CSSProperties,

  statLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: TOKEN.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },

  /* ── Skeleton ── */
  skeleton: {
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '20px',
    height: '120px',
  } as React.CSSProperties,

  /* ── Tabs ── */
  tabBar: {
    display: 'inline-flex',
    background: TOKEN.white,
    borderRadius: '16px',
    padding: '6px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: `1px solid ${TOKEN.border}`,
    marginBottom: '28px',
    gap: '4px',
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    borderRadius: '12px',
    background: active ? TOKEN.navy : 'transparent',
    color: active ? TOKEN.white : TOKEN.muted,
    fontWeight: '700',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    whiteSpace: 'nowrap' as const,
  }),

  /* ── Main Card ── */
  card: {
    background: TOKEN.white,
    borderRadius: '24px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    overflow: 'hidden',
    border: `1px solid ${TOKEN.border}`,
  } as React.CSSProperties,

  cardHeader: {
    padding: '28px 32px',
    borderBottom: `1px solid ${TOKEN.border}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '16px',
    background: TOKEN.white,
  } as React.CSSProperties,

  cardTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,

  accentBar: {
    width: '4px',
    height: '28px',
    background: TOKEN.gold,
    borderRadius: '4px',
    flexShrink: 0,
  } as React.CSSProperties,

  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: TOKEN.navy,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    margin: 0,
  } as React.CSSProperties,

  /* ── Verify Button ── */
  verifyBtn: (verifying: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 22px',
    borderRadius: '12px',
    background: 'transparent',
    border: `2px solid ${TOKEN.navy}`,
    color: TOKEN.navy,
    fontWeight: '700',
    fontSize: '14px',
    cursor: verifying ? 'not-allowed' : 'pointer',
    opacity: verifying ? 0.6 : 1,
    transition: 'all 0.2s',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  }),

  /* ── Verification Badge ── */
  verifyBadge: (valid: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '700',
    background: valid ? TOKEN.greenBg : TOKEN.redBg,
    color: valid ? TOKEN.green : TOKEN.red,
    border: `1px solid ${valid ? TOKEN.greenBdr : TOKEN.redBdr}`,
  }),

  /* ── Table ── */
  tableWrap: {
    overflowX: 'auto' as const,
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  } as React.CSSProperties,

  th: {
    padding: '14px 28px',
    textAlign: 'left' as const,
    fontSize: '10px',
    fontWeight: '800',
    color: TOKEN.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    background: TOKEN.surface,
    borderBottom: `1px solid ${TOKEN.border}`,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  td: {
    padding: '16px 28px',
    borderBottom: `1px solid #F8FAFC`,
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,

  /* ── Decision Pill ── */
  pill: (approved: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    background: approved ? TOKEN.greenBg : TOKEN.redBg,
    color: approved ? TOKEN.green : TOKEN.red,
    border: `1px solid ${approved ? TOKEN.greenBdr : TOKEN.redBdr}`,
  }),

  /* ── Progress Bar ── */
  progressTrack: {
    height: '6px',
    borderRadius: '99px',
    background: '#EEF2FF',
    overflow: 'hidden',
    marginTop: '6px',
  } as React.CSSProperties,

  progressFill: (pct: number, approved: boolean): React.CSSProperties => ({
    height: '100%',
    width: `${pct}%`,
    borderRadius: '99px',
    background: approved
      ? `linear-gradient(90deg, #34D399, #10B981)`
      : `linear-gradient(90deg, #F87171, #EF4444)`,
    transition: 'width 0.8s ease',
  }),

  /* ── Hash cell ── */
  hashWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  } as React.CSSProperties,

  hashDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4ADE80',
    boxShadow: '0 0 0 3px rgba(74,222,128,0.2)',
    flexShrink: 0,
  } as React.CSSProperties,

  hashText: {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: TOKEN.muted,
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '130px',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  /* ── Empty state ── */
  emptyState: {
    padding: '80px 40px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '16px',
  } as React.CSSProperties,

  emptyIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    background: TOKEN.surface,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  /* ── Anomaly card ── */
  anomalyCard: {
    background: TOKEN.white,
    borderRadius: '24px',
    overflow: 'hidden',
    border: `1px solid ${TOKEN.amberBdr}`,
    boxShadow: `0 4px 24px rgba(217,119,6,0.08)`,
  } as React.CSSProperties,

  anomalyHeader: {
    padding: '24px 32px',
    borderBottom: `1px solid ${TOKEN.amberBdr}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: `linear-gradient(135deg, #FFFBEB, #FEF3C7)`,
  } as React.CSSProperties,

  anomalyIconWrap: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(217,119,6,0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,

  anomalyTh: {
    padding: '14px 28px',
    textAlign: 'left' as const,
    fontSize: '10px',
    fontWeight: '800',
    color: TOKEN.amber,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    background: 'rgba(254,243,199,0.5)',
    borderBottom: `1px solid ${TOKEN.amberBdr}`,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  flagBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '8px',
    background: TOKEN.amberBg,
    border: `1px solid ${TOKEN.amberBdr}`,
    color: TOKEN.amber,
    fontWeight: '700',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  } as React.CSSProperties,
}

/* ── Skeleton Card ── */
const SkeletonCard: React.FC = () => (
  <div style={{
    background: TOKEN.white,
    borderRadius: '20px',
    padding: '24px',
    border: `1px solid ${TOKEN.border}`,
    height: '120px',
    overflow: 'hidden',
    position: 'relative',
  }}>
    <style>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes spinIcon {
        to { transform: rotate(360deg); }
      }
      tr:hover td { background: #FAFBFC; }
    `}</style>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(90deg, #F1F5F9 25%, #E8EDF5 50%, #F1F5F9 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  </div>
)

/* ── Confidence bar ── */
const ConfBar: React.FC<{ value: number; approved: boolean }> = ({ value, approved }) => (
  <div style={{ minWidth: '140px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '10px', fontWeight: '700', color: TOKEN.muted, letterSpacing: '0.06em' }}>
        CONFIDENCE
      </span>
      <span style={{ fontSize: '11px', fontWeight: '800', color: approved ? TOKEN.green : TOKEN.red }}>
        {(value * 100).toFixed(1)}%
      </span>
    </div>
    <div style={S.progressTrack}>
      <div style={S.progressFill(value * 100, approved)} />
    </div>
  </div>
)

/* ═══════════════════════════════════════════
   AuditorView — all logic preserved
═══════════════════════════════════════════ */
const AuditorView: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; broken_at: string | null } | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'anomalies'>('dashboard')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, logsRes] = await Promise.all([
        getDashboardStats(),
        getAuditLog(1, 100)
      ])
      setStats(statsRes.data)
      setLogs(logsRes.data.data)
    } catch (error) {
      console.error('Failed to fetch auditor data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setVerifying(true)
    try {
      const response = await verifyChain()
      setVerificationResult(response.data)
    } catch (error) {
      console.error('Verification failed', error)
    } finally {
      setVerifying(false)
    }
  }

  const statCards = stats ? [
    {
      label: t('auditor.stats.total'),
      value: stats.total,
      icon: Users,
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      stripe: '#3B82F6',
    },
    {
      label: t('auditor.stats.approved'),
      value: stats.approved,
      icon: CheckCircle,
      iconColor: TOKEN.green,
      iconBg: TOKEN.greenBg,
      stripe: TOKEN.green,
    },
    {
      label: t('auditor.stats.rejected'),
      value: stats.rejected,
      icon: XCircle,
      iconColor: TOKEN.red,
      iconBg: TOKEN.redBg,
      stripe: TOKEN.red,
    },
    {
      label: t('auditor.stats.anomalies'),
      value: stats.anomaly_count,
      icon: Zap,
      iconColor: TOKEN.amber,
      iconBg: TOKEN.amberBg,
      stripe: TOKEN.gold,
    },
  ] : []

  const tabs = [
    { id: 'dashboard', label: t('nav.dashboard'),  Icon: LayoutDashboard },
    { id: 'logs',      label: t('nav.auditLog'),    Icon: FileText },
    { id: 'anomalies', label: t('nav.anomalies'),   Icon: ShieldAlert },
  ] as const

  return (
    <Layout>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes spinAnim { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .auditor-tr:hover td { background: #FAFBFC !important; }
        .anomaly-tr:hover td { background: rgba(254,243,199,0.25) !important; }
        .stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.1) !important; }
        .tab-btn:hover { opacity: 0.85; }
        .verify-btn:hover:not(:disabled) { background: ${TOKEN.navy} !important; color: white !important; }
        .flag-btn:hover { opacity: 0.8; }
      `}</style>

      <div style={S.page}>

        {/* ── Stats ── */}
        <div style={S.statsGrid}>
          {loading
            ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            : statCards.map((sc, i) => {
                const Icon = sc.icon
                return (
                  <div
                    key={i}
                    className="stat-card"
                    style={{ ...S.statCard(sc.iconColor, sc.iconBg), transition: 'transform 0.2s, box-shadow 0.2s' }}
                  >
                    <div style={S.statAccentStripe(sc.stripe)} />
                    <div style={{ paddingTop: '8px' }}>
                      <div style={S.statIconWrap(sc.iconBg)}>
                        <Icon size={20} color={sc.iconColor} />
                      </div>
                      <div style={S.statValue}>{sc.value}</div>
                      <div style={S.statLabel}>{sc.label}</div>
                    </div>
                  </div>
                )
              })
          }
        </div>

        {/* ── Tab Bar ── */}
        <div style={S.tabBar}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              className="tab-btn"
              style={S.tab(activeTab === id)}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════ DASHBOARD TAB ══════════════ */}
        {activeTab === 'dashboard' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={S.card}>
              {/* Header */}
              <div style={S.cardHeader}>
                <div style={S.cardTitleRow}>
                  <div style={S.accentBar} />
                  <div>
                    <h2 style={S.cardTitle}>System Integrity & Logs</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: TOKEN.muted, fontWeight: '500' }}>
                      {loading ? '—' : `${logs.length} records loaded`}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' as const }}>
                  {/* Verification result badge */}
                  {verificationResult && (
                    <div style={S.verifyBadge(verificationResult.valid)}>
                      {verificationResult.valid
                        ? <><CheckCircle2 size={15} /> Chain Verified: Secure</>
                        : <><AlertTriangle size={15} /> Broken at {verificationResult.broken_at?.substring(0, 8)}</>
                      }
                    </div>
                  )}

                  {/* Verify button */}
                  <button
                    className="verify-btn"
                    onClick={handleVerify}
                    disabled={verifying}
                    style={S.verifyBtn(verifying)}
                  >
                    {verifying
                      ? <Loader2 size={15} style={{ animation: 'spinAnim 1s linear infinite' }} />
                      : <Lock size={15} />
                    }
                    {t('auditor.actions.verifyChain')}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Reference ID', 'Timestamp', 'Decision', 'Confidence', 'Security Hash'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array(6).fill(0).map((_, i) => (
                          <tr key={i}>
                            <td colSpan={5} style={{ padding: '12px 28px' }}>
                              <div style={{
                                height: '36px', borderRadius: '8px',
                                background: 'linear-gradient(90deg, #F1F5F9 25%, #E8EDF5 50%, #F1F5F9 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite',
                              }} />
                            </td>
                          </tr>
                        ))
                      : logs.map((log) => (
                          <tr key={log.id} className="auditor-tr" style={{ transition: 'background 0.15s' }}>
                            {/* Ref ID */}
                            <td style={S.td}>
                              <span style={{
                                fontFamily: 'monospace',
                                fontSize: '12px',
                                fontWeight: '700',
                                color: TOKEN.navy,
                                background: TOKEN.surface,
                                padding: '3px 10px',
                                borderRadius: '6px',
                                border: `1px solid ${TOKEN.border}`,
                              }}>
                                #{log.id.substring(0, 8)}
                              </span>
                            </td>

                            {/* Timestamp */}
                            <td style={S.td}>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: TOKEN.navy }}>
                                {new Date(log.timestamp).toLocaleDateString()}
                              </div>
                              <div style={{ fontSize: '11px', color: TOKEN.muted, marginTop: '2px' }}>
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </td>

                            {/* Decision */}
                            <td style={S.td}>
                              <div style={S.pill(log.prediction)}>
                                {log.prediction
                                  ? <><CheckCircle2 size={9} /> APPROVED</>
                                  : <><XCircle size={9} /> REJECTED</>
                                }
                              </div>
                            </td>

                            {/* Confidence */}
                            <td style={S.td}>
                              <ConfBar value={log.confidence} approved={log.prediction} />
                            </td>

                            {/* Hash */}
                            <td style={S.td}>
                              <div style={S.hashWrap}>
                                <div style={S.hashDot} />
                                <span style={S.hashText}>{log.current_hash}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ LOGS TAB ══════════════ */}
        {activeTab === 'logs' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={S.card}>
              <div style={S.emptyState}>
                <div style={S.emptyIcon}>
                  <FileText size={30} color={TOKEN.border} />
                </div>
                <div>
                  <h3 style={{ ...S.cardTitle, textAlign: 'center' }}>{t('common.noData')}</h3>
                  <p style={{ color: TOKEN.muted, fontSize: '13px', marginTop: '8px', textAlign: 'center', maxWidth: '340px' }}>
                    Advanced filtering and search for logs will be available in the next security update.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ ANOMALIES TAB ══════════════ */}
        {activeTab === 'anomalies' && (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={S.anomalyCard}>
              {/* Header */}
              <div style={S.anomalyHeader}>
                <div style={S.anomalyIconWrap}>
                  <ShieldAlert size={20} color={TOKEN.amber} />
                </div>
                <div>
                  <h2 style={S.cardTitle}>Identified Anomalies</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: TOKEN.amber, fontWeight: '600' }}>
                    {logs.filter(l => l.confidence < 0.6).length} cases flagged for review
                  </p>
                </div>
              </div>

              {/* Anomaly Table */}
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      {['Anomaly ID', 'Detection Reason', 'Confidence Variance', 'Actions'].map(h => (
                        <th key={h} style={S.anomalyTh}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.filter(l => l.confidence < 0.6).map((log) => (
                      <tr key={log.id} className="anomaly-tr" style={{ transition: 'background 0.15s' }}>
                        {/* Anomaly ID */}
                        <td style={S.td}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: TOKEN.amber,
                            background: TOKEN.amberBg,
                            padding: '3px 10px',
                            borderRadius: '6px',
                            border: `1px solid ${TOKEN.amberBdr}`,
                          }}>
                            #{log.id.substring(0, 12)}
                          </span>
                        </td>

                        {/* Reason */}
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                              background: TOKEN.amberBg, border: `1px solid ${TOKEN.amberBdr}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <AlertTriangle size={13} color={TOKEN.amber} />
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: TOKEN.navy }}>
                                Statistical Deviation Detected
                              </div>
                              <div style={{ fontSize: '11px', color: TOKEN.muted, marginTop: '2px' }}>
                                Confidence below threshold (60%)
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Variance */}
                        <td style={S.td}>
                          <div>
                            <div style={{
                              fontSize: '16px', fontWeight: '900', color: TOKEN.amber,
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}>
                              {(log.confidence * 100).toFixed(1)}%
                            </div>
                            <div style={S.progressTrack}>
                              <div style={{
                                height: '100%',
                                width: `${log.confidence * 100}%`,
                                borderRadius: '99px',
                                background: `linear-gradient(90deg, #FCD34D, #F59E0B)`,
                              }} />
                            </div>
                          </div>
                        </td>

                        {/* Action */}
                        <td style={S.td}>
                          <button className="flag-btn" style={S.flagBtn}>
                            <ShieldAlert size={12} />
                            Flag Review
                          </button>
                        </td>
                      </tr>
                    ))}

                    {logs.filter(l => l.confidence < 0.6).length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <div style={S.emptyState}>
                            <div style={{ ...S.emptyIcon, background: TOKEN.amberBg }}>
                              <Shield size={28} color={TOKEN.amber} />
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{ fontWeight: '700', color: TOKEN.navy, fontSize: '15px' }}>
                                No Anomalies Detected
                              </div>
                              <div style={{ color: TOKEN.muted, fontSize: '13px', marginTop: '6px' }}>
                                All records are within the confidence threshold.
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default AuditorView