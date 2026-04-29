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
