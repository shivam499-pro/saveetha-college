import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePredict } from '../hooks/usePredict'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { Alert, AlertDescription } from '../components/ui/alert'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { PredictionRequest } from '../types'

const predictionSchema = z.object({
  annual_income: z.number().min(0, 'Income must be positive'),
  loan_amount: z.number().min(0, 'Loan amount must be positive'),
  credit_history: z.number().min(0).max(850, 'Credit score must be between 0 and 850'),
  employment_type: z.enum(['salaried', 'self_employed', 'unemployed', 'student']),
  existing_loans: z.number().min(0, 'Existing loans must be positive'),
})

type PredictionFormData = z.infer<typeof predictionSchema>

const ApplicantView: React.FC = () => {
  const { t } = useTranslation()
  const [submitted, setSubmitted] = useState(false)
  const predictMutation = usePredict()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<PredictionFormData>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      annual_income: 50000,
      loan_amount: 20000,
      credit_history: 700,
      employment_type: 'salaried',
      existing_loans: 0,
    },
  })

  const onSubmit = async (data: PredictionFormData) => {
    const requestData: PredictionRequest = {
      annual_income: data.annual_income,
      loan_amount: data.loan_amount,
      credit_history: data.credit_history,
      employment_type: data.employment_type,
      existing_loans: data.existing_loans,
    }

    await predictMutation.mutateAsync(requestData)
    setSubmitted(true)
  }

  const handleReset = () => {
    setSubmitted(false)
    predictMutation.reset()
    reset()
  }

  const watchedValues = watch()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{t('applicant.form.title')}</CardTitle>
          <CardDescription>{t('applicant.form.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="annual_income">{t('applicant.form.income')}</Label>
                  <Input
                    id="annual_income"
                    type="number"
                    {...register('annual_income', { valueAsNumber: true })}
                    placeholder="50000"
                  />
                  {errors.annual_income && (
                    <p className="text-sm text-red-500">{errors.annual_income.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loan_amount">{t('applicant.form.loanAmount')}</Label>
                  <Input
                    id="loan_amount"
                    type="number"
                    {...register('loan_amount', { valueAsNumber: true })}
                    placeholder="20000"
                  />
                  {errors.loan_amount && (
                    <p className="text-sm text-red-500">{errors.loan_amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credit_history">{t('applicant.form.creditHistory')}</Label>
                  <Input
                    id="credit_history"
                    type="number"
                    {...register('credit_history', { valueAsNumber: true })}
                    placeholder="700"
                  />
                  {errors.credit_history && (
                    <p className="text-sm text-red-500">{errors.credit_history.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employment_type">{t('applicant.form.employmentType')}</Label>
                  <Select
                    onValueChange={(value) => {
                      const event = {
                        target: { name: 'employment_type', value },
                      } as any
                      register('employment_type').onChange(event)
                    }}
                    defaultValue={watchedValues.employment_type}
                  >
                    <SelectTrigger id="employment_type">
                      <SelectValue placeholder={t('applicant.form.selectEmployment')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salaried">{t('applicant.form.employmentTypes.salaried')}</SelectItem>
                      <SelectItem value="self_employed">{t('applicant.form.employmentTypes.selfEmployed')}</SelectItem>
                      <SelectItem value="unemployed">{t('applicant.form.employmentTypes.unemployed')}</SelectItem>
                      <SelectItem value="student">{t('applicant.form.employmentTypes.student')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="existing_loans">{t('applicant.form.existingLoans')}</Label>
                  <Input
                    id="existing_loans"
                    type="number"
                    {...register('existing_loans', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.existing_loans && (
                    <p className="text-sm text-red-500">{errors.existing_loans.message}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={predictMutation.isPending}>
                  {predictMutation.isPending ? t('applicant.form.submitting') : t('applicant.form.submit')}
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  {t('applicant.form.reset')}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {predictMutation.isPending ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : predictMutation.isError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {t('applicant.result.error')}: {predictMutation.error?.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  <Card className={`border-2 ${
                    predictMutation.data?.prediction === 'approved'
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                  }`}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {predictMutation.data?.prediction === 'approved' ? (
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-600" />
                        )}
                        <div>
                          <CardTitle className="text-xl">
                            {predictMutation.data?.prediction === 'approved'
                              ? t('applicant.result.approved')
                              : t('applicant.result.rejected')}
                          </CardTitle>
                          <CardDescription>
                            {t('applicant.result.confidence')}: {(predictMutation.data?.confidence || 0) * 100}%
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>{t('applicant.result.explanationTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {predictMutation.data?.explanation_factors.map((factor, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{factor.feature}</p>
                            <p className="text-sm text-gray-600">{factor.description}</p>
                          </div>
                          <span className={`font-bold ${
                            factor.impact === 'positive'
                              ? 'text-green-600'
                              : factor.impact === 'negative'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }`}>
                            {factor.impact === 'positive' ? '+' : factor.impact === 'negative' ? '-' : ''}
                            {typeof factor.value === 'number' ? factor.value : factor.value}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {predictMutation.data?.suggestions && predictMutation.data.suggestions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('applicant.result.suggestions')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {predictMutation.data.suggestions.map((suggestion, idx) => (
                          <Alert key={idx} variant={suggestion.type === 'warning' ? 'destructive' : 'default'}>
                            <AlertDescription>{suggestion.message}</AlertDescription>
                          </Alert>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-4">
                    <Button onClick={handleReset}>{t('applicant.result.applyAgain')}</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ApplicantView