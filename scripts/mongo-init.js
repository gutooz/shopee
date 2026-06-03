db = db.getSiblingDB('supplierhub');

db.createCollection('users');
db.createCollection('sellers');
db.createCollection('suppliers');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('order_items');
db.createCollection('billing');
db.createCollection('notifications');
db.createCollection('shopee_tokens');

db.users.createIndex({ email: 1 }, { unique: true });
db.sellers.createIndex({ user_id: 1 }, { unique: true });
db.sellers.createIndex({ shopee_shop_id: 1 });
db.suppliers.createIndex({ seller_id: 1 });
db.products.createIndex({ seller_id: 1 });
db.products.createIndex({ shopee_product_id: 1 });
db.orders.createIndex({ seller_id: 1 });
db.orders.createIndex({ shopee_order_id: 1 });
db.orders.createIndex({ supplier_id: 1 });
db.order_items.createIndex({ order_id: 1 });
db.billing.createIndex({ seller_id: 1 });
db.billing.createIndex({ order_id: 1 });
db.notifications.createIndex({ user_id: 1 });
db.notifications.createIndex({ read: 1 });
db.shopee_tokens.createIndex({ seller_id: 1 }, { unique: true });

print('SupplierHub MongoDB initialized successfully');
