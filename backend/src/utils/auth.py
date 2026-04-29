# placeholder
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone
from typing import List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY  = os.getenv("SECRET_KEY", "fallback-secret-key")
ALGORITHM   = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

bearer_scheme = HTTPBearer()


def create_access_token(data: dict) -> str:
    payload = data.copy()
    expire  = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return {}


class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    ) -> str:
        token   = credentials.credentials
        payload = decode_access_token(token)
        role    = payload.get("role")

        if not role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
        if role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{role}' not permitted. Required: {self.allowed_roles}",
            )
        return role