import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { getDashboardStats, getAuditLog, verifyChain } from '@/lib/api'
import { DashboardStats, AuditEntry } from '@/types'
import { LayoutDashboard, FileText, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import Layout from '@/components/Layout'

const AuditorView: React.FC = () => {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{ valid: boolean; broken_at: string | null } | null>(null)

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

  return (
    <Layout>
      <div className="space-y-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-[#0A1628]/5 p-1 h-14">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('nav.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <FileText className="mr-2 h-4 w-4" />
              {t('nav.auditLog')}
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="data-[state=active]:bg-white data-[state=active]:shadow-md">
              <ShieldAlert className="mr-2 h-4 w-4" />
              {t('nav.anomalies')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: t('auditor.stats.total'), value: stats.total, color: 'text-[#0A1628]' },
                  { label: t('auditor.stats.approved'), value: stats.approved, color: 'text-green-600' },
                  { label: t('auditor.stats.rejected'), value: stats.rejected, color: 'text-red-600' },
                  { label: t('auditor.stats.anomalies'), value: stats.anomaly_count, color: 'text-[#F4B942]' },
                ].map((s, i) => (
                  <Card key={i} className="border-none shadow-md overflow-hidden">
                    <div className="h-1 bg-[#0A1628]/10" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-500 uppercase">{s.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            )}

            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t('nav.auditLog')}</CardTitle>
                <div className="flex items-center gap-4">
                  {verificationResult && (
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${verificationResult.valid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {verificationResult.valid ? (
                        <><CheckCircle2 size={16} /> {t('auditor.status.intact')}</>
                      ) : (
                        <><AlertTriangle size={16} /> {t('auditor.status.broken', { id: verificationResult.broken_at })}</>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={handleVerify} 
                    disabled={verifying}
                    className="bg-[#0A1628] hover:bg-[#F4B942] hover:text-[#0A1628]"
                  >
                    {verifying ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    {t('auditor.actions.verifyChain')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-bold">ID</TableHead>
                        <TableHead className="font-bold">Time</TableHead>
                        <TableHead className="font-bold">Decision</TableHead>
                        <TableHead className="font-bold">Confidence</TableHead>
                        <TableHead className="font-bold">Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">{log.id.substring(0, 8)}...</TableCell>
                          <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", 
                              log.prediction ? 'bg-green-100 text-green-700 border-transparent' : 'bg-red-100 text-red-700 border-transparent')}>
                              {log.prediction ? 'APPROVED' : 'REJECTED'}
                            </div>
                          </TableCell>
                          <TableCell>{(log.confidence * 100).toFixed(1)}%</TableCell>
                          <TableCell className="font-mono text-[10px] text-gray-400">
                            {log.current_hash?.substring(0, 16)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs">
             <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>{t('nav.auditLog')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Reuse table logic from above if needed or add unique filters */}
                  <p className="text-gray-500">{t('common.noData')}</p>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="anomalies">
             <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <ShieldAlert />
                    {t('nav.anomalies')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="rounded-md border">
                    <Table>
                      <TableHeader className="bg-red-50">
                        <TableRow>
                          <TableHead className="font-bold">ID</TableHead>
                          <TableHead className="font-bold">Reason</TableHead>
                          <TableHead className="font-bold">Confidence</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.filter(l => l.confidence < 0.6).map((log) => (
                          <TableRow key={log.id} className="bg-red-50/20">
                            <TableCell className="font-mono text-xs">{log.id}</TableCell>
                            <TableCell className="text-red-700 font-medium">Low Confidence Deviation</TableCell>
                            <TableCell className="text-red-700 font-bold">{(log.confidence * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default AuditorView
