from __future__ import annotations

import hashlib
import json
import statistics
import uuid
from datetime import datetime, timezone
from typing import Any, List

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import AuditLog
from src.db.database import AsyncSessionLocal


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _compute_hash(prev_hash: str, entry: dict) -> str:
    payload = prev_hash + json.dumps(entry, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def _get_latest_hash(db: AsyncSession) -> str:
    result = await db.execute(
        select(AuditLog.current_hash)
        .order_by(desc(AuditLog.timestamp))
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    return latest if latest is not None else "0" * 64


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def log_decision(decision_data: dict[str, Any]) -> dict:
    async with AsyncSessionLocal() as db:
        timestamp = datetime.now(timezone.utc)
        prev_hash = await _get_latest_hash(db)

        base = {
            "timestamp":   timestamp.isoformat(),
            "input_data":  decision_data.get("input_data", {}),
            "prediction":  decision_data.get("prediction"),
            "confidence":  decision_data.get("confidence"),
            "shap_values": decision_data.get("shap_values", []),
        }

        current_hash = _compute_hash(prev_hash, base)

        entry_id = str(uuid.uuid4())

        audit_entry = AuditLog(
            id=entry_id,
            input_data=json.dumps(base["input_data"], default=str),
            prediction=base["prediction"],
            confidence=base["confidence"],
            shap_values=json.dumps(base["shap_values"], default=str),
            prev_hash=prev_hash,
            current_hash=current_hash,
            timestamp=timestamp,
        )

        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)

        return {
            **base,
            "id":           entry_id,
            "prev_hash":    prev_hash,
            "current_hash": current_hash,
        }


async def get_log(page: int = 1, limit: int = 20) -> List[dict]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AuditLog)
            .order_by(desc(AuditLog.timestamp))
            .offset((page - 1) * limit)
            .limit(limit)
        )
        logs = result.scalars().all()

        return [
            {
                "id":          str(log.id),
                "timestamp":   log.timestamp.isoformat() if log.timestamp else None,
                "input_data":  json.loads(log.input_data)  if log.input_data  else {},
                "prediction":  log.prediction,
                "confidence":  log.confidence,
                "shap_values": json.loads(log.shap_values) if log.shap_values else [],
                "prev_hash":   log.prev_hash,
                "current_hash":log.current_hash,
            }
            for log in logs
        ]


async def verify_chain() -> dict:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AuditLog).order_by(AuditLog.timestamp)
        )
        logs = result.scalars().all()

        if not logs:
            return {"valid": True, "broken_at": None}

        prev_hash = "0" * 64

        for log in logs:
            base = {
                "timestamp":   log.timestamp.isoformat() if log.timestamp else "",
                "input_data":  json.loads(log.input_data)  if log.input_data  else {},
                "prediction":  log.prediction,
                "confidence":  log.confidence,
                "shap_values": json.loads(log.shap_values) if log.shap_values else [],
            }
            expected_hash = _compute_hash(prev_hash, base)

            if expected_hash != log.current_hash:
                return {"valid": False, "broken_at": str(log.id)}

            prev_hash = log.current_hash

        return {"valid": True, "broken_at": None}


async def flag_anomalies() -> List[dict]:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(AuditLog))
        logs = result.scalars().all()

        if len(logs) < 3:
            return []

        confidences = [log.confidence for log in logs if log.confidence is not None]

        if len(confidences) < 3:
            return []

        mean  = statistics.mean(confidences)
        stdev = statistics.stdev(confidences)

        if stdev == 0:
            return []

        return [
            {
                "id":         str(log.id),
                "confidence": log.confidence,
                "deviation":  abs(log.confidence - mean),
                "timestamp":  log.timestamp.isoformat() if log.timestamp else None,
            }
            for log in logs
            if log.confidence is not None
            and abs(log.confidence - mean) > 2 * stdev
        ]