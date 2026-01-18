import datetime
import os

from fastapi import HTTPException, status
import jwt
from jwt.exceptions import PyJWTError
from pydantic import BaseModel


class TokenData(BaseModel):
    user_id: str | None = None
    email: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int


JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7


def verify_token(token: str) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id: str | None = payload.get("sub")
        email: str | None = payload.get("email")

        if user_id is None:
            raise credentials_exception

        return TokenData(user_id=user_id, email=email)
    except PyJWTError:
        raise credentials_exception from None


def create_token_response(user_id: str, email: str) -> Token:
    expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(
        minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    encoded_jwt = jwt.encode(
        {"sub": user_id, "email": email, "exp": expire},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

    return Token(
        access_token=encoded_jwt,
        token_type="bearer",
        expires_in=JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
