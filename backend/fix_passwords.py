import asyncio
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
import asyncpg

load_dotenv()

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Convert SQLAlchemy URL to asyncpg format
DATABASE_URL = os.getenv('DATABASE_URL', '').replace(
    'postgresql+asyncpg://', 'postgresql://'
)

async def fix_passwords():
    print(f"Connecting to Supabase...")
    conn = await asyncpg.connect(DATABASE_URL, statement_cache_size=0)

    users = [
        ('applicant', pwd_context.hash('applicant123')),
        ('auditor',   pwd_context.hash('auditor123')),
        ('regulator', pwd_context.hash('regulator123')),
    ]

    for username, hashed in users:
        await conn.execute(
            'UPDATE users SET password_hash = $1 WHERE username = $2',
            hashed, username
        )
        print(f"Updated: {username}")

    await conn.close()
    print('All passwords updated successfully')

asyncio.run(fix_passwords())

