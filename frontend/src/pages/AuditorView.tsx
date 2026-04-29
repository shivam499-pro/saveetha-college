import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { getDashboardStats, getAuditLog, verifyChain } from '@/lib/api'
import { DashboardStats, AuditEntry } from '@/types'
import { LayoutDashboard, FileText, ShieldAlert, CheckCircle2, AlertTriangle, Loader2, Users, CheckCircle, XCircle, Zap } from 'lucide-react'
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

  const statCards = stats ? [
    { label: t('auditor.stats.total'), value: stats.total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('auditor.stats.approved'), value: stats.approved, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('auditor.stats.rejected'), value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: t('auditor.stats.anomalies'), value: stats.anomaly_count, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
  ] : []

  return (
    <Layout>
      <div className="space-y-10 animate-fadeIn">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
          ) : (
            statCards.map((stat, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow rounded-3xl overflow-hidden bg-white group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110 duration-300", stat.bg, stat.color)}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-navy font-display leading-none mb-1">{stat.value}</div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Tabs defaultValue="dashboard" className="w-full space-y-8">
          <TabsList className="inline-flex h-14 items-center justify-center rounded-2xl bg-white p-1.5 shadow-sm border border-gray-100">
            <TabsTrigger value="dashboard" className="rounded-xl px-8 h-full font-bold data-[state=active]:bg-navy data-[state=active]:text-white transition-all">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('nav.dashboard')}
            </TabsTrigger>
            <TabsTrigger value="logs" className="rounded-xl px-8 h-full font-bold data-[state=active]:bg-navy data-[state=active]:text-white transition-all">
              <FileText className="mr-2 h-4 w-4" />
              {t('nav.auditLog')}
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="rounded-xl px-8 h-full font-bold data-[state=active]:bg-navy data-[state=active]:text-white transition-all">
              <ShieldAlert className="mr-2 h-4 w-4" />
              {t('nav.anomalies')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="animate-slideUp">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b border-gray-50 flex flex-row items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-gold rounded-full" />
                  <CardTitle className="text-2xl font-bold text-navy tracking-tight font-display">System Integrity & Logs</CardTitle>
                </div>
                
                <div className="flex items-center gap-4">
                  {verificationResult && (
                    <div className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold animate-fadeIn",
                      verificationResult.valid ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    )}>
                      {verificationResult.valid ? (
                        <><CheckCircle2 size={18} /> Chain Verified: Secure</>
                      ) : (
                        <><AlertTriangle size={18} /> Chain Broken at {verificationResult.broken_at?.substring(0, 8)}</>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={handleVerify} 
                    disabled={verifying}
                    variant="outline"
                    className="rounded-xl h-11 border-navy text-navy font-bold hover:bg-navy hover:text-white transition-all"
                  >
                    {verifying ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    {t('auditor.actions.verifyChain')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50/50">
                      <TableRow className="hover:bg-transparent border-b border-gray-100">
                        <TableHead className="font-black text-navy px-8 py-5 uppercase tracking-widest text-[10px]">Reference ID</TableHead>
                        <TableHead className="font-black text-navy px-8 py-5 uppercase tracking-widest text-[10px]">Timestamp</TableHead>
                        <TableHead className="font-black text-navy px-8 py-5 uppercase tracking-widest text-[10px]">Decision</TableHead>
                        <TableHead className="font-black text-navy px-8 py-5 uppercase tracking-widest text-[10px]">Confidence</TableHead>
                        <TableHead className="font-black text-navy px-8 py-5 uppercase tracking-widest text-[10px]">Security Hash</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array(5).fill(0).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell colSpan={5} className="p-8"><Skeleton className="h-10 w-full rounded-xl" /></TableCell>
                          </TableRow>
                        ))
                      ) : (
                        logs.map((log) => (
                          <TableRow key={log.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                            <TableCell className="px-8 py-5">
                              <span className="font-mono text-xs text-gray-500 font-bold">#{log.id.substring(0, 8)}</span>
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-navy">{new Date(log.timestamp).toLocaleDateString()}</span>
                                <span className="text-[10px] text-gray-400 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              <div className={cn(
                                "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black tracking-widest",
                                log.prediction ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              )}>
                                {log.prediction ? 'APPROVED' : 'REJECTED'}
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-5 min-w-[200px]">
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-black text-gray-400">
                                  <span>PROBABILITY</span>
                                  <span>{(log.confidence * 100).toFixed(1)}%</span>
                                </div>
                                <Progress value={log.confidence * 100} className="h-1.5 bg-gray-100" />
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]">{log.current_hash}</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="animate-slideUp">
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-12 text-center">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto">
                    <FileText size={32} className="text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-navy font-display">{t('common.noData')}</h3>
                  <p className="text-gray-500 text-sm">Advanced filtering and search for logs will be available in the next security update.</p>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="anomalies" className="animate-slideUp">
             <Card className="border-none shadow-xl rounded-[2.5rem] bg-white overflow-hidden border-t-4 border-amber-400">
                <CardHeader className="p-8 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                      <ShieldAlert size={24} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-navy tracking-tight font-display">Identified Anomalies</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                   <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-amber-50/30">
                        <TableRow className="hover:bg-transparent border-b border-amber-100/50">
                          <TableHead className="font-black text-amber-900 px-8 py-5 uppercase tracking-widest text-[10px]">Anomaly ID</TableHead>
                          <TableHead className="font-black text-amber-900 px-8 py-5 uppercase tracking-widest text-[10px]">Detection Reason</TableHead>
                          <TableHead className="font-black text-amber-900 px-8 py-5 uppercase tracking-widest text-[10px]">Confidence Variance</TableHead>
                          <TableHead className="font-black text-amber-900 px-8 py-5 uppercase tracking-widest text-[10px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logs.filter(l => l.confidence < 0.6).map((log) => (
                          <TableRow key={log.id} className="hover:bg-amber-50/20 transition-colors border-b border-amber-50/50">
                            <TableCell className="px-8 py-5">
                              <span className="font-mono text-xs text-amber-700 font-bold">#{log.id.substring(0, 12)}</span>
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span className="text-sm font-bold text-navy">Statistical Deviation Detected</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              <span className="text-amber-700 font-black">{(log.confidence * 100).toFixed(1)}%</span>
                            </TableCell>
                            <TableCell className="px-8 py-5">
                              <Button variant="ghost" size="sm" className="text-amber-700 font-bold hover:bg-amber-100 rounded-lg">Flag Review</Button>
                            </TableCell>
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
