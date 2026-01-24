import requests
import json
import sys

BASE_URL = "http://localhost:3001"
ADMIN_EMAIL = "admin@gym.com"
ADMIN_PASSWORD = "password123"

def verify():
    session = requests.Session()

    # 1. Login
    print("Logging in...")
    resp = session.post(f"{BASE_URL}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if resp.status_code not in [200, 201]:
        print(f"Login failed status {resp.status_code}: {resp.text}")
        return
    print("Login successful.")

    # 2. Get active tenant
    print("Getting active tenant...")
    resp = session.get(f"{BASE_URL}/me/tenants/active")
    tenant_id = None
    if resp.status_code == 200:
        data = resp.json().get('data')
        if data:
            tenant_id = data.get('id')
    
    if not tenant_id:
        print("No active tenant, picking one...")
        resp = session.get(f"{BASE_URL}/me/tenants")
        tenants_data = resp.json().get('data')
        if not tenants_data or not isinstance(tenants_data, list):
            print(f"Unexpected tenants data: {tenants_data}")
            return
        tenant_id = tenants_data[0].get('tenant', {}).get('id')
        if not tenant_id:
            print(f"Could not find ID in tenant data: {tenants_data[0]}")
            return
        print(f"Setting active tenant to {tenant_id}...")
        session.post(f"{BASE_URL}/me/tenants/active", json={"tenantId": tenant_id})
    
    print(f"Active Tenant ID: {tenant_id}")

    # 3. Find a Customer
    print("Finding a customer...")
    resp = session.get(f"{BASE_URL}/people?type=CUSTOMER")
    customers = resp.json().get('data', {}).get('items', [])
    if not customers:
        print("No customers found")
        return
    customer_id = customers[0]['id']
    print(f"Customer ID: {customer_id}")

    # 4. Find an Item
    print("Finding an item...")
    resp = session.get(f"{BASE_URL}/catalog/items")
    items_response = resp.json()
    items = items_response.get('data', {}).get('items', [])
    if not items:
        print(f"No items found. Response: {items_response}")
        return
    item_id = items[0]['id']
    item_price = items[0]['price']
    print(f"Item ID: {item_id}, Price: {item_price}")

    # 5. Create Sales Order
    print("Creating Sales Order...")
    order_data = {
        "documentDate": "2026-01-24",
        "deliveryDate": "2026-01-25",
        "personId": customer_id,
        "taxPricingMode": "INCLUSIVE",
        "items": [
            {
                "itemId": item_id,
                "quantity": 2,
                "unitPrice": item_price,
                "discountPercent": 10
            }
        ],
        "notes": "Testing Sales Order API"
    }
    resp = session.post(f"{BASE_URL}/sales/orders", json=order_data)
    if resp.status_code != 201:
        print(f"Failed to create order: {resp.text}")
        return
    order = resp.json().get('data')
    order_id = order['id']
    print(f"Order created successfully. ID: {order_id}, Number: {order['number']}")

    # 6. Submit Order
    print("Submitting Sales Order...")
    resp = session.post(f"{BASE_URL}/sales/orders/{order_id}/submit")
    if resp.status_code != 201:
        print(f"Failed to submit order: {resp.text}")
        return
    print("Order submitted.")

    # 7. Approve Order (Step 0)
    print("Approving Sales Order...")
    # We might need to check how many steps there are, but let's try step 0
    resp = session.post(f"{BASE_URL}/sales/orders/{order_id}/approve/0", json={"notes": "Approved by script"})
    if resp.status_code != 201:
        print(f"Failed to approve order: {resp.text}")
        # Maybe it's already approved or has different step logic
        return
    print("Order approved.")

    # 8. Convert to Invoice
    print("Converting Order to Invoice...")
    resp = session.post(f"{BASE_URL}/sales/orders/{order_id}/convert")
    if resp.status_code != 201:
        print(f"Failed to convert order: {resp.text}")
        return
    invoice = resp.json().get('data')
    print(f"Invoice created successfully. ID: {invoice['id']}, Number: {invoice['number']}")
    print("Flow verified successfully!")

if __name__ == "__main__":
    verify()
