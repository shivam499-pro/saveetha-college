from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Relationships
    applications = relationship("Application", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    loan_amount = Column(Float, nullable=False)
    loan_term = Column(Integer, nullable=False)  # in months
    purpose = Column(String(200))
    status = Column(String(50), default="pending")  # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Relationships
    user = relationship("User", back_populates="applications")
    predictions = relationship("Prediction", back_populates="application")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)
    credit_score = Column(Integer)  # e.g., 300-850
    probability_of_default = Column(Float)  # 0.0 to 1.0
    model_version = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Relationships
    application = relationship("Application", back_populates="predictions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable for system events
    action = Column(String(100), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, etc.
    table_name = Column(String(50), nullable=False)
    record_id = Column(Integer, nullable=False)
    changes = Column(Text)  # JSON string of changes
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    # Relationships
    user = relationship("User", back_populates="audit_logs")


class FairnessMetric(Base):
    __tablename__ = "fairness_metrics"

    id = Column(Integer, primary_key=True, index=True)
    model_version = Column(String(50), nullable=False)
    metric_name = Column(String(100), nullable=False)  # e.g., demographic_parity, equal_opportunity
    metric_value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)  # maximum acceptable disparity
    is_fair = Column(Boolean, nullable=False)
    evaluated_at = Column(DateTime(timezone=True), server_default=func.now())