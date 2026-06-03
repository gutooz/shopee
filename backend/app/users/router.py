from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.database import get_database
from app.common.dependencies import get_current_user, require_admin
from app.common.pagination import PaginationParams
from app.users import service
from app.users.schemas import UserUpdate, UserOut, UserAdminUpdate

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    from app.common.serializers import serialize_doc
    return serialize_doc(current_user)


@router.put("/me", response_model=UserOut)
async def update_me(
    data: UserUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.update_user(db, str(current_user["_id"]), data)


@router.get("/", dependencies=[Depends(require_admin)])
async def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    params = PaginationParams(page=page, page_size=page_size)
    return await service.list_users(db, params)


@router.get("/{user_id}", dependencies=[Depends(require_admin)])
async def get_user(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    return await service.get_user_by_id(db, user_id)


@router.patch("/{user_id}", dependencies=[Depends(require_admin)])
async def admin_update_user(
    user_id: str,
    data: UserAdminUpdate,
    db: AsyncIOMotorDatabase = Depends(get_database),
):
    return await service.admin_update_user(db, user_id, data)


@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: str, db: AsyncIOMotorDatabase = Depends(get_database)):
    return await service.delete_user(db, user_id)
