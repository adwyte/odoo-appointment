from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, FRONTEND_URL
from app.models.models import User, UserRole
from app.database import get_db
from app.core.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

@router.get("/google/login")
async def google_login(request: Request):
    redirect_uri = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    token = await oauth.google.authorize_access_token(request)
    userinfo = token["userinfo"]

    email = userinfo["email"]
    name = userinfo["name"]

    user = db.query(User).filter(User.email == email).first()

    if not user:
        user = User(
            email=email,
            full_name=name,
            password_hash="GOOGLE_OAUTH",
            role=UserRole.CUSTOMER,
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    jwt_token = create_access_token(
        {
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value,
        }
    )

    return RedirectResponse(
        f"{FRONTEND_URL}/login/callback?token={jwt_token}"
    )

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["user_id"],
        "email": current_user["email"],
        "role": current_user["role"],
    }