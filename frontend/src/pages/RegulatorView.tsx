import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { getFairnessMetrics, getDriftReport, exportReport } from '@/lib/api'
import { FairnessMetrics, DriftReport } from '@/types'
import { Scale, Activity, Download, FileJson, FileText as FilePdf, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
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
      <div className="space-y-8">
        {/* Section A: Fairness Metrics */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0A1628] flex items-center gap-2">
              <Scale className="text-[#F4B942]" />
              {t('nav.fairness')}
            </h2>
            <div className="flex gap-2">
              <Button onClick={() => handleExport('pdf')} variant="outline" className="border-[#0A1628] text-[#0A1628] hover:bg-[#0A1628] hover:text-white">
                <FilePdf className="mr-2 h-4 w-4" />
                {t('regulator.export.pdf')}
              </Button>
              <Button onClick={() => handleExport('csv')} variant="outline" className="border-[#0A1628] text-[#0A1628] hover:bg-[#0A1628] hover:text-white">
                <FileJson className="mr-2 h-4 w-4" />
                {t('regulator.export.csv')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {metrics && Object.entries(metrics).map(([attr, m]) => (
              <Card key={attr} className="border-none shadow-lg">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-md font-bold capitalize">{attr.replace('_', ' ')}</CardTitle>
                    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      m.four_fifths_pass ? 'bg-green-100 text-green-700 border-transparent' : 'bg-red-100 text-red-700 border-transparent')}>
                      {m.four_fifths_pass ? 'PASS' : 'FAIL'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>{t('regulator.metrics.demographicParity')}</span>
                      <span>{(m.demographic_parity_difference * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={m.demographic_parity_difference * 100} className="h-2" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>{t('regulator.metrics.equalizedOdds')}</span>
                      <span>{(m.equalized_odds_difference * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={m.equalized_odds_difference * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Section B: Drift Report */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#0A1628] flex items-center gap-2">
            <Activity className="text-[#F4B942]" />
            {t('regulator.drift.title')}
          </h2>
          <Card className="border-none shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-left font-bold">{t('applicant.form.title')}</th>
                      <th className="px-6 py-4 text-left font-bold">Score</th>
                      <th className="px-6 py-4 text-left font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {drift && Object.entries(drift).map(([feature, d]) => (
                      <tr key={feature}>
                        <td className="px-6 py-4 font-medium capitalize">{feature.replace('_', ' ')}</td>
                        <td className="px-6 py-4 font-mono">{d.drift_score.toFixed(4)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {d.drift_detected ? (
                              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-700 border-transparent">
                                <AlertTriangle size={12} className="mr-1" />
                                {t('regulator.drift.critical')}
                              </div>
                            ) : (
                              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-700 border-transparent">
                                <CheckCircle size={12} className="mr-1" />
                                {t('regulator.drift.stable')}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </Layout>
  )
}

export default RegulatorView
