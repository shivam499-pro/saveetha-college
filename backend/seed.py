#!/usr/bin/env python3
"""
Seed script to initialize the database with tables and default users.
"""
import asyncio
from passlib.context import CryptContext
from src.db.database import engine, Base, AsyncSessionLocal
from src.db.models import User

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def init_db() -> None:
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully.")

async def create_default_users() -> None:
    """Create default users if they don't exist."""
    default_users = [
        {"username": "applicant", "password": "pass123"},
        {"username": "auditor", "password": "pass123"},
        {"username": "regulator", "password": "pass123"},
    ]
    
    async with AsyncSessionLocal() as db:
        for user_data in default_users:
            # Check if user already exists
            from sqlalchemy import select
            result = await db.execute(select(User).where(User.username == user_data["username"]))
            existing_user = result.scalar_one_or_none()
            
            if not existing_user:
                hashed_password = pwd_context.hash(user_data["password"])
                user = User(
                    username=user_data["username"],
                    email=f"{user_data['username']}@example.com",
                    password_hash=hashed_password,
                    is_active=True
                )
                db.add(user)
                print(f"Created user: {user_data['username']}")
            else:
                print(f"User {user_data['username']} already exists, skipping.")
        
        await db.commit()

async def main() -> None:
    """Main seeding function."""
    print("Starting database seeding...")
    await init_db()
    await create_default_users()
    print("Seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())