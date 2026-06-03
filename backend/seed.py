"""
Seed script - creates admin user and sample data.
Run: python seed.py
"""
import asyncio
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from app.common.security import hash_password


async def seed():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGO_DB]
    now = datetime.now(timezone.utc)

    # Admin user
    existing_admin = await db.users.find_one({"email": "admin@supplierhub.com"})
    if not existing_admin:
        result = await db.users.insert_one({
            "name": "Admin SupplierHub",
            "email": "admin@supplierhub.com",
            "password_hash": hash_password("Admin@123456"),
            "role": "admin",
            "active": True,
            "created_at": now,
            "updated_at": now,
        })
        print(f"✓ Admin created: admin@supplierhub.com / Admin@123456")
    else:
        print("✓ Admin already exists")

    # Demo seller
    existing_seller = await db.users.find_one({"email": "seller@demo.com"})
    if not existing_seller:
        seller_user = await db.users.insert_one({
            "name": "Demo Seller",
            "email": "seller@demo.com",
            "password_hash": hash_password("Seller@123456"),
            "role": "seller",
            "active": True,
            "created_at": now,
            "updated_at": now,
        })
        seller_id = str(seller_user.inserted_id)
        seller_doc = await db.sellers.insert_one({
            "user_id": seller_id,
            "company_name": "Demo Store LTDA",
            "cnpj": "12.345.678/0001-90",
            "shopee_shop_id": None,
            "subscription_status": "active",
            "created_at": now,
        })
        seller_doc_id = str(seller_doc.inserted_id)

        # Demo supplier
        supplier = await db.suppliers.insert_one({
            "seller_id": seller_doc_id,
            "name": "Fornecedor Demo",
            "email": "fornecedor@demo.com",
            "phone": "11999999999",
            "address": "Rua das Flores, 100 - SP",
            "whatsapp_number": "5511999999999",
            "active": True,
            "created_at": now,
            "updated_at": now,
        })
        supplier_id = str(supplier.inserted_id)

        # Demo product
        await db.products.insert_one({
            "seller_id": seller_doc_id,
            "supplier_id": supplier_id,
            "name": "Produto Demo A",
            "sku": "PROD-001",
            "shopee_product_id": None,
            "price": 89.90,
            "active": True,
            "created_at": now,
            "updated_at": now,
        })

        print(f"✓ Demo seller created: seller@demo.com / Seller@123456")
        print(f"  - 1 supplier created")
        print(f"  - 1 product created")
    else:
        print("✓ Demo seller already exists")

    client.close()
    print("\n✅ Seed completed!")


if __name__ == "__main__":
    asyncio.run(seed())
