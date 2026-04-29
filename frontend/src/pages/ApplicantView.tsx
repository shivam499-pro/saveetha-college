import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { predict } from '@/lib/api'
import { PredictionRequest, PredictionResponse } from '@/types'
import { CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, RefreshCcw, Lightbulb, Loader2, TrendingUp, Shield, FileText, PiggyBank, Home, GraduationCap, Heart, Building, Landmark, Percent } from 'lucide-react'
import Layout from '@/components/Layout'

const formSchemaBasic = z.object({
  income: z.number().min(0, 'Income must be positive'),
  loan_amount: z.number().min(0, 'Loan amount must be positive'),
  credit_history: z.string().min(1, 'Credit history is required'),
  employment_type: z.string().min(1, 'Employment type is required'),
  existing_loans: z.number().min(0, 'Existing loans must be non-negative'),
  duration: z.number().min(1, 'Duration must be at least 1 month'),
  age: z.number().min(18, 'Applicant must be at least 18 years old'),
  application_mode: z.enum(['basic', 'advanced']).default('basic'),
})

const formSchemaAdvanced = formSchemaBasic.extend({
  monthly_expenses: z.number().min(0, 'Monthly expenses must be non-negative').optional(),
  existing_emi: z.number().min(0, 'Existing EMI must be non-negative').optional(),
  savings_balance: z.number().min(0, 'Savings balance must be non-negative').optional(),
  credit_utilization: z.number().min(0).max(100, 'Credit utilization must be between 0 and 100').optional(),
  missed_payments_count: z.number().min(0, 'Missed payments must be non-negative').optional(),
  education_level: z.string().optional(),
  marital_status: z.string().optional(),
  dependents: z.number().min(0, 'Dependents must be non-negative').optional(),
  residence_type: z.string().optional(),
  city_tier: z.string().optional(),
  loan_purpose: z.string().optional(),
  collateral_available: z.boolean().optional(),
  requested_interest_preference: z.string().optional(),
})

const S = {
  page: { maxWidth: '1000px', margin: '0 auto' } as React.CSSProperties,
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
  fieldGroup: { display: 'flex', flexDirection: 'column' as const, gap: '8px' } as React.CSSProperties,
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
  checkbox: {
    width: '18px',
    height: '18px',
    accentColor: '#F4B942',
    cursor: 'pointer',
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
  modeToggle: {
    display: 'flex',
    gap: '8px',
    background: '#F8FAFC',
    padding: '4px',
    borderRadius: '12px',
    width: 'fit-content',
  } as React.CSSProperties,
  modeButton: (active: boolean) => ({
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: active ? '#0A1628' : 'transparent',
    color: active ? '#F4B942' : '#64748B',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  } as React.CSSProperties),
  section: {
    background: '#F8FAFC',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '16px',
    border: '1px solid #E2E8F0',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0A1628',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'Plus Jakarta Sans, sans-serif',
  } as React.CSSProperties,
  errorText: {
    fontSize: '12px',
    color: '#DC2626',
    marginTop: '4px',
  } as React.CSSProperties,
}

const ApplicantView: React.FC = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [mode, setMode] = useState<'basic' | 'advanced'>('basic')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PredictionRequest>({
    resolver: zodResolver(mode === 'basic' ? formSchemaBasic : formSchemaAdvanced),
    defaultValues: {
      income: 50000,
      loan_amount: 10000,
      credit_history: 'good',
      employment_type: 'salaried',
      existing_loans: 0,
      duration: 24,
      age: 30,
      application_mode: 'basic',
      monthly_expenses: 2000,
      existing_emi: 0,
      savings_balance: 10000,
      credit_utilization: 30,
      missed_payments_count: 0,
      education_level: 'bachelors',
      marital_status: 'single',
      dependents: 0,
      residence_type: 'owned',
      city_tier: 'tier1',
      loan_purpose: 'personal',
      collateral_available: false,
      requested_interest_preference: 'standard',
    },
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

  const handleModeSwitch = (newMode: 'basic' | 'advanced') => {
    setMode(newMode)
    setValue('application_mode', newMode)
  }

  const renderBasicFields = () => (
    <>
      {/* Income */}
      <div style={S.fieldGroup}>
        <label style={S.label}>Annual Income ($)</label>
        <input type="number" style={S.input} {...register('income', { valueAsNumber: true })} />
        {errors.income && <span style={S.errorText}>{errors.income.message}</span>}
      </div>
      {/* Loan Amount */}
      <div style={S.fieldGroup}>
        <label style={S.label}>Loan Amount ($)</label>
        <input type="number" style={S.input} {...register('loan_amount', { valueAsNumber: true })} />
        {errors.loan_amount && <span style={S.errorText}>{errors.loan_amount.message}</span>}
      </div>
      {/* Credit History */}
      <div style={S.fieldGroup}>
        <label style={S.label}>Credit History</label>
        <select style={S.select} value={watch('credit_history')} onChange={e => setValue('credit_history', e.target.value)}>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select>
      </div>
      {/* Employment */}
      <div style={S.fieldGroup}>
        <label style={S.label}>Employment Type</label>
        <select style={S.select} value={watch('employment_type')} onChange={e => setValue('employment_type', e.target.value)}>
          <option value="salaried">Salaried</option>
          <option value="self_employed">Self Employed</option>
          <option value="unemployed">Unemployed</option>
        </select>
      </div>
      {/* Existing Loans */}
      <div style={S.fieldGroup}>
        <label style={S.label}>Existing Loans</label>
        <input type="number" style={S.input} {...register('existing_loans', { valueAsNumber: true })} />
        {errors.existing_loans && <span style={S.errorText}>{errors.existing_loans.message}</span>}
      </div>
      {/* Duration */}
      <div style={S.fieldGroup}>
        <label style={S.label}>Duration (months)</label>
        <input type="number" style={S.input} {...register('duration', { valueAsNumber: true })} />
        {errors.duration && <span style={S.errorText}>{errors.duration.message}</span>}
      </div>
      {/* Age */}
      <div style={S.fieldGroup}>
        <label style={S.label}>Age</label>
        <input type="number" style={S.input} {...register('age', { valueAsNumber: true })} />
        {errors.age && <span style={S.errorText}>{errors.age.message}</span>}
      </div>
    </>
  )

  const renderAdvancedFields = () => (
    <>
      {/* Financial Section */}
      <div style={S.section}>
        <h4 style={S.sectionTitle}><PiggyBank size={18} /> Financial Details</h4>
        <div style={{ ...S.grid, gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Monthly Expenses ($)</label>
            <input type="number" style={S.input} {...register('monthly_expenses', { valueAsNumber: true })} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Existing EMI ($)</label>
            <input type="number" style={S.input} {...register('existing_emi', { valueAsNumber: true })} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Savings Balance ($)</label>
            <input type="number" style={S.input} {...register('savings_balance', { valueAsNumber: true })} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Credit Utilization (%)</label>
            <input type="number" style={S.input} {...register('credit_utilization', { valueAsNumber: true })} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Missed Payments Count</label>
            <input type="number" style={S.input} {...register('missed_payments_count', { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      {/* Personal Section */}
      <div style={S.section}>
        <h4 style={S.sectionTitle}><Heart size={18} /> Personal Information</h4>
        <div style={{ ...S.grid, gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Education Level</label>
            <select style={S.select} value={watch('education_level')} onChange={e => setValue('education_level', e.target.value)}>
              <option value="">Select...</option>
              <option value="high_school">High School</option>
              <option value="bachelors">Bachelor's</option>
              <option value="masters">Master's</option>
              <option value="phd">PhD</option>
            </select>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Marital Status</label>
            <select style={S.select} value={watch('marital_status')} onChange={e => setValue('marital_status', e.target.value)}>
              <option value="">Select...</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
            </select>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Dependents</label>
            <input type="number" style={S.input} {...register('dependents', { valueAsNumber: true })} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Residence Type</label>
            <select style={S.select} value={watch('residence_type')} onChange={e => setValue('residence_type', e.target.value)}>
              <option value="">Select...</option>
              <option value="owned">Owned</option>
              <option value="rented">Rented</option>
              <option value="mortgaged">Mortgaged</option>
            </select>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>City Tier</label>
            <select style={S.select} value={watch('city_tier')} onChange={e => setValue('city_tier', e.target.value)}>
              <option value="">Select...</option>
              <option value="tier1">Tier 1 (Metro)</option>
              <option value="tier2">Tier 2</option>
              <option value="tier3">Tier 3</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loan Context Section */}
      <div style={S.section}>
        <h4 style={S.sectionTitle}><Landmark size={18} /> Loan Context</h4>
        <div style={{ ...S.grid, gridTemplateColumns: '1fr 1fr' }}>
          <div style={S.fieldGroup}>
            <label style={S.label}>Loan Purpose</label>
            <select style={S.select} value={watch('loan_purpose')} onChange={e => setValue('loan_purpose', e.target.value)}>
              <option value="">Select...</option>
              <option value="personal">Personal</option>
              <option value="home">Home</option>
              <option value="auto">Auto</option>
              <option value="education">Education</option>
              <option value="business">Business</option>
              <option value="debt_consolidation">Debt Consolidation</option>
            </select>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.label}>Interest Rate Preference</label>
            <select style={S.select} value={watch('requested_interest_preference')} onChange={e => setValue('requested_interest_preference', e.target.value)}>
              <option value="">Select...</option>
              <option value="fixed">Fixed Rate</option>
              <option value="variable">Variable Rate</option>
              <option value="standard">Standard Rate</option>
            </select>
          </div>
          <div style={{ ...S.fieldGroup, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input type="checkbox" style={S.checkbox} {...register('collateral_available')} />
            <label style={{ ...S.label, margin: 0, cursor: 'pointer' }}>
              <Shield size={16} style={{ marginRight: '6px' }} />
              Collateral Available
            </label>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <Layout>
      <div style={S.page}>
        {!result && !loading && (
          <div style={S.card}>
            <div style={S.cardHeader}>
              <div style={S.accentBar} />
              <h2 style={S.cardTitle}>{t('applicant.form.title')}</h2>
              <div style={{ marginLeft: 'auto' }}>
                <div style={S.modeToggle}>
                  <button
                    style={S.modeButton(mode === 'basic')}
                    onClick={() => handleModeSwitch('basic')}
                  >
                    <FileText size={16} />
                    Basic Check
                  </button>
                  <button
                    style={S.modeButton(mode === 'advanced')}
                    onClick={() => handleModeSwitch('advanced')}
                  >
                    <Shield size={16} />
                    Advanced Underwriting
                  </button>
                </div>
              </div>
            </div>
            <div style={S.cardBody}>
              <form onSubmit={handleSubmit(onSubmit)}>
                {mode === 'basic' && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={S.grid}>
                      {renderBasicFields()}
                    </div>
                  </div>
                )}
                {mode === 'advanced' && (
                  <div style={{ marginBottom: '20px' }}>
                    {renderBasicFields()}
                    {renderAdvancedFields()}
                  </div>
                )}
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
                  {result.application_mode && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      marginLeft: '12px', fontSize: '12px', color: '#6B7280',
                      fontWeight: '500',
                    }}>
                      <Shield size={14} />
                      {result.application_mode === 'advanced' ? 'Advanced Underwriting' : 'Basic Check'}
                    </span>
                  )}
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
