import time
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from app.shopee.client import ShopeeClient, ShopeeAuthClient
from app.common.serializers import serialize_doc
from app.common.exceptions import BadRequestException, NotFoundException
from app.config import settings


async def get_auth_url() -> str:
    client = ShopeeAuthClient()
    return client.get_auth_url()


async def handle_auth_callback(
    db: AsyncIOMotorDatabase, seller_id: str, code: str, shop_id: int
) -> dict:
    auth_client = ShopeeAuthClient()
    try:
        token_data = await auth_client.get_access_token(code, shop_id)
    except Exception as e:
        raise BadRequestException(f"Failed to get Shopee token: {str(e)}")

    if "error" in token_data and token_data["error"]:
        raise BadRequestException(token_data.get("message", "Shopee auth failed"))

    expires_at = datetime.now(timezone.utc) + timedelta(
        seconds=token_data.get("expire_in", 3600)
    )
    now = datetime.now(timezone.utc)

    await db.shopee_tokens.update_one(
        {"seller_id": seller_id},
        {
            "$set": {
                "seller_id": seller_id,
                "shop_id": shop_id,
                "access_token": token_data["access_token"],
                "refresh_token": token_data["refresh_token"],
                "expires_at": expires_at,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    await db.sellers.update_one(
        {"_id": ObjectId(seller_id)},
        {"$set": {"shopee_shop_id": str(shop_id), "updated_at": now}},
    )

    return {"connected": True, "shop_id": shop_id}


async def get_valid_token(db: AsyncIOMotorDatabase, seller_id: str) -> dict:
    token_doc = await db.shopee_tokens.find_one({"seller_id": seller_id})
    if not token_doc:
        raise NotFoundException("Shopee not connected. Please connect your Shopee account.")

    expires_at = token_doc.get("expires_at")
    if expires_at and expires_at <= datetime.now(timezone.utc) + timedelta(minutes=5):
        auth_client = ShopeeAuthClient()
        try:
            new_tokens = await auth_client.refresh_access_token(
                token_doc["refresh_token"], token_doc["shop_id"]
            )
            new_expires = datetime.now(timezone.utc) + timedelta(
                seconds=new_tokens.get("expire_in", 3600)
            )
            await db.shopee_tokens.update_one(
                {"seller_id": seller_id},
                {
                    "$set": {
                        "access_token": new_tokens["access_token"],
                        "refresh_token": new_tokens["refresh_token"],
                        "expires_at": new_expires,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            token_doc["access_token"] = new_tokens["access_token"]
        except Exception:
            raise BadRequestException("Failed to refresh Shopee token. Please reconnect.")

    return token_doc


async def sync_orders(db: AsyncIOMotorDatabase, seller_id: str, days_back: int = 1):
    token_doc = await get_valid_token(db, seller_id)
    client = ShopeeClient(token_doc["shop_id"], token_doc["access_token"])

    end_time = int(time.time())
    start_time = end_time - (days_back * 86400)

    response = await client.get_order_list(
        time_range_field="create_time",
        time_from=start_time,
        time_to=end_time,
        page_size=50,
    )

    if response.get("error"):
        raise BadRequestException(f"Shopee API error: {response.get('message')}")

    orders = response.get("response", {}).get("order_list", [])
    synced_count = 0

    for order in orders:
        existing = await db.orders.find_one({"shopee_order_id": order["order_sn"]})
        if not existing:
            synced_count += 1

    return {"synced": synced_count, "total_found": len(orders)}


async def send_tracking_to_shopee(
    db: AsyncIOMotorDatabase, seller_id: str, shopee_order_id: str,
    tracking_code: str, logistics_channel_id: int = 80009
) -> dict:
    token_doc = await get_valid_token(db, seller_id)
    client = ShopeeClient(token_doc["shop_id"], token_doc["access_token"])

    try:
        result = await client.ship_order(shopee_order_id, tracking_code, logistics_channel_id)
        return {"success": True, "result": result}
    except Exception as e:
        return {"success": False, "error": str(e)}


async def get_connection_status(db: AsyncIOMotorDatabase, seller_id: str) -> dict:
    token_doc = await db.shopee_tokens.find_one({"seller_id": seller_id})
    if not token_doc:
        return {"connected": False}
    return {
        "connected": True,
        "shop_id": token_doc.get("shop_id"),
        "expires_at": token_doc.get("expires_at", "").isoformat()
        if token_doc.get("expires_at")
        else None,
    }


async def disconnect_shopee(db: AsyncIOMotorDatabase, seller_id: str) -> dict:
    await db.shopee_tokens.delete_one({"seller_id": seller_id})
    await db.sellers.update_one(
        {"_id": ObjectId(seller_id)},
        {"$set": {"shopee_shop_id": None}},
    )
    return {"connected": False}
