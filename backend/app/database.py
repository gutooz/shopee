import structlog
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import settings
import redis.asyncio as aioredis

logger = structlog.get_logger(__name__)


class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None


db_instance = Database()


async def connect_to_mongo():
    db_instance.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_instance.db = db_instance.client[settings.MONGO_DB]
    await db_instance.client.admin.command("ping")


async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()


def get_database() -> AsyncIOMotorDatabase:
    return db_instance.db


redis_client: aioredis.Redis = None


async def connect_to_redis():
    global redis_client
    try:
        client = await aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )
        await client.ping()
        redis_client = client
        logger.info("redis.connected", url=settings.REDIS_URL)
    except Exception as exc:
        if settings.ENVIRONMENT == "development":
            import fakeredis
            redis_client = fakeredis.FakeAsyncRedis(decode_responses=True)
            logger.warning("redis.unavailable_using_fakeredis", error=str(exc))
        else:
            raise


async def close_redis_connection():
    global redis_client
    if redis_client:
        await redis_client.aclose()


def get_redis() -> aioredis.Redis:
    return redis_client
