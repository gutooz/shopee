import hashlib
import hmac
import time
import httpx
from typing import Optional
from app.config import settings


class ShopeeClient:
    def __init__(self, shop_id: int, access_token: str):
        self.shop_id = shop_id
        self.access_token = access_token
        self.partner_id = int(settings.SHOPEE_PARTNER_ID) if settings.SHOPEE_PARTNER_ID else 0
        self.partner_key = settings.SHOPEE_PARTNER_KEY
        self.base_url = settings.SHOPEE_BASE_URL

    def _sign(self, path: str, timestamp: int, access_token: Optional[str] = None) -> str:
        base = f"{self.partner_id}{path}{timestamp}"
        if access_token:
            base += access_token
        if self.shop_id:
            base += str(self.shop_id)
        return hmac.new(
            self.partner_key.encode("utf-8"),
            base.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _get_common_params(self, path: str) -> dict:
        ts = int(time.time())
        return {
            "partner_id": self.partner_id,
            "timestamp": ts,
            "access_token": self.access_token,
            "shop_id": self.shop_id,
            "sign": self._sign(path, ts, self.access_token),
        }

    async def get_order_list(self, time_range_field: str = "create_time", **kwargs) -> dict:
        path = "/api/v2/order/get_order_list"
        params = self._get_common_params(path)
        params.update({"time_range_field": time_range_field, **kwargs})
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}{path}", params=params)
            response.raise_for_status()
            return response.json()

    async def get_order_detail(self, order_sn_list: list) -> dict:
        path = "/api/v2/order/get_order_detail"
        params = self._get_common_params(path)
        params["order_sn_list"] = ",".join(order_sn_list)
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}{path}", params=params)
            response.raise_for_status()
            return response.json()

    async def ship_order(self, order_sn: str, tracking_number: str, logistics_channel_id: int) -> dict:
        path = "/api/v2/logistics/ship_order"
        ts = int(time.time())
        sign = self._sign(path, ts, self.access_token)
        params = {
            "partner_id": self.partner_id,
            "timestamp": ts,
            "access_token": self.access_token,
            "shop_id": self.shop_id,
            "sign": sign,
        }
        body = {
            "order_sn": order_sn,
            "pickup": {
                "tracking_no": tracking_number,
                "logistics_channel_id": logistics_channel_id,
            },
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}{path}", params=params, json=body
            )
            response.raise_for_status()
            return response.json()

    async def get_item_list(self, offset: int = 0, page_size: int = 50) -> dict:
        path = "/api/v2/product/get_item_list"
        params = self._get_common_params(path)
        params.update({
            "offset": offset,
            "page_size": page_size,
            "item_status": "NORMAL",
        })
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}{path}", params=params)
            response.raise_for_status()
            return response.json()


class ShopeeAuthClient:
    def __init__(self):
        self.partner_id = int(settings.SHOPEE_PARTNER_ID) if settings.SHOPEE_PARTNER_ID else 0
        self.partner_key = settings.SHOPEE_PARTNER_KEY
        self.base_url = settings.SHOPEE_BASE_URL

    def get_auth_url(self) -> str:
        path = "/api/v2/shop/auth_partner"
        ts = int(time.time())
        base_string = f"{self.partner_id}{path}{ts}"
        sign = hmac.new(
            self.partner_key.encode("utf-8"),
            base_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return (
            f"{self.base_url}{path}"
            f"?partner_id={self.partner_id}"
            f"&timestamp={ts}"
            f"&sign={sign}"
            f"&redirect={settings.SHOPEE_REDIRECT_URL}"
        )

    async def get_access_token(self, code: str, shop_id: int) -> dict:
        path = "/api/v2/auth/token/get"
        ts = int(time.time())
        base_string = f"{self.partner_id}{path}{ts}"
        sign = hmac.new(
            self.partner_key.encode("utf-8"),
            base_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        body = {
            "code": code,
            "shop_id": shop_id,
            "partner_id": self.partner_id,
        }
        params = {"partner_id": self.partner_id, "timestamp": ts, "sign": sign}
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}{path}", params=params, json=body
            )
            response.raise_for_status()
            return response.json()

    async def refresh_access_token(self, refresh_token: str, shop_id: int) -> dict:
        path = "/api/v2/auth/access_token/get"
        ts = int(time.time())
        base_string = f"{self.partner_id}{path}{ts}"
        sign = hmac.new(
            self.partner_key.encode("utf-8"),
            base_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        body = {
            "refresh_token": refresh_token,
            "shop_id": shop_id,
            "partner_id": self.partner_id,
        }
        params = {"partner_id": self.partner_id, "timestamp": ts, "sign": sign}
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}{path}", params=params, json=body
            )
            response.raise_for_status()
            return response.json()
