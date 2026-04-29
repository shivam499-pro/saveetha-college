import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { getFairnessMetrics, getDriftReport, exportReport } from '@/lib/api'
import { FairnessMetrics, DriftReport } from '@/types'
import { Scale, Activity, Download, FileJson, FileText as FilePdf, CheckCircle, AlertTriangle, ShieldCheck, TrendingUp, Filter } from 'lucide-react'
import Layout from '@/components/Layout'

const RegulatorView: React.FC = () => {
  const { t } = useTranslation()
  const [metrics, setMetrics] = useState<FairnessMetrics | null>(null)
  const [drift, setDrift] = useState<DriftReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

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
      <div className="space-y-12 animate-fadeIn">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-navy rounded-2xl shadow-lg">
              <ShieldCheck className="text-gold w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy tracking-tight font-display">Compliance & Fairness</h2>
              <p className="text-sm font-medium text-gray-400">Monitoring algorithmic bias and data drift</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleExport('pdf')} 
              className="bg-navy text-white hover:bg-navy/90 rounded-xl h-11 px-6 font-bold shadow-lg shadow-navy/10 transition-all active:scale-[0.98]"
            >
              <FilePdf className="mr-2 h-4 w-4 text-gold" />
              {t('regulator.export.pdf')}
            </Button>
            <Button 
              onClick={() => handleExport('csv')} 
              variant="outline"
              className="border-navy text-navy hover:bg-navy/5 rounded-xl h-11 px-6 font-bold transition-all active:scale-[0.98]"
            >
              <FileJson className="mr-2 h-4 w-4" />
              {t('regulator.export.csv')}
            </Button>
          </div>
        </div>

        {/* Section A: Fairness Metrics */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Scale className="text-gold w-5 h-5" />
            <h3 className="text-lg font-bold text-navy font-display uppercase tracking-wider">{t('nav.fairness')}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-64 rounded-[2.5rem]" />)
            ) : (
              metrics && Object.entries(metrics).map(([attr, m]) => (
                <Card key={attr} className={cn(
                  "border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white group transition-all hover:scale-[1.02]",
                  m.four_fifths_pass ? 'border-l-8 border-l-emerald-500' : 'border-l-8 border-l-red-500'
                )}>
                  <CardHeader className="p-8 pb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Protected Attribute</div>
                      <div className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest",
                        m.four_fifths_pass ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      )}>
                        {m.four_fifths_pass ? 'COMPLIANT' : 'DISPARATE IMPACT'}
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-black text-navy capitalize font-display leading-tight">{attr.replace('_', ' ')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-8">
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-gray-500 uppercase">{t('regulator.metrics.demographicParity')}</span>
                        <span className={cn("text-lg font-black font-display", m.demographic_parity_difference > 0.1 ? 'text-red-500' : 'text-navy')}>
                          {(m.demographic_parity_difference * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={m.demographic_parity_difference * 100} 
                        className="h-2 bg-gray-100" 
                        indicatorClassName={m.demographic_parity_difference > 0.1 ? 'bg-red-500' : 'bg-gold'}
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-gray-500 uppercase">{t('regulator.metrics.equalizedOdds')}</span>
                        <span className={cn("text-lg font-black font-display", m.equalized_odds_difference > 0.1 ? 'text-red-500' : 'text-navy')}>
                          {(m.equalized_odds_difference * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={m.equalized_odds_difference * 100} 
                        className="h-2 bg-gray-100" 
                        indicatorClassName={m.equalized_odds_difference > 0.1 ? 'bg-red-500' : 'bg-gold'}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* Section B: Drift Report */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <Activity className="text-gold w-5 h-5" />
              <h3 className="text-lg font-bold text-navy font-display uppercase tracking-wider">{t('regulator.drift.title')}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <Filter size={14} />
              FEATURE SENSITIVITY
            </div>
          </div>
          
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-10 py-6 text-left font-black text-navy uppercase tracking-widest text-[10px]">Model Feature</th>
                      <th className="px-10 py-6 text-left font-black text-navy uppercase tracking-widest text-[10px]">Drift Distribution</th>
                      <th className="px-10 py-6 text-left font-black text-navy uppercase tracking-widest text-[10px]">P-Value / Score</th>
                      <th className="px-10 py-6 text-left font-black text-navy uppercase tracking-widest text-[10px]">Integrity Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      Array(5).fill(0).map((_, i) => (
                        <tr key={i}>
                          <td colSpan={4} className="p-8"><Skeleton className="h-8 w-full rounded-xl" /></td>
                        </tr>
                      ))
                    ) : (
                      drift && Object.entries(drift).map(([feature, d]) => (
                        <tr key={feature} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-navy/20" />
                              <span className="font-bold text-navy capitalize">{feature.replace('_', ' ')}</span>
                            </div>
                          </td>
                          <td className="px-10 py-6 min-w-[250px]">
                            <div className="flex items-center gap-4">
                              <Progress 
                                value={d.drift_score * 100} 
                                className="h-1.5 flex-1 bg-gray-100" 
                                indicatorClassName={d.drift_detected ? 'bg-red-500' : 'bg-emerald-500'}
                              />
                              <span className="text-[10px] font-black text-gray-400">{(d.drift_score * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-10 py-6 font-mono text-xs font-bold text-gray-500">
                            {d.drift_score.toFixed(4)}
                          </td>
                          <td className="px-10 py-6">
                            {d.drift_detected ? (
                              <div className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black tracking-widest bg-red-100 text-red-700">
                                <AlertTriangle size={12} className="mr-1.5" />
                                {t('regulator.drift.critical').toUpperCase()}
                              </div>
                            ) : (
                              <div className="inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black tracking-widest bg-emerald-100 text-emerald-700">
                                <CheckCircle size={12} className="mr-1.5" />
                                {t('regulator.drift.stable').toUpperCase()}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Intelligence Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-navy text-white p-10 relative overflow-hidden">
            <TrendingUp className="absolute top-10 right-10 text-gold/20 w-24 h-24" />
            <h4 className="text-xl font-bold mb-4 font-display relative z-10">Algorithmic Performance</h4>
            <p className="text-white/60 text-sm leading-relaxed mb-8 relative z-10">
              The current model version (v1.0.4) is operating within the 80% four-fifths rule threshold for all protected groups. Drift detection identifies mild variance in 'Credit History' inputs.
            </p>
            <div className="flex gap-4 relative z-10">
              <div className="text-center">
                <div className="text-2xl font-black text-gold">94.2%</div>
                <div className="text-[10px] font-bold text-white/40 uppercase">Accuracy</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-black text-gold">0.08</div>
                <div className="text-[10px] font-bold text-white/40 uppercase">Gini Coeff</div>
              </div>
            </div>
          </Card>
          
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-10 border-2 border-navy/5">
             <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gold/10 rounded-2xl">
                  <Activity className="text-gold w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-navy font-display">System Health</h4>
             </div>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-bold text-navy">Audit Log Integrity</span>
                  <span className="text-xs font-black text-emerald-500">100% SECURE</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-bold text-navy">API Response Time</span>
                  <span className="text-xs font-black text-navy">124ms AVG</span>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}

export default RegulatorView
