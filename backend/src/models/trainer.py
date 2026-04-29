import yaml
import pandas as pd
import numpy as np
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
import os
from pathlib import Path

def load_config(config_path=None):
    if config_path is None:
        config_path = Path.cwd() / "config.yaml"
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
    return config

def load_model(model_path=None):
    """Load the trained model from disk"""
    if model_path is None:
        config = load_config()
        model_path = config['model_path']
    model_dict = joblib.load(model_path)
    return model_dict['model'], model_dict['feature_names']

def load_and_preprocess_data(dataset_path):
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
    
    # Engineer protected attributes
    # age_group: bins: <25, 25-45, 45+
    df['age_group'] = pd.cut(df['age'], bins=[0, 25, 45, 100], labels=['<25', '25-45', '45+'])
    
    # gender: proxy from personal_status_sex (attribute 9)
    # Mapping: A91: male, A92: female, A93: male, A94: male, A95: female
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

def train_model(X, y):
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Calculate scale_pos_weight for class imbalance
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1
    
    # Initialize and train XGBoost
    model = XGBClassifier(
        scale_pos_weight=scale_pos_weight,
        random_state=42,
        eval_metric='logloss',
        use_label_encoder=False
    )
    model.fit(X_train, y_train)
    
    # Predict and evaluate
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = model.predict(X_test)
    
    auc = roc_auc_score(y_test, y_pred_proba)
    accuracy = accuracy_score(y_test, y_pred)
    
    # Check AUC constraint
    if auc < 0.70:
        raise ValueError(f"Model AUC ({auc:.4f}) is below required threshold of 0.70")
    
    return model, auc, accuracy, X_train.columns.tolist()

def predict(input_dict):
    """
    Make a prediction on a single input dictionary.
    
    Args:
        input_dict: Dictionary with raw feature values (same format as training data)
        
    Returns:
        Dict with approved (bool), confidence (float), feature_names (list), shap_values (list)
    """
    # Load model and feature names
    model, feature_names = load_model()
    
    # Load and preprocess data to get the same preprocessing pipeline
    config = load_config()
    dataset_path = config['dataset_path']
    X, y, all_feature_names = load_and_preprocess_data(dataset_path)
    
    # Convert input dict to DataFrame with same columns as training data
    input_df = pd.DataFrame([input_dict])
    
    # Apply same preprocessing as in load_and_preprocess_data
    # Engineer protected attributes
    # age_group: bins: <25, 25-45, 45+
    if 'age' in input_df.columns:
        input_df['age_group'] = pd.cut(input_df['age'], bins=[0, 25, 45, 100], labels=['<25', '25-45', '45+'])
    
    # gender: proxy from personal_status_sex (attribute 9)
    # We need to map from the input format to the expected format
    # For now, we'll set a default - in a real system this would come from the input
    if 'personal_status_sex' not in input_df.columns:
        # Default to male if not provided
        input_df['personal_status_sex'] = 'A91'
    
    gender_map = {
        'A91': 'male', 'A92': 'female', 'A93': 'male', 'A94': 'male', 'A95': 'female'
    }
    if 'gender' not in input_df.columns:
        input_df['gender'] = input_df['personal_status_sex'].map(gender_map)
    
    # geography: random-seeded synthetic, 3 regions
    # For prediction, we'll use a default geography
    if 'geography' not in input_df.columns:
        input_df['geography'] = 'Region_A'  # Default
    
    # Identify categorical columns (original + engineered)
    categorical_cols = [
        'checking_status', 'credit_history', 'purpose', 'savings', 'employment',
        'personal_status_sex', 'other_debtors', 'property', 'other_installment_plans',
        'housing', 'job', 'telephone', 'foreign_worker', 'age_group', 'gender', 'geography'
    ]
    
    # One-hot encode categorical columns
    input_encoded = pd.get_dummies(input_df, columns=categorical_cols, drop_first=False)
    input_encoded.columns = input_encoded.columns.str.replace('[^A-Za-z0-9_]', '_', regex=True)
    
    # Ensure we have all the features that the model expects
    # Add missing columns with 0 values
    for feature in feature_names:
        if feature not in input_encoded.columns:
            input_encoded[feature] = 0
    
    # Select only the features the model was trained on, in the correct order
    input_encoded = input_encoded[feature_names]
    
    # Make prediction
    pred_proba = model.predict_proba(input_encoded)[0]
    pred_class = model.predict(input_encoded)[0]
    
    # For binary classification, class 0 is good/approved, class 1 is bad/rejected
    approved = (pred_class == 0)
    confidence = float(pred_proba[0]) if approved else float(pred_proba[1])  # Probability of the predicted class
    
    # Calculate SHAP values
    import shap
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(input_encoded)
    
    # For binary classification, shap_values is a list of two arrays [class0, class1]
    # We want the SHAP values for the predicted class
    if isinstance(shap_values, list):
        shap_values = shap_values[int(pred_class)]  # Get SHAP values for predicted class
    
    # Flatten to list if needed
    if hasattr(shap_values, 'flatten'):
        shap_values = shap_values.flatten().tolist()
    else:
        shap_values = shap_values.tolist()
    
    return {
        "approved": bool(approved),
        "confidence": confidence,
        "feature_names": feature_names,
        "shap_values": shap_values
    }

def main():
    # Load configuration
    config = load_config()
    dataset_path = config['dataset_path']
    model_path = config['model_path']
    
    # Ensure directories exist
    os.makedirs(os.path.dirname(model_path), exist_ok=True)
    
    # Load and preprocess data
    print("Loading and preprocessing data...")
    X, y, all_columns = load_and_preprocess_data(dataset_path)
    print(f"Data loaded: {X.shape[0]} samples, {X.shape[1]} features")
    
    # Train model
    print("Training XGBoost model...")
    model, auc, accuracy, feature_names = train_model(X, y)
    
    # Save model and feature names
    model_dict = {
        'model': model,
        'feature_names': feature_names
    }
    joblib.dump(model_dict, model_path)
    
    # Print training summary
    print("\n=== Training Summary ===")
    print(f"AUC: {auc:.4f}")
    print(f"Accuracy: {accuracy:.4f}")
    print(f"Feature count: {len(feature_names)}")
    print(f"Model saved to: {model_path}")
    print("========================")

if __name__ == "__main__":
    main()
