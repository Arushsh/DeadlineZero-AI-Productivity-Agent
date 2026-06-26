"""
Firebase token verification.
Verifies the x-firebase-token header sent by the frontend.
"""

import os
from fastapi import Header, HTTPException
from typing import Optional
from dotenv import load_dotenv

load_dotenv()


def _is_demo_mode() -> bool:
    """Check demo mode at request time, not import time."""
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "").strip()
    return not cred_path or not os.path.exists(cred_path)


async def get_current_user(
    x_firebase_token: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
) -> str:
    """
    FastAPI dependency — extracts and verifies current user.
    Returns uid string.

    Priority:
      1. Firebase ID token (production)
      2. x-user-id header (demo/dev fallback)
      3. 'demo_user' (no credentials at all)
    """
    demo = _is_demo_mode()

    # Always try Firebase token first if provided
    if x_firebase_token:
        if demo:
            # Credentials not set up — skip verification, extract uid from token
            # by decoding payload (not verifying signature) for local dev
            try:
                import base64, json
                payload = x_firebase_token.split('.')[1]
                # Fix padding
                payload += '=' * (4 - len(payload) % 4)
                decoded = json.loads(base64.b64decode(payload))
                uid = decoded.get('user_id') or decoded.get('sub', 'demo_user')
                return uid
            except Exception:
                return x_user_id or 'demo_user'
        else:
            # Real verification
            try:
                from firebase_admin import auth
                decoded = auth.verify_id_token(x_firebase_token)
                return decoded['uid']
            except Exception as e:
                raise HTTPException(
                    status_code=401,
                    detail=f"Invalid Firebase token: {str(e)}"
                )

    # No token — use x-user-id fallback
    if x_user_id:
        return x_user_id

    # Nothing provided at all
    if demo:
        return 'demo_user'

    raise HTTPException(status_code=401, detail="x-user-id header required")