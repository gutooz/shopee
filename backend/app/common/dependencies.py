from fastapi import Depends, Header
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.database import get_database
from app.common.security import decode_token
from app.common.exceptions import UnauthorizedException, ForbiddenException
from app.common.serializers import serialize_doc

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise UnauthorizedException("Invalid or expired token")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise UnauthorizedException("User not found")

    if not user.get("active", True):
        raise ForbiddenException("Account is disabled")

    return user


async def get_current_seller(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    if current_user.get("role") != "seller":
        raise ForbiddenException("Seller access required")
    seller = await db.sellers.find_one({"user_id": str(current_user["_id"])})
    if not seller:
        raise ForbiddenException("Seller profile not found")
    return serialize_doc(seller)


async def get_current_supplier(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
) -> dict:
    if current_user.get("role") != "supplier":
        raise ForbiddenException("Supplier access required")
    return current_user


async def require_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") != "admin":
        raise ForbiddenException("Admin access required")
    return current_user


def require_roles(*roles: str):
    async def _check(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in roles:
            raise ForbiddenException(
                f"Required roles: {', '.join(roles)}"
            )
        return current_user
    return _check
