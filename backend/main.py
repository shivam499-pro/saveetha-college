"""
Explainable Lending API — main.py
FastAPI application wiring all routes, middleware, and role-based access control.
"""

from __future__ import annotations

import io
import csv
import os
import asyncio

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

# Internal modules
from src.models import trainer
from src.explainability import shap_explainer
from src.fairness import fairness_evaluator
from src.audit import audit_logger
from src.utils.auth import RoleChecker, create_access_token
from src.db.database import init_db

# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Explainable Lending API",
    version="1.0.0",
    description=(
        "XAI-powered loan decision API with SHAP explanations, "
        "Fairlearn bias metrics, and tamper-evident SHA-256 audit logs."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Startup event
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    max_retries = 5
    for attempt in range(max_retries):
        try:
            await init_db()
            print("Database initialized successfully")
            break
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"DB not ready, retrying in 3s... ({attempt+1}/{max_retries})")
                await asyncio.sleep(3)
            else:
                print(f"Failed to connect to DB after {max_retries} attempts: {e}")
                raise

    # Load model once at startup into app.state
    try:
        model, feature_names = trainer.load_model()
        app.state.model = model
        app.state.feature_names = feature_names
        print(f"Model loaded successfully with {len(feature_names)} features")
    except Exception as e:
        print(f"Warning: Could not load model at startup: {e}")
        app.state.model = None
        app.state.feature_names = None

# ---------------------------------------------------------------------------
# Role checkers (dependency injection)
# ---------------------------------------------------------------------------

applicant_or_auditor = RoleChecker(["applicant", "auditor"])
auditor_only         = RoleChecker(["auditor"])
regulator_only       = RoleChecker(["regulator"])
auditor_or_regulator = RoleChecker(["auditor", "regulator"])

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    income: float
    loan_amount: float
    credit_history: str  # "excellent" | "good" | "fair" | "poor"
    employment_type: str  # "salaried" | "self_employed" | "unemployed"
    existing_loans: int
    duration: int
    age: int

class PredictResponse(BaseModel):
    approved: bool
    confidence: float
    explanation: list
    suggestions: list
    audit_id: str


class TokenRequest(BaseModel):
    role: str = Field(..., description="applicant | auditor | regulator")


# ---------------------------------------------------------------------------
# Auth helper endpoint  (dev/test only — not protected)
# ---------------------------------------------------------------------------

@app.post("/api/v1/auth/token", tags=["Auth"])
def get_test_token(req: TokenRequest):
    """Generate a signed JWT for the requested role (for testing/demo purposes)."""
    allowed = {"applicant", "auditor", "regulator"}
    if req.role not in allowed:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {allowed}")
    token = create_access_token({"role": req.role})
    return {"access_token": token, "token_type": "bearer"}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health():
    return {"status": "ok"}


@app.post("/api/v1/predict", response_model=PredictResponse, tags=["Predict"])
def predict_loan(req: PredictRequest, role: str = Depends(applicant_or_auditor)):
    """
    Run XGBoost inference on a loan application and return:
        - Approval decision + confidence
        - SHAP-based plain-language explanation (ranked by magnitude)
        - Actionable improvement suggestions (negative contributors only)
        - Audit log ID for traceability
    """
    try:
        # Map PredictRequest fields to the 69-feature format trainer.py expects
        input_dict = {
            "checking_status": "A11",
            "duration": req.duration,
            "credit_history": {
                "excellent": "A31",
                "good": "A32",
                "fair": "A33",
                "poor": "A34"
            }.get(req.credit_history.lower(), "A33"),
            "purpose": "A43",
            "credit_amount": req.loan_amount,
            "savings": "A61",
            "employment": {
                "salaried": "A73",
                "self_employed": "A74",
                "unemployed": "A71"
            }.get(req.employment_type.lower(), "A73"),
            "installment_rate": 2,
            "personal_status_sex": "A93",
            "other_debtors": "A101",
            "residence_since": 2,
            "property": "A121",
            "age": req.age,
            "other_installment_plans": "A143",
            "housing": "A152",
            "existing_credits": req.existing_loans,
            "job": "A173",
            "num_dependents": 1,
            "telephone": "A191",
            "foreign_worker": "A202",
        }

        # Single model load + single SHAP computation via trainer.predict()
        pred_result = trainer.predict(input_dict)

        # Build structured shap_results from raw trainer output (no second SHAP call)
        shap_results = shap_explainer.build_shap_results(
            feature_names=pred_result["feature_names"],
            shap_values=pred_result["shap_values"],
            input_dict=input_dict,
        )

        plain_lang  = shap_explainer.generate_plain_language(shap_results)
        suggestions = shap_explainer.actionable_suggestions(shap_results)

        # Append tamper-evident audit entry
        decision_data = {
            "input_data": input_dict,
            "prediction": pred_result["approved"],
            "confidence": pred_result["confidence"],
            "shap_values": shap_results,
        }
        log_entry = audit_logger.log_decision(decision_data)

        return {
            "approved":    pred_result["approved"],
            "confidence":  pred_result["confidence"],
            "explanation": plain_lang,
            "suggestions": suggestions,
            "audit_id":    log_entry["id"],
        }

    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")


# ---------------------------------------------------------------------------
# GET /api/v1/audit/log
# ---------------------------------------------------------------------------

@app.get("/api/v1/audit/log", tags=["Audit"])
def get_audit_log(
    page:  int = Query(1,  ge=1,  description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Entries per page"),
    role: str = Depends(auditor_only),
):
    """Return paginated audit log entries (newest first). Auditor role required."""
    logs = audit_logger.get_log(page, limit)
    return {"page": page, "limit": limit, "count": len(logs), "data": logs}


# ---------------------------------------------------------------------------
# GET /api/v1/audit/verify
# ---------------------------------------------------------------------------

@app.get("/api/v1/audit/verify", tags=["Audit"])
def verify_audit_chain(role: str = Depends(auditor_only)):
    """Verify the SHA-256 hash chain integrity of the audit log. Auditor role required."""
    return audit_logger.verify_chain()


# ---------------------------------------------------------------------------
# GET /api/v1/fairness/metrics
# ---------------------------------------------------------------------------

@app.get("/api/v1/fairness/metrics", tags=["Fairness"])
def get_fairness_metrics(role: str = Depends(regulator_only)):
    """
    Return Fairlearn metrics across all protected attributes.
    Regulator role required.
    """
    report = fairness_evaluator.get_fairness_report()  # No args = run full evaluation
    if "error" in report:
        raise HTTPException(status_code=400, detail=report["error"])
    return report


# ---------------------------------------------------------------------------
# GET /api/v1/fairness/drift
# ---------------------------------------------------------------------------

@app.get("/api/v1/fairness/drift", tags=["Fairness"])
def get_data_drift(role: str = Depends(regulator_only)):
    """
    Return Evidently data drift report (reference = test split, current = audit log inputs).
    Regulator role required.
    """
    report = fairness_evaluator.get_drift_report()
    if "error" in report:
        raise HTTPException(status_code=400, detail=report["error"])
    return report


# ---------------------------------------------------------------------------
# GET /api/v1/dashboard/stats
# ---------------------------------------------------------------------------

@app.get("/api/v1/dashboard/stats", tags=["Dashboard"])
def get_dashboard_stats(role: str = Depends(auditor_or_regulator)):
    """Aggregate statistics over all audit log entries. Auditor or Regulator role required."""
    logs = audit_logger._read_all_logs()
    total    = len(logs)
    approved = sum(1 for log in logs if log.get("prediction") is True)
    rejected = total - approved
    approval_rate = round((approved / total * 100), 2) if total > 0 else 0.0
    anomalies = audit_logger.flag_anomalies()

    return {
        "total":          total,
        "approved":       approved,
        "rejected":       rejected,
        "approval_rate":  approval_rate,
        "anomaly_count":  len(anomalies),
    }


# ---------------------------------------------------------------------------
# GET /api/v1/report/export
# ---------------------------------------------------------------------------

@app.get("/api/v1/report/export", tags=["Report"])
def export_report(
    format: str = Query(..., pattern="^(pdf|csv)$", description="pdf or csv"),
    role: str = Depends(regulator_only),
):
    """
    Download a compliance report as PDF or CSV.
    Regulator role required.
    """
    # Gather data (bypass HTTP layer — call module functions directly)
    metrics = fairness_evaluator.get_fairness_report()
    drift   = fairness_evaluator.get_drift_report()

    all_logs  = audit_logger._read_all_logs()
    total     = len(all_logs)
    approved  = sum(1 for log in all_logs if log.get("prediction") is True)
    rejected  = total - approved
    approval_rate = round((approved / total * 100), 2) if total > 0 else 0.0
    anomaly_count = len(audit_logger.flag_anomalies())

    # ---- CSV ---------------------------------------------------------------
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["=== SUMMARY ==="])
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Applications", total])
        writer.writerow(["Approved",           approved])
        writer.writerow(["Rejected",           rejected])
        writer.writerow(["Approval Rate (%)",  approval_rate])
        writer.writerow(["Anomalies Detected", anomaly_count])
        writer.writerow([])

        if "error" not in drift:
            writer.writerow(["=== DATA DRIFT ==="])
            writer.writerow(["Dataset Drift Detected", drift.get("dataset_drift")])
            writer.writerow(["Drifted Columns",        drift.get("number_of_drifted_columns")])
            writer.writerow(["Drift Share",             drift.get("share_of_drifted_columns")])
            writer.writerow([])

        if "error" not in metrics:
            writer.writerow(["=== FAIRNESS METRICS ==="])
            for attr, group_metrics in metrics.items():
                writer.writerow([f"--- {attr} ---"])
                for k, v in group_metrics.items():
                    if k == "selection_rates":
                        for grp, rate in v.items():
                            writer.writerow([f"  selection_rate ({grp})", round(rate, 4)])
                    else:
                        writer.writerow([f"  {k}", v])
                writer.writerow([])

        csv_bytes = output.getvalue().encode("utf-8")
        response  = Response(content=csv_bytes, media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=compliance_report.csv"
        return response

    # ---- PDF ---------------------------------------------------------------
    elif format == "pdf":
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            from reportlab.lib.units import inch
        except ImportError:
            raise HTTPException(status_code=500, detail="reportlab is not installed.")

        buf = io.BytesIO()
        c   = canvas.Canvas(buf, pagesize=letter)
        W, H = letter

        def header(title: str, y: float) -> float:
            c.setFont("Helvetica-Bold", 14)
            c.drawString(inch, y, title)
            c.setFont("Helvetica", 10)
            return y - 20

        def row(label: str, value, y: float, indent: float = 0) -> float:
            c.drawString(inch + indent, y, f"{label}:")
            c.drawString(inch + indent + 2.5 * inch, y, str(value))
            return y - 16

        def check_page(y: float) -> float:
            if y < 80:
                c.showPage()
                c.setFont("Helvetica", 10)
                return H - inch
            return y

        y = H - inch

        # Title
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(W / 2, y, "Explainable Lending — Compliance Report")
        y -= 10
        c.setFont("Helvetica", 9)
        from datetime import datetime, timezone
        c.drawCentredString(W / 2, y, f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
        y -= 30

        # Summary
        y = header("Summary", y)
        for label, value in [
            ("Total Applications", total),
            ("Approved",           approved),
            ("Rejected",           rejected),
            ("Approval Rate",      f"{approval_rate}%"),
            ("Anomalies Detected", anomaly_count),
        ]:
            y = row(label, value, y)
            y = check_page(y)

        y -= 16

        # Drift
        if "error" not in drift:
            y = check_page(y)
            y = header("Data Drift", y)
            for label, value in [
                ("Dataset Drift Detected",  drift.get("dataset_drift")),
                ("Drifted Columns",         drift.get("number_of_drifted_columns")),
                ("Share of Drifted Columns",drift.get("share_of_drifted_columns")),
            ]:
                y = row(label, value, y)
                y = check_page(y)
            y -= 16

        # Fairness
        if "error" not in metrics:
            y = check_page(y)
            y = header("Fairness Metrics", y)
            for attr, gm in metrics.items():
                y = check_page(y)
                c.setFont("Helvetica-Bold", 11)
                c.drawString(inch, y, f"Protected attribute: {attr}")
                c.setFont("Helvetica", 10)
                y -= 18
                for k, v in gm.items():
                    y = check_page(y)
                    if k == "selection_rates":
                        for grp, rate in v.items():
                            y = row(f"  selection_rate ({grp})", round(rate, 4), y, indent=10)
                    else:
                        y = row(f"  {k}", v, y, indent=10)
                y -= 10

        c.save()
        pdf_bytes = buf.getvalue()
        response  = Response(content=pdf_bytes, media_type="application/pdf")
        response.headers["Content-Disposition"] = "attachment; filename=compliance_report.pdf"
        return response
