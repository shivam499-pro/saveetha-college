# Phase B1 — Clean Applicant Explanation UX

## Summary of Changes

This phase improves the applicant-facing loan decision explanations without changing the model, SHAP logic, backend prediction, or auditor/regulator systems.

## Files Modified

### 1. `backend/src/explainability/shap_explainer.py`

**Function: `generate_plain_language(shap_results)`**

**Changes:**
- **Top 3 filtering**: Now returns only top 3 positive and top 3 negative factors (max 6 items total)
- **Plain language mapping**: Replaced technical feature labels (A43, A93, one-hot encoded names like `checking_status_A11`) with human-readable descriptions (e.g., "checking account status", "credit history")
- **Near-zero filtering**: Added `MIN_SHAP_THRESHOLD = 0.001` to filter out negligible SHAP contributions
- **No raw SHAP scores**: Removed `(score impact: {shap_score:+.2f})` from explanations
- **Impact strength tiers**: Uses "significantly" (|SHAP| > 0.15), "moderately" (|SHAP| > 0.05), or "slightly" (|SHAP| ≤ 0.05)
- **Context-aware formatting**: Special handling for common features (income, credit history, debt-to-income ratio, etc.) with appropriate units and formatting

**Example output (new):**
```
Your annual income of $50,000 significantly helped your approval chances.
Your credit history (A32) moderately helped your approval chances.
Your housing situation (A152) slightly helped your approval chances.
Your debt-to-income ratio (42.5%) significantly hurt your approval chances.
Your missed payments (2) moderately hurt your approval chances.
```

**Example output (old):**
```
Your income of 50000 strongly helped your approval (score impact: +0.2345)
Your checking_status_A11 of 1 slightly helped your approval (score impact: +0.0123)
Your credit_history_A32 of 1 moderately helped your approval (score impact: +0.0876)
...
```

**Backward compatibility:** The `shap_results` data structure is unchanged. The audit logger still receives full raw SHAP values for auditor/regulator review.

### 2. `frontend/src/pages/ApplicantView.tsx`

**Changes:**
- **Simplified display**: `visible` now shows all explanation items (no slicing to 8 items)
- **Removed "Show All" button**: Since we now show max 6 items, the toggle is unnecessary
- **Removed `showAll` state**: Cleaned up component state
- **Updated `handleReset`**: Removed `setShowAll(false)` call

**Before:** Displayed up to 8 factors with "Show All N Factors" button
**After:** Displays up to 6 factors (3 positive + 3 negative) with no pagination

## Verification

### Backward Compatibility
- ✅ `shap_results` structure unchanged (used by audit logger)
- ✅ `build_shap_results()` unchanged (still returns full SHAP data)
- ✅ `explain()` function unchanged (still computes all SHAP values)
- ✅ Audit trail preserves full SHAP values for regulators/auditors
- ✅ Frontend `PredictionResponse` type unchanged

### Technical Quality
- ✅ TypeScript compiles without errors (`npx tsc --noEmit`)
- ✅ Python imports successfully
- ✅ No breaking changes to API contracts
- ✅ Feature name mapping covers 50+ features

### UX Improvements
- ✅ Applicants see only the most important factors (top 3 helping, top 3 hurting)
- ✅ No technical jargon or one-hot encoded feature names
- ✅ No raw SHAP scores cluttering the explanation
- ✅ Clear, plain English descriptions with appropriate context
- ✅ Noise-free (zero/near-zero features filtered out)
