from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.common.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.common.exceptions import ConflictException, UnauthorizedException, BadRequestException
from app.common.serializers import serialize_doc
from app.auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserOut


def _build_user_out(user: dict) -> UserOut:
    doc = serialize_doc(user)
    return UserOut(
        id=doc["id"],
        name=doc["name"],
        email=doc["email"],
        role=doc["role"],
        active=doc.get("active", True),
        created_at=doc.get("created_at", ""),
    )


async def register_user(db: AsyncIOMotorDatabase, data: RegisterRequest) -> TokenResponse:
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise ConflictException("Email already registered")

    now = datetime.now(timezone.utc)
    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "role": data.role.value,
        "active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id

    if data.role.value == "seller":
        await db.sellers.insert_one({
            "user_id": str(result.inserted_id),
            "company_name": data.name,
            "cnpj": "",
            "shopee_shop_id": None,
            "subscription_status": "active",
            "created_at": now,
        })

    token_data = {"sub": str(result.inserted_id), "role": data.role.value}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=_build_user_out(user_doc),
    )


async def login_user(db: AsyncIOMotorDatabase, data: LoginRequest) -> TokenResponse:
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise UnauthorizedException("Invalid credentials")

    if not user.get("active", True):
        raise UnauthorizedException("Account is disabled")

    token_data = {"sub": str(user["_id"]), "role": user["role"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=_build_user_out(user),
    )


async def refresh_tokens(db: AsyncIOMotorDatabase, refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedException("Invalid refresh token")

    user_id = payload.get("sub")
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("active", True):
        raise UnauthorizedException("User not found or disabled")

    token_data = {"sub": str(user["_id"]), "role": user["role"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=_build_user_out(user),
    )


async def change_password(
    db: AsyncIOMotorDatabase, user: dict, current_password: str, new_password: str
) -> dict:
    if not verify_password(current_password, user["password_hash"]):
        raise BadRequestException("Current password is incorrect")

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return {"message": "Password updated successfully"}
