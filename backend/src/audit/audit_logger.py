# placeholder
from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

import yaml
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import AuditLog
from src.db.database import AsyncSessionLocal

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

with open("config.yaml", "r") as f:
    _cfg = yaml.safe_load(f)

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _compute_hash(prev_hash: str, entry: dict) -> str:
    payload = prev_hash + json.dumps(entry, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def _get_latest_hash(db: AsyncSession) -> str:
    """Get the current_hash of the most recent audit log entry."""
    result = await db.execute(
        select(AuditLog.current_hash)
        .order_by(desc(AuditLog.timestamp))
        .limit(1)
    )
    latest_hash = result.scalar_one_or_none()
    return latest_hash if latest_hash is not None else "0" * 64


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


async def log_decision(decision_data: dict[str, Any]) -> dict:
    """Log a decision to the PostgreSQL audit log table."""
    async with AsyncSessionLocal() as db:
        entry_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        prev_hash = await _get_latest_hash(db)

        base = {
            "id": entry_id,
            "timestamp": timestamp.isoformat(),
            "input_data": decision_data.get("input_data", {}),
            "prediction": decision_data.get("prediction"),
            "confidence": decision_data.get("confidence"),
            "shap_values": decision_data.get("shap_values", []),
        }

        current_hash = _compute_hash(prev_hash, base)

        # Create audit log entry
        audit_entry = AuditLog(
            id=entry_id,
            user_id=decision_data.get("user_id"),  # Assuming user_id might be in decision_data
            action="DECISION_LOG",
            table_name="audit_logs",  # Self-referential
            record_id=0,  # Not applicable for audit log itself
            changes=json.dumps(base, default=str),
            timestamp=timestamp,
        )

        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)

        # Return entry with hash information for chain verification
        return {
            **base,
            "prev_hash": prev_hash,
            "current_hash": current_hash,
            "db_id": audit_entry.id,
        }


async def get_log(page: int = 1, limit: int = 20) -> List[dict]:
    """Get paginated audit logs from the database."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AuditLog)
            .order_by(desc(AuditLog.timestamp))
            .offset((page - 1) * limit)
            .limit(limit)
        )
        logs = result.scalars().all()

        # Convert to dict format similar to original
        return [
            {
                "id": log.id,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None,
                "input_data": json.loads(log.changes).get("input_data", {}) if log.changes else {},
                "prediction": json.loads(log.changes).get("prediction") if log.changes else None,
                "confidence": json.loads(log.changes).get("confidence") if log.changes else None,
                "shap_values": json.loads(log.changes).get("shap_values", []) if log.changes else [],
                "prev_hash": json.loads(log.changes).get("prev_hash") if log.changes else None,
                "current_hash": json.loads(log.changes).get("current_hash") if log.changes else None,
            }
            for log in logs
        ]


async def verify_chain() -> dict:
    """Verify the SHA-256 chain integrity of audit logs."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AuditLog)
            .order_by(desc(AuditLog.timestamp))
        )
        logs = result.scalars().all()

        if not logs:
            return {"valid": True, "broken_at": None}

        # Reverse to get chronological order
        logs = list(reversed(logs))
        prev_hash = "0" * 64

        for log in logs:
            if not log.changes:
                continue
            try:
                base = json.loads(log.changes)
                # Reconstruct the base entry for hash computation
                entry_base = {
                    "id": base.get("id", ""),
                    "timestamp": base.get("timestamp", ""),
                    "input_data": base.get("input_data", {}),
                    "prediction": base.get("prediction"),
                    "confidence": base.get("confidence"),
                    "shap_values": base.get("shap_values", []),
                }
                expected_hash = _compute_hash(prev_hash, entry_base)
                current_hash = base.get("current_hash")

                if expected_hash != current_hash:
                    return {"valid": False, "broken_at": log.id}

                prev_hash = current_hash
            except (json.JSONDecodeError, KeyError):
                return {"valid": False, "broken_at": log.id}

        return {"valid": True, "broken_at": None}


async def flag_anomalies() -> List[dict]:
    """Flag anomalous confidence scores using statistical method."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AuditLog.changes)
        )
        logs_raw = result.scalars().all()

        # Extract confidences from logs
        confidences = []
        log_entries = []
        for log_json in logs_raw:
            if not log_json:
                continue
            try:
                log_data = json.loads(log_json)
                confidence = log_data.get("confidence")
                if confidence is not None:
                    confidences.append(confidence)
                    log_entries.append(log_data)
            except json.JSONDecodeError:
                continue

        if len(confidences) < 3:
            return []

        import statistics
        mean = statistics.mean(confidences)
        stdev = statistics.stdev(confidences)
        if stdev == 0:
            return []

        # Return entries where confidence is more than 2 standard deviations from mean
        anomalous_entries = [
            entry for entry, conf in zip(log_entries, confidences)
            if abs(conf - mean) > 2 * stdev
        ]

        return anomalous_entries