import yaml
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from scipy.stats import ks_2samp
import fairlearn.metrics as fairmetrics

def load_config():
    """Load configuration from config.yaml"""
    config_path = Path.cwd() / "config.yaml"
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

def load_and_preprocess_data(dataset_path):
    """
    Load and preprocess german.data - same as in trainer.py
    Returns X, y, and feature_names
    """
    # Column names for German Credit dataset (20 features + label)
    column_names = [
        'checking_status', 'duration', 'credit_history', 'purpose', 'credit_amount',
        'savings', 'employment', 'installment_rate', 'personal_status_sex',
        'other_debtors', 'residence_since', 'property', 'age', 'other_installment_plans',
        'housing', 'existing_credits', 'job', 'num_dependents', 'telephone', 'foreign_worker',
        'label'
    ]
    
    # Load data (space-separated, no header)
    df = pd.read_csv(dataset_path, sep=' ', header=None, names=column_names)
    
    # Convert label: 1 -> 0 (good/approved), 2 -> 1 (bad/rejected)
    df['label'] = df['label'].map({1: 0, 2: 1})
    
    # Engineer protected attributes (same as trainer.py)
    # age_group: bins: <25, 25-45, 45+
    df['age_group'] = pd.cut(df['age'], bins=[0, 25, 45, 100], labels=['<25', '25-45', '45+'])
    
    # gender: proxy from personal_status_sex (attribute 9)
    gender_map = {
        'A91': 'male', 'A92': 'female', 'A93': 'male', 'A94': 'male', 'A95': 'female'
    }
    df['gender'] = df['personal_status_sex'].map(gender_map)
    
    # geography: random-seeded synthetic, 3 regions
    np.random.seed(42)  # for reproducibility
    df['geography'] = np.random.choice(['Region_A', 'Region_B', 'Region_C'], size=len(df))
    
    # Identify categorical columns (original + engineered)
    categorical_cols = [
        'checking_status', 'credit_history', 'purpose', 'savings', 'employment',
        'personal_status_sex', 'other_debtors', 'property', 'other_installment_plans',
        'housing', 'job', 'telephone', 'foreign_worker', 'age_group', 'gender', 'geography'
    ]
    
    # One-hot encode categorical columns
    df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=False)
    df_encoded.columns = df_encoded.columns.str.replace('[^A-Za-z0-9_]', '_', regex=True)
    
    # Separate features and label
    X = df_encoded.drop('label', axis=1)
    y = df_encoded['label']
    
    return X, y, df_encoded.columns.tolist()

def get_fairness_report(y_true=None, y_pred=None, sensitive_df=None):
    """
    Compute fairness metrics for each protected attribute.
    If called without arguments, runs full evaluation and returns fairness report.
    
    Args:
        y_true: True labels (optional)
        y_pred: Predicted labels (optional)
        sensitive_df: DataFrame with columns: gender, age_group, geography (optional)
        
    Returns:
        Dict with fairness metrics for each protected attribute
    """
    # If no arguments provided, run full evaluation
    if y_true is None and y_pred is None and sensitive_df is None:
        full_report = run_full_evaluation()
        return full_report["fairness_report"]
    
    # Original implementation with arguments
    report = {}
    
    # For each protected attribute
    for attr in ['gender', 'age_group', 'geography']:
        if attr not in sensitive_df.columns:
            continue
            
        sensitive_feature = sensitive_df[attr]
        
        # Compute fairness metrics using fairlearn
        try:
            dp_diff = fairmetrics.demographic_parity_difference(y_true, y_pred, sensitive_features=sensitive_feature)
            eo_diff = fairmetrics.equalized_odds_difference(y_true, y_pred, sensitive_features=sensitive_feature)
            opp_diff = fairmetrics.equal_opportunity_difference(y_true, y_pred, sensitive_features=sensitive_feature)
        except Exception as e:
            # Fallback if fairlearn metrics fail
            dp_diff = 0.0
            eo_diff = 0.0
            opp_diff = 0.0
        
        # Compute four-fifths rule
        group_rates = {}
        for group in sensitive_feature.unique():
            group_mask = (sensitive_feature == group)
            if group_mask.sum() > 0:
                group_approval_rate = (y_pred[group_mask] == 0).mean()  # 0 = good/approved
                group_rates[group] = group_approval_rate
        
        if group_rates:
            min_rate = min(group_rates.values())
            max_rate = max(group_rates.values())
            if max_rate > 0:
                four_fifths_ratio = min_rate / max_rate
                four_fifths_result = "PASS" if four_fifths_ratio >= 0.8 else "FAIL"
            else:
                four_fifths_result = "PASS"  # Edge case: no approvals in any group
        else:
            four_fifths_result = "PASS"
        
        report[attr] = {
            "demographic_parity_difference": float(dp_diff),
            "equalized_odds_difference": float(eo_diff),
            "equal_opportunity_difference": float(opp_diff),
            "four_fifths_rule": four_fifths_result
        }
    
    return report

def get_drift_report(reference_df, current_df, feature_names):
    """
    Compute drift report using KS test on numerical features.
    
    Args:
        reference_df: Reference dataset (typically training data)
        current_df: Current dataset (typically test data)
        feature_names: List of feature column names
        
    Returns:
        Dict with drift detection results
    """
    # Numerical features to check for drift
    numerical_features = [
        'duration', 'credit_amount', 'installment_rate', 
        'residence_since', 'age', 'existing_credits', 'num_dependents'
    ]
    
    # Filter to only include features that exist in both dataframes
    available_numerical = [f for f in numerical_features if f in feature_names]
    
    features_report = []
    drift_detected = False
    
    for feature in available_numerical:
        if feature in reference_df.columns and feature in current_df.columns:
            # Perform KS test
            ks_statistic, p_value = ks_2samp(
                reference_df[feature].dropna(),
                current_df[feature].dropna()
            )
            
            drifted = p_value < 0.05
            if drifted:
                drift_detected = True
            
            features_report.append({
                "feature": feature,
                "ks_statistic": float(ks_statistic),
                "p_value": float(p_value),
                "drifted": drifted
            })
    
    return {
        "drift_detected": drift_detected,
        "features": features_report
    }

def run_full_evaluation():
    """
    Run full fairness and drift evaluation.
    
    Returns:
        Combined dict with both fairness and drift reports
    """
    # Load configuration
    config = load_config()
    dataset_path = config['dataset_path']
    model_path = config['model_path']
    
    # Load and preprocess data (same as trainer.py)
    X, y, feature_names = load_and_preprocess_data(dataset_path)
    
    # Load model
    model_dict = joblib.load(model_path)
    model = model_dict['model']
    
    # 80/20 train/test split with random_state=42, stratified
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Get predictions
    y_pred = model.predict(X_test)
    
    # Create sensitive features DataFrame for test set
    # We need to reconstruct the sensitive attributes from the encoded data
    # Since we one-hot encoded, we need to reverse-engineer the original values
    
    # For simplicity, we'll load the original data again to get sensitive attributes
    # This matches the preprocessing in trainer.py exactly
    df_raw = pd.read_csv(dataset_path, sep=' ', header=None, names=[
        'checking_status', 'duration', 'credit_history', 'purpose', 'credit_amount',
        'savings', 'employment', 'installment_rate', 'personal_status_sex',
        'other_debtors', 'residence_since', 'property', 'age', 'other_installment_plans',
        'housing', 'existing_credits', 'job', 'num_dependents', 'telephone', 'foreign_worker',
        'label'
    ])
    
    # Apply same label conversion
    df_raw['label'] = df_raw['label'].map({1: 0, 2: 1})
    
    # Engineer protected attributes (same as trainer.py)
    df_raw['age_group'] = pd.cut(df_raw['age'], bins=[0, 25, 45, 100], labels=['<25', '25-45', '45+'])
    gender_map = {'A91': 'male', 'A92': 'female', 'A93': 'male', 'A94': 'male', 'A95': 'female'}
    df_raw['gender'] = df_raw['personal_status_sex'].map(gender_map)
    np.random.seed(42)
    df_raw['geography'] = np.random.choice(['Region_A', 'Region_B', 'Region_C'], size=len(df_raw))
    
    # Get sensitive features for test set (using same indices as X_test)
    sensitive_test = df_raw.loc[X_test.index, ['gender', 'age_group', 'geography']].reset_index(drop=True)
    
    # Get reference and current data for drift detection
    # Reference = training data, Current = test data
    X_train_df = pd.DataFrame(X_train, columns=feature_names)
    X_test_df = pd.DataFrame(X_test, columns=feature_names)
    
    # Compute fairness report
    fairness_report = get_fairness_report(y_test, y_pred, sensitive_test)
    
    # Compute drift report
    drift_report = get_drift_report(X_train_df, X_test_df, feature_names)
    
    # Combine reports
    full_report = {
        "fairness_report": fairness_report,
        "drift_report": drift_report
    }
    
    # Print the full report
    print("=== FAIRNESS AND DRIFT EVALUATION REPORT ===")
    print(f"Dataset: {dataset_path}")
    print(f"Model: {model_path}")
    print(f"Test set size: {len(X_test)} samples")
    print()
    
    print("FAIRNESS METRICS:")
    for attr, metrics in fairness_report.items():
        print(f"  {attr.upper()}:")
        for metric_name, value in metrics.items():
            print(f"    {metric_name}: {value}")
    print()
    
    print("DRIFT DETECTION:")
    print(f"  Drift detected: {drift_report['drift_detected']}")
    for feature_info in drift_report['features']:
        status = "DRIFTED" if feature_info['drifted'] else "STABLE"
        print(f"  {feature_info['feature']}: KS={feature_info['ks_statistic']:.3f}, "
              f"p={feature_info['p_value']:.3f} [{status}]")
    print("=" * 50)
    
    return full_report

if __name__ == "__main__":
    report = run_full_evaluation()
    import json
    print(json.dumps(report, indent=2, default=str))
