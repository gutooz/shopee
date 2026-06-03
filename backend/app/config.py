from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "SupplierHub"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # MongoDB
    MONGODB_URL: str = "mongodb://admin:password@localhost:27017/supplierhub?authSource=admin"
    MONGO_DB: str = "supplierhub"

    # Redis
    REDIS_URL: str = "redis://:redispass@localhost:6379/0"

    # JWT
    SECRET_KEY: str = "supersecretkey-change-in-production-min32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Shopee
    SHOPEE_PARTNER_ID: str = ""
    SHOPEE_PARTNER_KEY: str = ""
    SHOPEE_REDIRECT_URL: str = "http://localhost:4200/settings/shopee/callback"
    SHOPEE_ENV: str = "sandbox"

    @property
    def SHOPEE_BASE_URL(self) -> str:
        if self.SHOPEE_ENV == "production":
            return "https://partner.shopeemobile.com"
        return "https://partner.test-stable.shopeemobile.com"

    # Evolution API (WhatsApp)
    EVOLUTION_API_URL: str = "http://localhost:8080"
    EVOLUTION_API_KEY: str = ""

    # SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Frontend
    FRONTEND_URL: str = "http://localhost:4200"

    # Billing
    FEE_PER_ITEM: float = 2.0

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
