from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(50), unique=True, index=True, nullable=False)
    email         = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())


class Application(Base):
    __tablename__ = "applications"
    id                     = Column(Integer, primary_key=True, index=True)
    user_id                = Column(Integer, ForeignKey("users.id"), nullable=True)
    # Basic info
    loan_amount            = Column(Float)
    loan_term              = Column(Integer)
    purpose                = Column(String(200))
    # Expanded applicant data
    income                 = Column(Float)
    employment_type        = Column(String(50))
    employment_length      = Column(Integer)
    housing_status         = Column(String(50))
    housing_cost           = Column(Float)
    debt_to_income_ratio   = Column(Float)
    credit_utilization     = Column(Float)
    num_credit_lines       = Column(Integer)
    recent_inquiries       = Column(Integer)
    # Geography
    geography              = Column(String(50))
    geography_census_tract = Column(String(50))
    geography_median_income = Column(Float)
    geography_unemployment = Column(Float)
    geography_poverty_rate = Column(Float)
    # Derived
    age                    = Column(Integer)
    credit_history         = Column(String(50))
    status                 = Column(String(50), default="pending")
    created_at             = Column(DateTime(timezone=True), server_default=func.now())


class Prediction(Base):
    __tablename__ = "predictions"
    id                     = Column(Integer, primary_key=True, index=True)
    application_id         = Column(Integer, ForeignKey("applications.id"), nullable=True)
    credit_score           = Column(Integer)
    probability_of_default = Column(Float)
    model_version          = Column(String(50))
    threshold_used         = Column(Float, default=0.5)
    approved               = Column(Boolean)
    created_at             = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id           = Column(String(36), primary_key=True, index=True)
    input_data   = Column(Text,    nullable=True)
    prediction   = Column(Boolean, nullable=True)
    confidence   = Column(Float,   nullable=True)
    shap_values  = Column(Text,    nullable=True)
    prev_hash    = Column(String(64), nullable=True)
    current_hash = Column(String(64), nullable=True)
    timestamp    = Column(DateTime(timezone=True), server_default=func.now())


class FairnessMetric(Base):
    __tablename__ = "fairness_metrics"
    id            = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50),  nullable=False)
    metric_name   = Column(String(100), nullable=False)
    metric_value  = Column(Float,       nullable=False)
    threshold     = Column(Float,       nullable=False)
    is_fair       = Column(Boolean,     nullable=False)
    evaluated_at  = Column(DateTime(timezone=True), server_default=func.now())


class GlobalSHAP(Base):
    __tablename__ = "global_shap"
    id            = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False)
    feature_name  = Column(String(200), nullable=False)
    mean_abs_shap = Column(Float, nullable=False)
    mean_shap     = Column(Float, nullable=False)
    std_shap      = Column(Float, nullable=False)
    importance_rank = Column(Integer, nullable=False)
    evaluated_at  = Column(DateTime(timezone=True), server_default=func.now())


class CohortSHAP(Base):
    __tablename__ = "cohort_shap"
    id            = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False)
    cohort_name   = Column(String(100), nullable=False)
    cohort_filter = Column(Text, nullable=False)
    feature_name  = Column(String(200), nullable=False)
    mean_abs_shap = Column(Float, nullable=False)
    mean_shap     = Column(Float, nullable=False)
    sample_size   = Column(Integer, nullable=False)
    evaluated_at  = Column(DateTime(timezone=True), server_default=func.now())


class WhatIfScenario(Base):
    __tablename__ = "whatif_scenarios"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=True)
    base_application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    scenario_name = Column(String(200), nullable=False)
    changes       = Column(Text, nullable=False)
    original_prediction = Column(Float, nullable=False)
    original_approved = Column(Boolean, nullable=False)
    new_prediction = Column(Float, nullable=False)
    new_approved   = Column(Boolean, nullable=False)
    shap_impact    = Column(Text, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())


class ThresholdConfig(Base):
    __tablename__ = "threshold_config"
    id            = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False)
    threshold     = Column(Float, nullable=False)
    target_approval_rate = Column(Float, nullable=True)
    target_fdr    = Column(Float, nullable=True)
    target_fnr    = Column(Float, nullable=True)
    is_active     = Column(Boolean, default=False)
    created_by    = Column(String(100), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    activated_at  = Column(DateTime(timezone=True), nullable=True)


class AICreditCoach(Base):
    __tablename__ = "ai_credit_coach"
    id            = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=True)
    recommendation_type = Column(String(50), nullable=False)
    current_value = Column(Float, nullable=False)
    target_value  = Column(Float, nullable=False)
    impact_on_approval = Column(Float, nullable=False)
    impact_on_rate = Column(Float, nullable=True)
    priority      = Column(Integer, nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())


class ModelGovernance(Base):
    __tablename__ = "model_governance"
    id            = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False)
    model_type    = Column(String(50), nullable=False)
    training_date = Column(DateTime, nullable=False)
    performance_metrics = Column(JSON, nullable=False)
    fairness_metrics   = Column(JSON, nullable=True)
    drift_metrics      = Column(JSON, nullable=True)
    feature_count      = Column(Integer, nullable=False)
    training_samples   = Column(Integer, nullable=False)
    model_card_path    = Column(String(500), nullable=True)
    is_production      = Column(Boolean, default=False)
    created_at         = Column(DateTime(timezone=True), server_default=func.now())