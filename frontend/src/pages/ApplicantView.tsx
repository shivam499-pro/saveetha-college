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
import { Skeleton } from '@/components/ui/skeleton'
import { predict } from '@/lib/api'
import { PredictionRequest, PredictionResponse } from '@/types'
import { CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, RefreshCcw, Info, Lightbulb, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const [showAllExplanations, setShowAllExplanations] = useState(false)

  const { register, handleSubmit, setValue, watch, reset } = useForm<PredictionRequest>({
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
    setShowAllExplanations(false)
    reset()
  }

  const visibleExplanations = showAllExplanations 
    ? result?.explanation 
    : result?.explanation.slice(0, 8)

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-10">
        {!result ? (
          <div className="animate-slideUp">
            <Card className="border-none shadow-xl overflow-hidden rounded-2xl bg-white">
              <div className="h-2 bg-gradient-to-r from-navy to-gold" />
              <CardHeader className="border-b border-gray-50 p-8">
                <div className="flex items-center gap-4">
                  <div className="w-1.5 h-8 bg-gold rounded-full" />
                  <CardTitle className="text-2xl font-bold text-navy tracking-tight font-display">
                    {t('applicant.form.title')}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-10">
                <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-navy ml-1">{t('applicant.form.income')}</Label>
                    <Input 
                      type="number" 
                      className="h-12 rounded-xl border-gray-200 focus:ring-gold focus:border-gold transition-all"
                      {...register('income', { valueAsNumber: true })} 
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-navy ml-1">{t('applicant.form.loanAmount')}</Label>
                    <Input 
                      type="number" 
                      className="h-12 rounded-xl border-gray-200 focus:ring-gold focus:border-gold transition-all"
                      {...register('loan_amount', { valueAsNumber: true })} 
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-navy ml-1">{t('applicant.form.creditHistory')}</Label>
                    <Select onValueChange={(v) => setValue('credit_history', v)} defaultValue={watch('credit_history')}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-gold transition-all">
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
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-navy ml-1">{t('applicant.form.employmentType')}</Label>
                    <Select onValueChange={(v) => setValue('employment_type', v)} defaultValue={watch('employment_type')}>
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 focus:ring-gold transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="salaried">Salaried</SelectItem>
                        <SelectItem value="self_employed">Self Employed</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-navy ml-1">{t('applicant.form.existingLoans')}</Label>
                    <Input 
                      type="number" 
                      className="h-12 rounded-xl border-gray-200 focus:ring-gold focus:border-gold transition-all"
                      {...register('existing_loans', { valueAsNumber: true })} 
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-navy ml-1">{t('applicant.form.duration')}</Label>
                    <Input 
                      type="number" 
                      className="h-12 rounded-xl border-gray-200 focus:ring-gold focus:border-gold transition-all"
                      {...register('duration', { valueAsNumber: true })} 
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-navy ml-1">{t('applicant.form.age')}</Label>
                    <Input 
                      type="number" 
                      className="h-12 rounded-xl border-gray-200 focus:ring-gold focus:border-gold transition-all"
                      {...register('age', { valueAsNumber: true })} 
                    />
                  </div>
                  
                  <div className="md:col-span-2 pt-6">
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-navy text-gold hover:bg-gold hover:text-navy h-14 text-lg font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-navy/10 active:scale-[0.98]"
                    >
                      {loading ? (
                        <div className="flex items-center gap-3">
                          <Loader2 className="animate-spin" />
                          Analyzing your application...
                        </div>
                      ) : t('applicant.form.submit')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-10 animate-slideUp">
            {/* Result Header Card */}
            <div className={cn(
              "p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border-4 overflow-hidden relative",
              result.approved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <div className="absolute top-0 right-0 p-8 opacity-5">
                {result.approved ? <CheckCircle2 size={200} /> : <XCircle size={200} />}
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className={cn(
                  "p-6 rounded-3xl shadow-inner",
                  result.approved ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                )}>
                  {result.approved ? <CheckCircle2 size={48} strokeWidth={2.5} /> : <XCircle size={48} strokeWidth={2.5} />}
                </div>
                <div className="text-center md:text-left">
                  <h2 className={cn(
                    "text-4xl font-black tracking-tighter font-display mb-2",
                    result.approved ? 'text-green-800' : 'text-red-800'
                  )}>
                    {result.approved ? "APPLICATION APPROVED" : "APPLICATION REJECTED"}
                  </h2>
                  <div className="flex items-center justify-center md:justify-start gap-4">
                    <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-current/10">
                      <span className="text-sm font-bold opacity-60 uppercase tracking-widest">{t('applicant.result.confidence')}</span>
                      <span className="text-lg font-black">{(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={handleReset} 
                className="bg-white border-navy text-navy hover:bg-navy hover:text-white rounded-2xl h-14 px-8 font-bold transition-all relative z-10"
              >
                <RefreshCcw className="mr-2 h-5 w-5" />
                {t('applicant.result.applyAgain')}
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Explanation Section */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-xl font-bold text-navy flex items-center gap-3 tracking-tight font-display">
                    <div className="p-2 bg-navy/5 rounded-lg">
                      <Info className="text-gold w-5 h-5" />
                    </div>
                    Why this decision?
                  </h3>
                </div>
                
                <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 space-y-4">
                    {visibleExplanations?.map((exp, i) => {
                      const isPositive = exp.toLowerCase().includes('increase') || exp.toLowerCase().includes('good') || exp.toLowerCase().includes('high')
                      return (
                        <div key={i} className={cn(
                          "flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.01]",
                          isPositive ? "bg-green-50/50" : "bg-red-50/50"
                        )}>
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-2 rounded-xl",
                              isPositive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            )}>
                              {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                            </div>
                            <span className="font-semibold text-navy text-sm md:text-base">{exp}</span>
                          </div>
                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter",
                            isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                          )}>
                            {isPositive ? 'Positive' : 'Negative'}
                          </div>
                        </div>
                      )
                    })}

                    {result.explanation.length > 8 && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setShowAllExplanations(!showAllExplanations)}
                        className="w-full text-navy font-bold hover:bg-navy/5 h-12 rounded-xl"
                      >
                        {showAllExplanations ? 'Show Less' : `Show All ${result.explanation.length} Factors`}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Suggestions Section */}
              <div className="space-y-6">
                {!result.approved && (
                  <>
                    <h3 className="text-xl font-bold text-navy flex items-center gap-3 tracking-tight font-display px-2">
                      <div className="p-2 bg-gold/10 rounded-lg">
                        <Lightbulb className="text-gold w-5 h-5" />
                      </div>
                      Improvement Tips
                    </h3>
                    <Card className="border-none shadow-xl rounded-[2rem] bg-gradient-to-br from-white to-gold/5 border-t-4 border-gold overflow-hidden">
                      <CardContent className="p-8 space-y-6">
                        {result.suggestions.map((sug, i) => (
                          <div key={i} className="flex gap-4 group">
                            <div className="mt-1">
                              <div className="bg-gold/20 p-1 rounded-full group-hover:bg-gold transition-colors">
                                <CheckCircle2 className="text-gold group-hover:text-white" size={14} />
                              </div>
                            </div>
                            <p className="text-sm font-medium text-gray-700 leading-relaxed">{sug}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </>
                )}
                
                {result.approved && (
                  <Card className="border-none shadow-xl rounded-[2rem] bg-navy text-white h-full p-8 flex flex-col justify-center items-center text-center">
                    <div className="p-4 bg-white/10 rounded-3xl mb-6">
                      <CheckCircle2 size={48} className="text-gold" />
                    </div>
                    <h4 className="text-xl font-bold mb-3 font-display">You're all set!</h4>
                    <p className="text-white/60 text-sm leading-relaxed">
                      Our experts will contact you within 24 hours to finalize the loan agreement.
                    </p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-8">
            <Skeleton className="h-20 w-full rounded-[2rem]" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <Skeleton className="lg:col-span-2 h-[500px] rounded-[2rem]" />
              <Skeleton className="h-[500px] rounded-[2rem]" />
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ApplicantView