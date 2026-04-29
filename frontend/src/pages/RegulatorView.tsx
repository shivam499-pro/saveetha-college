import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getFairnessMetrics, getDriftReport, exportReport } from '@/lib/api'
import { FairnessMetrics, DriftReport } from '@/types'
import {
  Scale, Activity, FileText as FilePdf, FileJson,
  CheckCircle, AlertTriangle, ShieldCheck, TrendingUp,
  Filter, ArrowUpRight, Cpu
} from 'lucide-react'
import Layout from '@/components/Layout'

/* ─────────────────────── Design Tokens ─────────────────────── */
const T = {
  navy:      '#0A1628',
  navyLight: '#162236',
  gold:      '#F4B942',
  goldDim:   'rgba(244,185,66,0.12)',
  white:     '#FFFFFF',
  surface:   '#F8FAFC',
  border:    '#E2E8F0',
  muted:     '#94A3B8',
  mutedDark: '#64748B',
  green:     '#10B981',
  greenBg:   '#ECFDF5',
  greenBdr:  '#A7F3D0',
  red:       '#EF4444',
  redBg:     '#FEF2F2',
  redBdr:    '#FECACA',
}

/* ─────────────────────── Shared Styles ─────────────────────── */
const S = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Inter, sans-serif',
  } as React.CSSProperties,

  sectionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: T.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.12em',
    margin: 0,
  } as React.CSSProperties,

  card: {
    background: T.white,
    borderRadius: '20px',
    boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
    border: `1px solid ${T.border}`,
    overflow: 'hidden',
  } as React.CSSProperties,

  cardHeader: {
    padding: '24px 28px',
    borderBottom: `1px solid ${T.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,

  accentBar: {
    width: '4px', height: '26px',
    background: T.gold,
    borderRadius: '4px',
    flexShrink: 0,
  } as React.CSSProperties,

  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: T.navy,
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    margin: 0,
  } as React.CSSProperties,

  th: {
    padding: '14px 24px',
    textAlign: 'left' as const,
    fontSize: '10px',
    fontWeight: '800',
    color: T.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    background: T.surface,
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  td: {
    padding: '16px 24px',
    borderBottom: `1px solid #F1F5F9`,
    verticalAlign: 'middle' as const,
  } as React.CSSProperties,
}

/* ─────────────────────── Sub-components ─────────────────────── */

const Shimmer: React.FC<{ height?: number; radius?: number }> = ({ height = 120, radius = 20 }) => (
  <div style={{
    height, borderRadius: radius,
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E8EDF5 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  }} />
)

const ProgressBar: React.FC<{ value: number; danger?: boolean; thin?: boolean }> = ({ value, danger, thin }) => (
  <div style={{
    height: thin ? 5 : 7,
    borderRadius: 99,
    background: '#EEF2FF',
    overflow: 'hidden',
    flex: 1,
  }}>
    <div style={{
      height: '100%',
      width: `${Math.min(value, 100)}%`,
      borderRadius: 99,
      background: danger
        ? 'linear-gradient(90deg, #F87171, #EF4444)'
        : 'linear-gradient(90deg, #34D399, #10B981)',
      transition: 'width 0.9s ease',
    }} />
  </div>
)

const StatusPill: React.FC<{ pass: boolean; labels: [string, string] }> = ({ pass, labels }) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    borderRadius: 99,
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    background: pass ? T.greenBg : T.redBg,
    color: pass ? T.green : T.red,
    border: `1px solid ${pass ? T.greenBdr : T.redBdr}`,
  }}>
    {pass ? <CheckCircle size={9} /> : <AlertTriangle size={9} />}
    {pass ? labels[0] : labels[1]}
  </span>
)

const ExportBtn: React.FC<{
  onClick: () => void
  icon: React.ReactNode
  label: string
  primary?: boolean
}> = ({ onClick, icon, label, primary }) => (
  <button
    onClick={onClick}
    className={primary ? 'export-primary' : 'export-outline'}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '11px 22px',
      borderRadius: '12px',
      fontSize: '13px',
      fontWeight: '700',
      cursor: 'pointer',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      transition: 'all 0.2s',
      border: primary ? 'none' : `2px solid ${T.navy}`,
      background: primary ? T.navy : 'white',
      color: primary ? 'white' : T.navy,
      boxShadow: primary ? '0 4px 16px rgba(10,22,40,0.2)' : 'none',
    }}
  >
    {icon}
    {label}
  </button>
)

/* ═══════════════════════════════════════════════════
   RegulatorView — all logic preserved exactly
═══════════════════════════════════════════════════ */
const RegulatorView: React.FC = () => {
  const { t } = useTranslation()
  const [metrics, setMetrics] = useState<FairnessMetrics | null>(null)
  const [drift, setDrift]     = useState<DriftReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [metricsRes, driftRes] = await Promise.all([
        getFairnessMetrics(),
        getDriftReport()
      ])
      setMetrics(metricsRes.data)
      setDrift(driftRes.data)
    } catch (error) {
      console.error('Failed to fetch regulator data', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await exportReport(format)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `compliance_report_${new Date().toISOString().split('T')[0]}.${format}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Export failed', error)
    }
  }

  return (
    <Layout>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .export-primary:hover { background: #162236 !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(10,22,40,0.28) !important; }
        .export-outline:hover { background: ${T.navy} !important; color: white !important; transform: translateY(-1px); }
        .fairness-card:hover  { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.1) !important; }
        .drift-row:hover td   { background: #FAFBFC !important; }
        .flag-btn:hover       { opacity: 0.8; }
      `}</style>

      <div style={{ ...S.page, animation: 'fadeUp 0.4s ease' }}>

        {/* ══════ Page Header ══════ */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap' as const,
          gap: '16px',
          marginBottom: '36px',
        }}>
          {/* Left — title block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px',
              borderRadius: '16px',
              background: T.navy,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(10,22,40,0.22)',
              flexShrink: 0,
            }}>
              <ShieldCheck size={24} color={T.gold} />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '22px',
                fontWeight: '800',
                color: T.navy,
                margin: '0 0 3px',
                letterSpacing: '-0.02em',
              }}>
                Compliance & Fairness
              </h1>
              <p style={{ fontSize: '13px', color: T.muted, margin: 0, fontWeight: '500' }}>
                Monitoring algorithmic bias and data drift
              </p>
            </div>
          </div>

          {/* Right — export buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ExportBtn
              onClick={() => handleExport('pdf')}
              icon={<FilePdf size={15} color={T.gold} />}
              label={t('regulator.export.pdf')}
              primary
            />
            <ExportBtn
              onClick={() => handleExport('csv')}
              icon={<FileJson size={15} />}
              label={t('regulator.export.csv')}
            />
          </div>
        </div>

        {/* ══════ Section A — Fairness Metrics ══════ */}
        <section style={{ marginBottom: '40px' }}>
          <div style={S.sectionLabel}>
            <Scale size={16} color={T.gold} />
            <h3 style={S.sectionTitle}>{t('nav.fairness')}</h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {loading
              ? Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ borderRadius: '20px', overflow: 'hidden' }}>
                    <Shimmer height={260} radius={20} />
                  </div>
                ))
              : metrics && Object.entries(metrics).map(([attr, m]) => {
                  const pass = m.four_fifths_pass
                  const dpBad  = m.demographic_parity_difference > 0.1
                  const eoBad  = m.equalized_odds_difference > 0.1

                  return (
                    <div
                      key={attr}
                      className="fairness-card"
                      style={{
                        ...S.card,
                        borderLeft: `5px solid ${pass ? T.green : T.red}`,
                        transition: 'transform 0.22s, box-shadow 0.22s',
                      }}
                    >
                      {/* Card top */}
                      <div style={{ padding: '24px 24px 0' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '10px',
                        }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '700',
                            color: T.muted,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.1em',
                          }}>
                            Protected Attribute
                          </span>
                          <StatusPill pass={pass} labels={['Compliant', 'Disparate Impact']} />
                        </div>

                        <h4 style={{
                          fontFamily: 'Plus Jakarta Sans, sans-serif',
                          fontSize: '22px',
                          fontWeight: '900',
                          color: T.navy,
                          margin: '0 0 20px',
                          textTransform: 'capitalize' as const,
                          letterSpacing: '-0.02em',
                        }}>
                          {attr.replace('_', ' ')}
                        </h4>
                      </div>

                      {/* Divider */}
                      <div style={{ height: '1px', background: T.border, margin: '0 24px' }} />

                      {/* Metric rows */}
                      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column' as const, gap: '18px' }}>
                        {/* Demographic Parity */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: T.mutedDark, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
                              {t('regulator.metrics.demographicParity')}
                            </span>
                            <span style={{
                              fontSize: '16px',
                              fontWeight: '900',
                              color: dpBad ? T.red : T.navy,
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}>
                              {(m.demographic_parity_difference * 100).toFixed(1)}%
                            </span>
                          </div>
                          <ProgressBar value={m.demographic_parity_difference * 100} danger={dpBad} />
                        </div>

                        {/* Equalized Odds */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: T.mutedDark, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
                              {t('regulator.metrics.equalizedOdds')}
                            </span>
                            <span style={{
                              fontSize: '16px',
                              fontWeight: '900',
                              color: eoBad ? T.red : T.navy,
                              fontFamily: 'Plus Jakarta Sans, sans-serif',
                            }}>
                              {(m.equalized_odds_difference * 100).toFixed(1)}%
                            </span>
                          </div>
                          <ProgressBar value={m.equalized_odds_difference * 100} danger={eoBad} />
                        </div>

                        {/* Threshold note */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          background: pass ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                          border: `1px solid ${pass ? T.greenBdr : T.redBdr}`,
                        }}>
                          {pass
                            ? <CheckCircle size={12} color={T.green} />
                            : <AlertTriangle size={12} color={T.red} />
                          }
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: pass ? T.green : T.red,
                          }}>
                            {pass ? 'Within 80% four-fifths rule threshold' : 'Exceeds 80% four-fifths rule threshold'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        </section>

        {/* ══════ Section B — Drift Report ══════ */}
        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={S.sectionLabel}>
              <Activity size={16} color={T.gold} />
              <h3 style={{ ...S.sectionTitle, margin: 0 }}>{t('regulator.drift.title')}</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={13} color={T.muted} />
              <span style={{ fontSize: '10px', fontWeight: '700', color: T.muted, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                Feature Sensitivity
              </span>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ overflowX: 'auto' as const }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr>
                    {['Model Feature', 'Drift Distribution', 'P-Value / Score', 'Integrity Status'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array(5).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={4} style={{ padding: '12px 24px' }}>
                            <Shimmer height={32} radius={8} />
                          </td>
                        </tr>
                      ))
                    : drift && Object.entries(drift).map(([feature, d]) => (
                        <tr key={feature} className="drift-row" style={{ transition: 'background 0.15s' }}>
                          {/* Feature name */}
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '8px', height: '8px',
                                borderRadius: '50%',
                                background: d.drift_detected ? T.red : T.green,
                                boxShadow: `0 0 0 3px ${d.drift_detected ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`,
                                flexShrink: 0,
                              }} />
                              <span style={{
                                fontSize: '13px',
                                fontWeight: '700',
                                color: T.navy,
                                textTransform: 'capitalize' as const,
                              }}>
                                {feature.replace('_', ' ')}
                              </span>
                            </div>
                          </td>

                          {/* Progress + pct */}
                          <td style={{ ...S.td, minWidth: '220px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <ProgressBar value={d.drift_score * 100} danger={d.drift_detected} thin />
                              <span style={{
                                fontSize: '11px',
                                fontWeight: '800',
                                color: d.drift_detected ? T.red : T.mutedDark,
                                minWidth: '36px',
                                textAlign: 'right' as const,
                              }}>
                                {(d.drift_score * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>

                          {/* Score */}
                          <td style={S.td}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontSize: '12px',
                              fontWeight: '700',
                              color: T.mutedDark,
                              background: T.surface,
                              padding: '3px 10px',
                              borderRadius: '6px',
                              border: `1px solid ${T.border}`,
                            }}>
                              {d.drift_score.toFixed(4)}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={S.td}>
                            <StatusPill
                              pass={!d.drift_detected}
                              labels={[
                                t('regulator.drift.stable').toUpperCase(),
                                t('regulator.drift.critical').toUpperCase(),
                              ]}
                            />
                          </td>
                        </tr>
                      ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ══════ Section C — Intelligence Insights ══════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}>
          {/* Dark insight card */}
          <div style={{
            background: T.navy,
            borderRadius: '20px',
            padding: '32px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(10,22,40,0.22)',
          }}>
            {/* Decorative BG icon */}
            <TrendingUp
              size={96}
              color="rgba(244,185,66,0.08)"
              style={{ position: 'absolute', top: 20, right: 16, pointerEvents: 'none' }}
            />

            {/* Top label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: T.goldDim,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Cpu size={16} color={T.gold} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                Algorithmic Performance
              </span>
            </div>

            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.55)',
              lineHeight: '1.7',
              marginBottom: '28px',
              position: 'relative',
              zIndex: 1,
            }}>
              The current model version (v1.0.4) is operating within the 80% four-fifths rule threshold
              for all protected groups. Drift detection identifies mild variance in 'Credit History' inputs.
            </p>

            {/* Metrics strip */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              position: 'relative',
              zIndex: 1,
            }}>
              <div>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '26px', fontWeight: '900', color: T.gold,
                  letterSpacing: '-0.03em',
                }}>
                  94.2%
                </div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  Accuracy
                </div>
              </div>

              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

              <div>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '26px', fontWeight: '900', color: T.gold,
                  letterSpacing: '-0.03em',
                }}>
                  0.08
                </div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  Gini Coeff
                </div>
              </div>

              <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

              <div>
                <div style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '26px', fontWeight: '900', color: T.gold,
                  letterSpacing: '-0.03em',
                }}>
                  v1.0.4
                </div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                  Model Ver.
                </div>
              </div>
            </div>
          </div>

          {/* Light system health card */}
          <div style={{ ...S.card, padding: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: T.goldDim,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Activity size={18} color={T.gold} />
              </div>
              <div>
                <h4 style={{ ...S.cardTitle, marginBottom: '2px' }}>System Health</h4>
                <p style={{ fontSize: '11px', color: T.muted, margin: 0, fontWeight: '500' }}>
                  Live operational metrics
                </p>
              </div>
            </div>

            {/* Health rows */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
              {[
                { label: 'Audit Log Integrity',  value: '100% SECURE',  valueColor: T.green,      dot: T.green  },
                { label: 'API Response Time',     value: '124ms AVG',    valueColor: T.navy,       dot: '#3B82F6' },
                { label: 'Model Uptime',          value: '99.97%',       valueColor: T.navy,       dot: T.green  },
                { label: 'Anomaly Detection',     value: 'ACTIVE',       valueColor: '#7C3AED',    dot: '#7C3AED' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  background: T.surface,
                  border: `1px solid ${T.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '7px', height: '7px',
                      borderRadius: '50%',
                      background: row.dot,
                      boxShadow: `0 0 0 2px ${row.dot}33`,
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: T.navy }}>{row.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      color: row.valueColor,
                      letterSpacing: '0.04em',
                    }}>
                      {row.value}
                    </span>
                    <ArrowUpRight size={12} color={row.valueColor} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  )
}

export default RegulatorView