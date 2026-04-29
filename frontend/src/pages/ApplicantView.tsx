import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { predict } from '@/lib/api'
import { PredictionRequest, PredictionResponse } from '@/types'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown, ArrowRight, RefreshCcw, FileText } from 'lucide-react'
import Layout from '@/components/Layout'

const formSchema = z.object({
  income: z.number().min(0),
  loan_amount: z.number().min(0),
  credit_history: z.string(),
  employment_type: z.string(),
  existing_loans: z.number().min(0),
  duration: z.number().min(1),
  age: z.number().min(18),
})

const ApplicantView: React.FC = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResponse | null>(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PredictionRequest>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      income: 50000,
      loan_amount: 10000,
      credit_history: 'good',
      employment_type: 'salaried',
      existing_loans: 0,
      duration: 24,
      age: 30,
    }
  })

  const onSubmit = async (data: PredictionRequest) => {
    setLoading(true)
    try {
      const response = await predict(data)
      setResult(response.data)
    } catch (error) {
      console.error('Prediction failed', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    reset()
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {!result ? (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-[#0A1628]">
                {t('applicant.form.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>{t('applicant.form.income')}</Label>
                  <Input type="number" {...register('income', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('applicant.form.loanAmount')}</Label>
                  <Input type="number" {...register('loan_amount', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('applicant.form.creditHistory')}</Label>
                  <Select onValueChange={(v) => setValue('credit_history', v)} defaultValue={watch('credit_history')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('applicant.form.employmentType')}</Label>
                  <Select onValueChange={(v) => setValue('employment_type', v)} defaultValue={watch('employment_type')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salaried">Salaried</SelectItem>
                      <SelectItem value="self_employed">Self Employed</SelectItem>
                      <SelectItem value="unemployed">Unemployed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('applicant.form.existingLoans')}</Label>
                  <Input type="number" {...register('existing_loans', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('applicant.form.duration')}</Label>
                  <Input type="number" {...register('duration', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>{t('applicant.form.age')}</Label>
                  <Input type="number" {...register('age', { valueAsNumber: true })} />
                </div>
                
                <div className="md:col-span-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#0A1628] hover:bg-[#F4B942] hover:text-[#0A1628] py-6 text-lg font-bold transition-all"
                  >
                    {loading ? t('common.loading') : t('applicant.form.submit')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Result Header */}
            <div className={`p-8 rounded-xl shadow-xl flex items-center justify-between ${result.approved ? 'bg-[#F4B942]/10 border-2 border-[#F4B942]' : 'bg-red-50 border-2 border-red-200'}`}>
              <div className="flex items-center gap-4">
                {result.approved ? (
                  <CheckCircle2 className="text-[#F4B942] w-12 h-12" />
                ) : (
                  <XCircle className="text-red-500 w-12 h-12" />
                )}
                <div>
                  <h2 className={`text-2xl font-black ${result.approved ? 'text-[#0A1628]' : 'text-red-700'}`}>
                    {result.approved ? t('applicant.result.approved') : t('applicant.result.rejected')}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium opacity-70">{t('applicant.result.confidence')}:</span>
                    <span className="text-sm font-bold">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={handleReset} className="border-[#0A1628] text-[#0A1628] hover:bg-[#0A1628] hover:text-white">
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t('applicant.result.applyAgain')}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Explanation */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="text-[#F4B942]" />
                    {t('applicant.result.explanation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.explanation.map((exp, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                      <ArrowRight className="text-[#F4B942] mt-1 shrink-0" size={16} />
                      <span>{exp}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Suggestions */}
              {!result.approved && (
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="text-green-500" />
                      {t('applicant.result.suggestions')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.suggestions.map((sug, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                        <TrendingUp className="text-green-500 mt-1 shrink-0" size={16} />
                        <span>{sug}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ApplicantView