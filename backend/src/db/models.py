from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
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
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id"), nullable=True)
    loan_amount = Column(Float)
    loan_term   = Column(Integer)
    purpose     = Column(String(200))
    status      = Column(String(50), default="pending")
    created_at  = Column(DateTime(timezone=True), server_default=func.now())


class Prediction(Base):
    __tablename__ = "predictions"
    id                     = Column(Integer, primary_key=True, index=True)
    application_id         = Column(Integer, ForeignKey("applications.id"), nullable=True)
    credit_score           = Column(Integer)
    probability_of_default = Column(Float)
    model_version          = Column(String(50))
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