import React from "react"
import { useTranslation } from "react-i18next"
import { useFairness } from "../hooks/useFairness"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Alert, AlertDescription } from "../components/ui/alert"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Skeleton } from "../components/ui/skeleton"
import { AlertCircle, CheckCircle2, XCircle, Download } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { FairnessMetrics, DriftReport } from "../types"

const RegulatorView: React.FC = () => {
  const { t } = useTranslation()
  const { fairnessMetrics, driftReport, loading, error, refetch } = useFairness()

  const handleExportPDF = async () => {
    // TODO: Implement PDF export
    console.log("Export PDF clicked")
  }

  const handleExportCSV = async () => {
    // TODO: Implement CSV export
    console.log("Export CSV clicked")
  }

  const getStatusColor = (status: "stable" | "warning" | "critical") => {
    switch (status) {
      case "stable":
        return "text-green-600"
      case "warning":
        return "text-orange-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusIcon = (status: "stable" | "warning" | "critical") => {
    switch (status) {
      case "stable":
        return <CheckCircle2 className="h-4 w-4" />
      case "warning":
        return <AlertCircle className="h-4 w-4" />
      case "critical":
        return <XCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const driftData = driftReport?.feature_drift
    ? Object.entries(driftReport.feature_drift).map(([feature, data]) => ({
        feature,
        driftScore: data.drift_score,
        baseline: data.baseline_mean,
        current: data.current_mean,
      }))
    : []

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Fairness Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{t("regulator.fairness.title")}</CardTitle>
          <CardDescription>{t("regulator.fairness.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : fairnessMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Demographic Parity */}
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">{t("regulator.metrics.demographicParity")}</h4>
                  <div className="text-2xl font-bold mb-2">
                    {(fairnessMetrics.demographic_parity.value * 100).toFixed(1)}%
                  </div>
                  <Progress value={fairnessMetrics.demographic_parity.value * 100} className="h-2" />
                  <div className="flex items-center gap-2 mt-2">
                    {fairnessMetrics.demographic_parity.passes ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("regulator.status.pass")}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {t("regulator.status.fail")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Equalized Odds */}
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">{t("regulator.metrics.equalizedOdds")}</h4>
                  <div className="text-2xl font-bold mb-2">
                    {(fairnessMetrics.equalized_odds.value * 100).toFixed(1)}%
                  </div>
                  <Progress value={fairnessMetrics.equalized_odds.value * 100} className="h-2" />
                  <div className="flex items-center gap-2 mt-2">
                    {fairnessMetrics.equalized_odds.passes ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("regulator.status.pass")}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {t("regulator.status.fail")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Equal Opportunity */}
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">{t("regulator.metrics.equalOpportunity")}</h4>
                  <div className="text-2xl font-bold mb-2">
                    {(fairnessMetrics.equal_opportunity.value * 100).toFixed(1)}%
                  </div>
                  <Progress value={fairnessMetrics.equal_opportunity.value * 100} className="h-2" />
                  <div className="flex items-center gap-2 mt-2">
                    {fairnessMetrics.equal_opportunity.passes ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("regulator.status.pass")}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {t("regulator.status.fail")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Four Fifths Rule */}
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">{t("regulator.metrics.fourFifths")}</h4>
                  <div className="text-2xl font-bold mb-2">
                    {(fairnessMetrics.four_fifths_rule.value * 100).toFixed(1)}%
                  </div>
                  <Progress value={fairnessMetrics.four_fifths_rule.value * 100} className="h-2" />
                  <div className="flex items-center gap-2 mt-2">
                    {fairnessMetrics.four_fifths_rule.passes ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("regulator.status.pass")}
                      </span>
                    ) : (
                      <span className="text-red-600 flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        {t("regulator.status.fail")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Drift Report */}
      <Card>
        <CardHeader>
          <CardTitle>{t("regulator.drift.title")}</CardTitle>
          <CardDescription>{t("regulator.drift.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {driftReport ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-4">{t("regulator.drift.featureDrift")}</h4>
                  <div className="space-y-4">
                    {Object.entries(driftReport.feature_drift).map(([feature, data]) => (
                      <div key={feature} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{feature.replace(/_/g, " ")}</p>
                          <p className="text-sm text-gray-600">
                            {t("regulator.drift.baseline")}: {data.baseline_mean.toFixed(4)} →{" "}
                            {t("regulator.drift.current")}: {data.current_mean.toFixed(4)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(data.status)}
                          <span className={getStatusColor(data.status)}>
                            {t(`regulator.drift.${data.status}`)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-4">{t("regulator.drift.predictionDrift")}</h4>
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{t("regulator.drift.approvalRate")}</p>
                      <p className="text-2xl font-bold mt-1">
                        {(driftReport.prediction_drift.current_approval_rate * 100).toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {t("regulator.drift.baseline")}: {(driftReport.prediction_drift.baseline_approval_rate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{t("regulator.drift.driftScore")}</p>
                      <p className="text-2xl font-bold mt-1">
                        {driftReport.prediction_drift.drift_score.toFixed(4)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(driftReport.prediction_drift.status)}
                        <span className={getStatusColor(driftReport.prediction_drift.status)}>
                          {t(`regulator.drift.${driftReport.prediction_drift.status}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={driftData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="driftScore" stroke="#F4B942" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("regulator.export.title")}</CardTitle>
          <CardDescription>{t("regulator.export.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={handleExportPDF}>
              <Download className="mr-2 h-4 w-4" />
              {t("regulator.export.pdf")}
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              {t("regulator.export.csv")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RegulatorView
