import shap
import pandas as pd
import numpy as np
import joblib
import os

def explain(model, input_df):
    """
    Compute SHAP values for a single-row input DataFrame.
    
    Args:
        model: Trained XGBoost model
        input_df: Single-row DataFrame with correct feature columns
        
    Returns:
        List of dicts sorted by absolute SHAP value descending:
        {feature, value, shap_score, direction}
    """
    # Ensure input is a DataFrame
    if not isinstance(input_df, pd.DataFrame):
        raise ValueError("input_df must be a pandas DataFrame")
    
    if len(input_df) != 1:
        raise ValueError("input_df must contain exactly one row")
    
    # Create SHAP explainer
    explainer = shap.TreeExplainer(model)
    
    # Compute SHAP values
    shap_values = explainer.shap_values(input_df)
    
    # For binary classification, shap_values is a list of two arrays [class0, class1]
    # We want the SHAP values for class 1 (positive class, bad credit)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]
    
    # Get feature names from model or input_df
    feature_names = input_df.columns.tolist()
    
    # Create results list
    results = []
    for i, feature in enumerate(feature_names):
        value = input_df.iloc[0][feature]
        shap_score = shap_values[0][i]  # First (and only) row
        direction = "positive" if shap_score > 0 else "negative"
        
        results.append({
            "feature": feature,
            "value": value,
            "shap_score": float(shap_score),
            "direction": direction
        })
    
    # Sort by absolute SHAP value descending
    results.sort(key=lambda x: abs(x["shap_score"]), reverse=True)
    
    return results

def build_shap_results(feature_names, shap_values, input_dict):
    """
    Build structured SHAP results from raw trainer output.
    
    Args:
        feature_names: List of feature names from the model
        shap_values: Raw SHAP values array from trainer.predict()
        input_dict: Original input dictionary
        
    Returns:
        List of dicts sorted by absolute SHAP value descending:
        {feature, value, shap_score, direction}
    """
    # Create DataFrame from input dict for consistency
    input_df = pd.DataFrame([input_dict])
    
    # Create results list
    results = []
    for i, feature in enumerate(feature_names):
        # Get the value from input_dict, default to 0 if not present
        value = input_dict.get(feature, 0)
        shap_score = float(shap_values[i]) if i < len(shap_values) else 0.0
        direction = "positive" if shap_score > 0 else "negative"
        
        results.append({
            "feature": feature,
            "value": value,
            "shap_score": shap_score,
            "direction": direction
        })
    
    # Sort by absolute SHAP value descending
    results.sort(key=lambda x: abs(x["shap_score"]), reverse=True)
    
    return results

def generate_plain_language(shap_results):
    """
    Convert SHAP results to human-readable strings ranked by magnitude.
    
    Args:
        shap_results: Output from explain() function
        
    Returns:
        List of human-readable strings
    """
    # Feature name mapping dictionary
    FEATURE_LABELS = {
        "duration": "loan duration",
        "credit_amount": "loan amount",
        "age": "applicant age",
        "installment_rate": "installment rate",
        "residence_since": "years at current residence",
        "existing_credits": "number of existing credits",
        "num_dependents": "number of dependents",
        "checking_status_A11": "checking account (< 0 DM)",
        "checking_status_A12": "checking account (0-200 DM)",
        "checking_status_A13": "checking account (> 200 DM)",
        "checking_status_A14": "no checking account",
        "credit_history_A30": "no credits taken",
        "credit_history_A31": "all credits paid back duly",
        "credit_history_A32": "existing credits paid back duly",
        "credit_history_A33": "delay in paying off in the past",
        "credit_history_A34": "critical account",
        "savings_A61": "savings (< 100 DM)",
        "savings_A62": "savings (100-500 DM)",
        "savings_A63": "savings (500-1000 DM)",
        "savings_A64": "savings (> 1000 DM)",
        "savings_A65": "no savings account",
        "employment_A71": "unemployed",
        "employment_A72": "employed < 1 year",
        "employment_A73": "employed 1-4 years",
        "employment_A74": "employed 4-7 years",
        "employment_A75": "employed > 7 years",
        "foreign_worker_A201": "foreign worker status",
        "foreign_worker_A202": "non-foreign worker status",
        "gender_male": "male gender",
        "gender_female": "female gender",
        "age_group__25": "young applicant (under 25)",
        "age_group_25_45": "middle-aged applicant (25-45)",
        "age_group_45_": "senior applicant (over 45)",
        "geography_Region_A": "Region A location",
        "geography_Region_B": "Region B location",
        "geography_Region_C": "Region C location",
        "housing_A151": "renting housing",
        "housing_A152": "owns housing",
        "housing_A153": "free housing",
        "job_A171": "unskilled non-resident job",
        "job_A172": "unskilled resident job",
        "job_A173": "skilled job",
        "job_A174": "highly qualified job",
    }
    
    plain_language = []
    for result in shap_results:
        feature = result["feature"]
        shap_score = result["shap_score"]
        value = result["value"]
        
        # Get readable feature name
        readable_feature = FEATURE_LABELS.get(feature, feature)
        
        # Determine impact magnitude
        abs_score = abs(shap_score)
        if abs_score > 1.0:
            impact = "strongly"
        elif abs_score > 0.5:
            impact = "significantly"
        else:
            impact = "slightly"
        
        # Determine direction and create explanation
        if shap_score > 0:
            # Positive SHAP = increased approval chances = helped
            plain_language.append(
                f"Your {readable_feature} of {value} {impact} helped your approval (score impact: {shap_score:+.2f})"
            )
        else:
            # Negative SHAP = decreased approval chances = hurt
            plain_language.append(
                f"Your {readable_feature} of {value} {impact} hurt your approval chances (score impact: {shap_score:+.2f})"
            )
    
    return plain_language

def actionable_suggestions(shap_results):
    """
    Generate actionable suggestions based on negative SHAP contributors.
    
    Args:
        shap_results: Output from explain() function
        
    Returns:
        List of improvement tip strings
    """
    suggestions = []
    
    # Feature-specific improvement suggestions with plain English names
    improvement_map = {
        'duration': "Consider applying for a shorter loan term",
        'credit_amount': "Consider requesting a smaller loan amount",
        'installment_rate': "Lowering your installment rate may improve your approval chances",
        'num_dependents': "Having fewer dependents may improve your approval chances",
        'checking_status_A11': "Opening a checking account with regular deposits may help",
        'checking_status_A12': "Opening a checking account with regular deposits may help",
        'checking_status_A13': "Opening a checking account with regular deposits may help",
        'checking_status_A14': "Opening a checking account with regular deposits may help",
        'credit_history_A30': "Building a credit history with small, repaid loans may help",
        'credit_history_A31': "Your credit history is already good - maintain it",
        'credit_history_A32': "Your credit history is already good - maintain it",
        'credit_history_A33': "Avoid delays in paying off debts",
        'credit_history_A34': "Improve your account standing with creditors",
        'savings_A61': "Building your savings to over 500 DM may strengthen your application",
        'savings_A62': "Building your savings to over 500 DM may strengthen your application",
        'savings_A63': "Your savings are already good - maintain them",
        'savings_A64': "Your savings are already strong - maintain them",
        'savings_A65': "Opening a savings account may improve your application",
        'employment_A71': "Longer employment history improves approval chances",
        'employment_A72': "Longer employment history improves approval chances",
        'employment_A73': "Your employment history is good - maintain it",
        'employment_A74': "Your employment history is strong - maintain it",
        'employment_A75': "Your employment history is excellent - maintain it",
        'foreign_worker_A201': "Consider applying as a domestic worker if possible",
        'foreign_worker_A202': "Your worker status is favorable - maintain it",
        'housing_A151': "Consider owning property or providing collateral",
        'housing_A152': "Your housing situation is favorable - maintain it",
        'housing_A153': "Your housing situation is favorable - maintain it",
        'job_A171': "Consider seeking skilled or highly qualified employment",
        'job_A172': "Consider seeking skilled or highly qualified employment",
        'job_A173': "Your job is already skilled - maintain it",
        'job_A174': "Your job is highly qualified - maintain it",
    }
    
    # Add suggestions for negative contributors (those that hurt approval chances)
    for result in shap_results:
        if result["shap_score"] < 0:  # Negative SHAP = hurt approval chances
            feature = result["feature"]
            if feature in improvement_map:
                suggestions.append(f"💡 To improve your chances: {improvement_map[feature]}")
    
    # Remove duplicates while preserving order
    seen = set()
    unique_suggestions = []
    for suggestion in suggestions:
        if suggestion not in seen:
            seen.add(suggestion)
            unique_suggestions.append(suggestion)
    
    return unique_suggestions


def generate_enriched_explanations(shap_results, enhanced_features, req):
    """
    Generate enriched plain-language explanations leveraging advanced applicant data.
    
    Args:
        shap_results: SHAP results from model
        enhanced_features: Dict of engineered features
        req: Original prediction request
        
    Returns:
        List of enriched explanation strings
    """
    enriched = []
    
    # Debt-to-income analysis
    dti = enhanced_features.get("dti_ratio")
    if dti is not None:
        if dti < 0.3:
            enriched.append(f"Your debt-to-income ratio of {dti*100:.1f}% is excellent, showing strong capacity to manage additional debt.")
        elif dti < 0.4:
            enriched.append(f"Your debt-to-income ratio of {dti*100:.1f}% is moderate. Consider reducing existing debts before applying.")
        else:
            enriched.append(f"Your debt-to-income ratio of {dti*100:.1f}% is high, which may impact your ability to take on more debt.")
    
    # Emergency fund analysis
    emergency_months = enhanced_features.get("emergency_fund_months")
    if emergency_months is not None:
        if emergency_months >= 6:
            enriched.append(f"You have {emergency_months} months of expenses in savings, providing excellent financial security.")
        elif emergency_months >= 3:
            enriched.append(f"You have {emergency_months} months of expenses covered by savings. Building to 6+ months would strengthen your position.")
        else:
            enriched.append(f"With only {emergency_months} months of expenses in savings, building your emergency fund should be a priority.")
    
    # Credit utilization analysis
    credit_util = enhanced_features.get("credit_utilization")
    if credit_util is not None:
        if credit_util < 30:
            enriched.append(f"Your credit utilization of {credit_util}% is in the healthy range, demonstrating responsible credit management.")
        elif credit_util < 50:
            enriched.append(f"Your credit utilization of {credit_util}% is moderate. Reducing it below 30% could improve your credit profile.")
        else:
            enriched.append(f"Your credit utilization of {credit_util}% is high. Paying down balances could significantly improve your approval chances.")
    
    # Missed payments impact
    missed = enhanced_features.get("missed_payments_count", 0)
    if missed > 0:
        enriched.append(f"Your {missed} missed payment{'s' if missed > 1 else ''} negatively impacts your creditworthiness. Setting up automatic payments can help avoid future issues.")
    elif missed == 0:
        enriched.append("Your clean payment history with no missed payments is a strong positive factor.")
    
    # Education level impact
    edu = enhanced_features.get("education_level")
    if edu:
        edu_map = {
            "phd": "PhD", "masters": "Master's", "bachelors": "Bachelor's",
            "high_school": "High School"
        }
        edu_label = edu_map.get(edu, edu)
        enriched.append(f"Your education level ({edu_label}) demonstrates commitment to personal development and may correlate with income stability.")
    
    # Location-based insights
    city_tier = enhanced_features.get("city_tier")
    if city_tier:
        tier_map = {
            "tier1": "Tier 1 metro", "tier2": "Tier 2 city", "tier3": "Tier 3 city"
        }
        enriched.append(f"Location: {tier_map.get(city_tier, city_tier)} - this factors into regional economic conditions and cost of living.")
    
    # Collateral
    if enhanced_features.get("collateral_available"):
        enriched.append("Collateral availability significantly reduces lender risk and improves approval odds, potentially with better terms.")
    
    # Loan purpose
    purpose = enhanced_features.get("loan_purpose")
    if purpose:
        purpose_map = {
            "debt_consolidation": "Debt consolidation can simplify payments and reduce interest costs",
            "home": "Home improvement loans often have favorable terms",
            "business": "Business loans may require additional documentation",
            "education": "Education loans are viewed as investments in future earning potential"
        }
        if purpose in purpose_map:
            enriched.append(f"Loan purpose ({purpose.replace('_', ' ').title()}): {purpose_map[purpose]}.")
    
    # Income-to-loan ratio
    loan_to_income = req.loan_amount / max(req.income, 1)
    enriched.append(f"Your loan amount represents {loan_to_income*100:.1f}% of your annual income, which is {'reasonable' if loan_to_income < 0.5 else 'elevated'} relative to your earnings.")
    
    # Savings as percentage of loan
    savings = enhanced_features.get("savings_balance", 0)
    if savings > 0 and req.loan_amount > 0:
        savings_pct = (savings / req.loan_amount) * 100
        enriched.append(f"Your savings balance covers {savings_pct:.1f}% of the requested loan amount, providing a {'strong' if savings_pct >= 50 else 'moderate'} buffer.")
    
    return enriched


def generate_enhanced_suggestions(enhanced_features, req):
    """
    Generate enhanced suggestions based on advanced applicant profiling.
    
    Args:
        enhanced_features: Dict of engineered features
        req: Original prediction request
        
    Returns:
        List of enhanced suggestion strings
    """
    suggestions = []
    
    # DTI-based suggestions
    dti = enhanced_features.get("dti_ratio")
    if dti and dti > 0.4:
        suggestions.append("💡 Reduce your debt-to-income ratio by paying down existing debts before reapplying.")
    
    # Emergency fund suggestions
    emergency_months = enhanced_features.get("emergency_fund_months")
    if emergency_months and emergency_months < 3:
        target = max(0, (3 * (req.monthly_expenses or 2000)) - enhanced_features.get("savings_balance", 0))
        suggestions.append(f"💡 Build emergency savings to cover 3-6 months of expenses (target: ${target:,.0f} more).")
    
    # Credit utilization suggestions
    credit_util = enhanced_features.get("credit_utilization")
    if credit_util and credit_util > 30:
        reduction_needed = credit_util - 30
        suggestions.append(f"💡 Reduce credit utilization to below 30% (pay down ~{reduction_needed:.0f}% of balances).")
    
    # Missed payments suggestions
    missed = enhanced_features.get("missed_payments_count", 0)
    if missed > 0:
        suggestions.append("💡 Set up automatic payments or payment reminders to ensure on-time payments going forward.")
    
    # Education-based career suggestions
    edu = enhanced_features.get("education_level")
    if edu in ["high_school", None]:
        suggestions.append("💡 Consider professional development or certification programs to enhance earning potential.")
    
    # Location-based suggestions
    city_tier = enhanced_features.get("city_tier")
    if city_tier == "tier3":
        suggestions.append("💡 Explore remote work opportunities or consider relocation to areas with higher average incomes.")
    
    # Collateral suggestions
    if not enhanced_features.get("collateral_available") and req.loan_amount > 50000:
        suggestions.append("💡 Consider secured loan options or providing collateral for better rates on larger loans.")
    
    # Loan purpose optimization
    purpose = enhanced_features.get("loan_purpose")
    if purpose == "debt_consolidation" and enhanced_features.get("dti_ratio", 0) > 0.4:
        suggestions.append("💡 Debt consolidation could simplify payments, but focus on reducing total debt burden first.")
    
    # Savings rate suggestions
    savings = enhanced_features.get("savings_balance", 0)
    monthly_exp = enhanced_features.get("monthly_expenses", 2000)
    if savings < monthly_exp * 3:
        save_target = (monthly_exp * 3 - savings) / 12
        suggestions.append(f"💡 Aim to save ${save_target:,.0f}/month to build a 3-month emergency fund within a year.")
    
    # Income optimization
    loan_to_income = req.loan_amount / max(req.income, 1)
    if loan_to_income > 0.5:
        suggestions.append("💡 Consider a smaller loan amount or longer term to reduce monthly payment burden.")
    
    # Remove duplicates
    seen = set()
    unique = []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            unique.append(s)
    
    return unique

def main():
    """Test function to verify the explainer works."""
    # Check if model exists
    model_path = "data/model.joblib"
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}. Please train the model first.")
        return
    
    # Load model
    try:
        model_dict = joblib.load(model_path)
        model = model_dict['model']
        feature_names = model_dict['feature_names']
        print(f"Loaded model with {len(feature_names)} features")
    except Exception as e:
        print(f"Error loading model: {e}")
        return
    
    # Create a dummy row with all features set to 0 or appropriate defaults
    # In a real scenario, this would come from actual applicant data
    dummy_data = {}
    for feature in feature_names:
        # Set numeric features to 0, categorical to first category (0 after one-hot)
        dummy_data[feature] = 0
    
    # Create DataFrame
    input_df = pd.DataFrame([dummy_data])
    
    # Explain the prediction
    try:
        shap_results = explain(model, input_df)
        print("\nSHAP Explanation (top 5 features):")
        for i, result in enumerate(shap_results[:5]):
            print(f"{i+1}. {result['feature']}: {result['shap_score']:.4f} ({result['direction']})")
        
        # Generate plain language
        plain_language = generate_plain_language(shap_results)
        print("\nPlain Language Explanations:")
        for i, explanation in enumerate(plain_language[:5]):
            print(f"{i+1}. {explanation}")
        
        # Generate actionable suggestions
        suggestions = actionable_suggestions(shap_results)
        print("\nActionable Suggestions:")
        if suggestions:
            for i, suggestion in enumerate(suggestions[:5]):
                print(f"{i+1}. {suggestion}")
        else:
            print("No actionable suggestions (all features have positive impact)")
            
    except Exception as e:
        print(f"Error during explanation: {e}")

if __name__ == "__main__":
    main()
