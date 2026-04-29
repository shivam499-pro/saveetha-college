import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { predict } from '@/lib/api'
import { PredictionRequest, PredictionResponse } from '@/types'
import { CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, RefreshCcw, Lightbulb, Loader2, TrendingUp } from 'lucide-react'
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

const S = {
  page: { maxWidth: '900px', margin: '0 auto' } as React.CSSProperties,
  card: {
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    marginBottom: '24px',
  } as React.CSSProperties,
  cardHeader: {
    padding: '28px 32px 20px',
    borderBottom: '1px solid #F1F5F9',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0A1628',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
    margin: 0,
  } as React.CSSProperties,
  accentBar: {
    width: '4px',
    height: '28px',
    background: '#F4B942',
    borderRadius: '4px',
  } as React.CSSProperties,
  cardBody: { padding: '32px' } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  } as React.CSSProperties,
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '8px' } as React.CSSProperties,
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#0A1628',
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  input: {
    height: '46px',
    padding: '0 16px',
    borderRadius: '10px',
    border: '1.5px solid #E2E8F0',
    fontSize: '15px',
    color: '#0A1628',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
    fontFamily: 'Inter, sans-serif',
  } as React.CSSProperties,
  select: {
    height: '46px',
    padding: '0 16px',
    borderRadius: '10px',
    border: '1.5px solid #E2E8F0',
    fontSize: '15px',
    color: '#0A1628',
    outline: 'none',
    width: '100%',
    background: 'white',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
  } as React.CSSProperties,
  submitBtn: {
    width: '100%',
    height: '52px',
    background: '#0A1628',
    color: '#F4B942',
    border: 'none',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '8px',
    transition: 'all 0.2s',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  } as React.CSSProperties,
}

const ApplicantView: React.FC = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [showAll, setShowAll] = useState(false)

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

  const handleReset = () => { setResult(null); setShowAll(false); reset() }
  const visible = showAll ? result?.explanation : result?.explanation?.slice(0, 8)

  return (
    <Layout>
      <div style={S.page}>
        {!result && !loading && (
          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.accentBar} />
              <h2 style={S.cardTitle}>{t('applicant.form.title')}</h2>
            </div>
            <div style={S.cardBody}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div style={S.grid}>
                  {/* Income */}
                  <div style={S.fieldGroup}>
                    <label style={S.label}>{t('applicant.form.income')}</label>
                    <input type="number" style={S.input} {...register('income', { valueAsNumber: true })} />
                  </div>
                  {/* Loan Amount */}
                  <div style={S.fieldGroup}>
                    <label style={S.label}>{t('applicant.form.loanAmount')}</label>
                    <input type="number" style={S.input} {...register('loan_amount', { valueAsNumber: true })} />
                  </div>
                  {/* Credit History */}
                  <div style={S.fieldGroup}>
                    <label style={S.label}>{t('applicant.form.creditHistory')}</label>
                    <select style={S.select} value={watch('credit_history')} onChange={e => setValue('credit_history', e.target.value)}>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  {/* Employment */}
                  <div style={S.fieldGroup}>
                    <label style={S.label}>{t('applicant.form.employmentType')}</label>
                    <select style={S.select} value={watch('employment_type')} onChange={e => setValue('employment_type', e.target.value)}>
                      <option value="salaried">Salaried</option>
                      <option value="self_employed">Self Employed</option>
                      <option value="unemployed">Unemployed</option>
                    </select>
                  </div>
                  {/* Existing Loans */}
                  <div style={S.fieldGroup}>
                    <label style={S.label}>{t('applicant.form.existingLoans')}</label>
                    <input type="number" style={S.input} {...register('existing_loans', { valueAsNumber: true })} />
                  </div>
                  {/* Duration */}
                  <div style={S.fieldGroup}>
                    <label style={S.label}>{t('applicant.form.duration')}</label>
                    <input type="number" style={S.input} {...register('duration', { valueAsNumber: true })} />
                  </div>
                  {/* Age */}
                  <div style={S.fieldGroup}>
                    <label style={S.label}>{t('applicant.form.age')}</label>
                    <input type="number" style={S.input} {...register('age', { valueAsNumber: true })} />
                  </div>
                </div>
                {/* Submit */}
                <div style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
                  <button type="submit" disabled={loading} style={S.submitBtn}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Analyzing...</> : t('applicant.form.submit')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ ...S.card, padding: '60px', textAlign: 'center' }}>
            <Loader2 size={40} style={{ color: '#F4B942', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#0A1628', fontWeight: '600', fontSize: '16px' }}>Analyzing your application...</p>
            <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '8px' }}>Our AI is processing your data</p>
          </div>
        )}

        {result && (
          <div>
            {/* Result Banner */}
            <div style={{
              ...S.card,
              background: result.approved ? 'linear-gradient(135deg, #F0FFF4, #DCFCE7)' : 'linear-gradient(135deg, #FFF5F5, #FEE2E2)',
              border: `2px solid ${result.approved ? '#86EFAC' : '#FCA5A5'}`,
              padding: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap' as const,
              gap: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '50%',
                  background: result.approved ? '#BBF7D0' : '#FECACA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {result.approved
                    ? <CheckCircle2 size={36} color="#16A34A" />
                    : <XCircle size={36} color="#DC2626" />
                  }
                </div>
                <div>
                  <h2 style={{
                    fontSize: '28px', fontWeight: '900', margin: '0 0 8px',
                    color: result.approved ? '#14532D' : '#7F1D1D',
                    fontFamily: 'Plus Jakarta Sans, sans-serif',
                    letterSpacing: '-0.02em',
                  }}>
                    {result.approved ? 'APPLICATION APPROVED' : 'APPLICATION REJECTED'}
                  </h2>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    background: 'white', padding: '6px 14px', borderRadius: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                    <TrendingUp size={14} color="#F4B942" />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#0A1628' }}>
                      Model Confidence: {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleReset}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 24px', borderRadius: '12px',
                  background: 'white', border: '2px solid #0A1628',
                  color: '#0A1628', fontWeight: '700', cursor: 'pointer',
                  fontSize: '14px', transition: 'all 0.2s',
                }}
              >
                <RefreshCcw size={16} />
                {t('applicant.result.applyAgain')}
              </button>
            </div>

            {/* Explanation + Suggestions */}
            <div style={{ display: 'grid', gridTemplateColumns: result.approved ? '1fr' : '2fr 1fr', gap: '24px' }}>
              {/* Explanation */}
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <div style={S.accentBar} />
                  <h3 style={S.cardTitle}>Why this decision?</h3>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' as const, gap: '8px' }}>
                  {visible?.map((exp, i) => {
                    const isPos = exp.toLowerCase().includes('helped') || exp.toLowerCase().includes('positive') || exp.toLowerCase().includes('increase')
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 16px', borderRadius: '10px',
                        background: isPos ? '#F0FFF4' : '#FFF5F5',
                        border: `1px solid ${isPos ? '#BBF7D0' : '#FECACA'}`,
                      }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                          background: isPos ? '#BBF7D0' : '#FECACA',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isPos
                            ? <ArrowUpRight size={16} color="#16A34A" />
                            : <ArrowDownRight size={16} color="#DC2626" />
                          }
                        </div>
                        <span style={{ fontSize: '14px', color: '#1A1A2E', flex: 1 }}>{exp}</span>
                        <span style={{
                          fontSize: '11px', fontWeight: '700', padding: '3px 10px',
                          borderRadius: '20px', textTransform: 'uppercase' as const,
                          background: isPos ? '#BBF7D0' : '#FECACA',
                          color: isPos ? '#14532D' : '#7F1D1D',
                        }}>
                          {isPos ? '▲ Positive' : '▼ Negative'}
                        </span>
                      </div>
                    )
                  })}
                  {result.explanation.length > 8 && (
                    <button
                      onClick={() => setShowAll(!showAll)}
                      style={{
                        marginTop: '8px', padding: '10px', borderRadius: '10px',
                        background: '#F8FAFC', border: '1.5px dashed #CBD5E1',
                        color: '#0A1628', fontWeight: '600', cursor: 'pointer',
                        fontSize: '14px',
                      }}
                    >
                      {showAll ? 'Show Less' : `Show All ${result.explanation.length} Factors`}
                    </button>
                  )}
                </div>
              </div>

              {/* Suggestions */}
              {!result.approved && (
                <div style={{
                  ...S.card,
                  background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
                  border: '2px solid #FDE68A',
                }}>
                  <div style={{ padding: '28px 24px', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Lightbulb size={20} color="#F4B942" />
                    <h3 style={{ ...S.cardTitle, margin: 0 }}>How to Improve</h3>
                  </div>
                  <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column' as const, gap: '12px' }}>
                    {result.suggestions.map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
                          background: '#F4B942', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px',
                        }}>
                          <span style={{ color: 'white', fontSize: '11px', fontWeight: '700' }}>{i + 1}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: '#78350F', lineHeight: '1.6', margin: 0 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.approved && (
                <div style={{
                  ...S.card,
                  background: '#0A1628', color: 'white',
                  padding: '32px', textAlign: 'center' as const,
                  display: 'flex', flexDirection: 'column' as const,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'rgba(244,185,66,0.15)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                  }}>
                    <CheckCircle2 size={32} color="#F4B942" />
                  </div>
                  <h4 style={{ color: 'white', fontWeight: '700', fontSize: '18px', margin: '0 0 8px' }}>
                    You're all set!
                  </h4>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                    Our team will contact you within 24 hours to finalize your loan agreement.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ApplicantView