import React from "react"
import { useTranslation } from "react-i18next"
import { useAuditLog } from "../hooks/useAuditLog"
import { useFairness } from "../hooks/useFairness"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Alert, AlertDescription } from "../components/ui/alert"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Skeleton } from "../components/ui/skeleton"
import { AlertCircle, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import type { AuditEntry } from "../types"

const AuditorView: React.FC = () => {
  const { t } = useTranslation()
  const { entries, total, page, pageSize, loading, error, fetchPage } = useAuditLog(1, 10)
  const { fairnessMetrics, driftReport, loading: fairnessLoading, error: fairnessError, refetch } = useFairness()

  const handleVerifyChain = async () => {
    // TODO: Implement chain verification
    console.log("Verify chain clicked")
  }

  const handleExport = async () => {
    // TODO: Implement export
    console.log("Export clicked")
  }

  const chartData = entries.map((entry: AuditEntry) => ({
    date: new Date(entry.timestamp).toLocaleDateString(),
    approved: entry.prediction === "approved" ? 1 : 0,
    rejected: entry.prediction === "rejected" ? 1 : 0,
  }))

  const driftData = driftReport?.feature_drift
    ? Object.entries(driftReport.feature_drift).map(([feature, data]) => ({
        feature,
        driftScore: data.drift_score,
        status: data.status,
      }))
    : []

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("auditor.stats.total")}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fairnessLoading ? <Skeleton className="h-8 w-20" /> : total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("auditor.stats.approved")}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {fairnessLoading ? <Skeleton className="h-8 w-20" /> : entries.filter((e: AuditEntry) => e.prediction === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("auditor.stats.rejected")}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {fairnessLoading ? <Skeleton className="h-8 w-20" /> : entries.filter((e: AuditEntry) => e.prediction === "rejected").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("auditor.stats.anomalies")}</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {fairnessLoading ? <Skeleton className="h-8 w-20" /> : driftReport?.feature_drift
                ? Object.values(driftReport.feature_drift).filter((d) => d.status !== "stable").length
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fairness Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>{t("auditor.tabs.fairness")}</CardTitle>
          <CardDescription>{t("auditor.fairness.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {fairnessLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : fairnessError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{fairnessError}</AlertDescription>
            </Alert>
          ) : fairnessMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-4">{t("auditor.metrics.demographicParity")}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t("auditor.metrics.value")}:</span>
                    <span className="font-mono">{fairnessMetrics.demographic_parity.value.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("auditor.metrics.threshold")}:</span>
                    <span className="font-mono">{fairnessMetrics.demographic_parity.threshold}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{t("auditor.status.status")}:</span>
                    {fairnessMetrics.demographic_parity.passes ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("auditor.status.pass")}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {t("auditor.status.fail")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-4">{t("auditor.metrics.equalizedOdds")}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>{t("auditor.metrics.value")}:</span>
                    <span className="font-mono">{fairnessMetrics.equalized_odds.value.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("auditor.metrics.threshold")}:</span>
                    <span className="font-mono">{fairnessMetrics.equalized_odds.threshold}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{t("auditor.status.status")}:</span>
                    {fairnessMetrics.equalized_odds.passes ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("auditor.status.pass")}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {t("auditor.status.fail")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Tabs for Log and Anomalies */}
      <Tabs defaultValue="log" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="log">{t("auditor.tabs.log")}</TabsTrigger>
          <TabsTrigger value="anomalies">{t("auditor.tabs.anomalies")}</TabsTrigger>
        </TabsList>
        <TabsContent value="log">
          <Card>
            <CardHeader>
              <CardTitle>{t("auditor.tabs.log")}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("auditor.table.timestamp")}</TableHead>
                          <TableHead>{t("auditor.table.action")}</TableHead>
                          <TableHead>{t("auditor.table.user")}</TableHead>
                          <TableHead>{t("auditor.table.prediction")}</TableHead>
                          <TableHead>{t("auditor.table.requestId")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry: AuditEntry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{new Date(entry.timestamp).toLocaleString()}</TableCell>
                            <TableCell>{entry.action}</TableCell>
                            <TableCell>{entry.user_id}</TableCell>
                            <TableCell>
                              <span className={entry.prediction === "approved" ? "text-green-600" : "text-red-600"}>
                                {entry.prediction}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{entry.request_id}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <Button onClick={() => fetchPage(page - 1, pageSize)} disabled={page <= 1}>
                      {t("auditor.actions.previous")}
                    </Button>
                    <span className="text-sm text-gray-500">
                      {t("auditor.actions.page")} {page}
                    </span>
                    <Button onClick={() => fetchPage(page + 1, pageSize)} disabled={page * pageSize >= total}>
                      {t("auditor.actions.next")}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="anomalies">
          <Card>
            <CardHeader>
              <CardTitle>{t("auditor.tabs.anomalies")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Button onClick={handleVerifyChain}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("auditor.actions.verifyChain")}
                  </Button>
                  <Button variant="outline" onClick={handleExport}>
                    {t("auditor.actions.export")}
                  </Button>
                </div>
                {driftReport && (
                  <div>
                    <h4 className="font-semibold mb-4">{t("auditor.drift.title")}</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={driftData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="feature" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="driftScore" fill="#F4B942" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AuditorView
