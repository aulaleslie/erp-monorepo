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

    # 5. Create Sales Invoice (Direct)
    print("\n--- Testing Direct Invoice Creation ---")
    invoice_data = {
        "documentDate": "2026-01-24",
        "dueDate": "2026-02-24",
        "personId": customer_id,
        "taxPricingMode": "EXCLUSIVE",
        "items": [
            {
                "itemId": item_id,
                "quantity": 5,
                "unitPrice": item_price,
                "discountPercent": 0
            }
        ],
        "notes": "Testing Sales Invoice API Directly"
    }
    resp = session.post(f"{BASE_URL}/sales/invoices", json=invoice_data)
    if resp.status_code != 201:
        print(f"Failed to create invoice: {resp.text}")
        return
    invoice = resp.json().get('data')
    invoice_id = invoice['id']
    print(f"Invoice created successfully. ID: {invoice_id}, Number: {invoice['number']}")

    # 6. List Invoices with filter
    print("\n--- Testing List Invoices ---")
    resp = session.get(f"{BASE_URL}/sales/invoices?status=DRAFT&search={invoice['number']}")
    if resp.status_code != 200:
        print(f"Failed to list invoices: {resp.text}")
        return
    results = resp.json().get('data', {}).get('items', [])
    if len(results) == 0:
        print("Invoice not found in list")
        return
    print(f"Invoice found in list: {results[0]['number']}")

    # 7. Get Invoice Detail
    print("\n--- Testing Get Invoice Detail ---")
    resp = session.get(f"{BASE_URL}/sales/invoices/{invoice_id}")
    if resp.status_code != 200:
        print(f"Failed to get invoice detail: {resp.text}")
        return
    print(f"Invoice detail fetched: {resp.json().get('data')['number']}")

    # 8. Submit Invoice
    print("\n--- Testing Invoice Submission ---")
    resp = session.post(f"{BASE_URL}/sales/invoices/{invoice_id}/submit")
    if resp.status_code != 201:
        print(f"Failed to submit invoice: {resp.text}")
        return
    print("Invoice submitted.")

    # 9. Approve Invoice (Step 0)
    print("\n--- Testing Invoice Approval ---")
    resp = session.post(f"{BASE_URL}/sales/invoices/{invoice_id}/approve/0", json={"notes": "Approved by script"})
    if resp.status_code != 201:
        print(f"Failed to approve invoice: {resp.text}")
        return
    print("Invoice approved.")

    # 10. Post Invoice
    print("\n--- Testing Invoice Posting ---")
    resp = session.post(f"{BASE_URL}/sales/invoices/{invoice_id}/post")
    if resp.status_code != 201:
        print(f"Failed to post invoice: {resp.text}")
        return
    posted_invoice = resp.json().get('data')
    print(f"Invoice posted successfully. Status: {posted_invoice['status']}")

    print("\n--- Invoice Flow Verified Successfully! ---")

if __name__ == "__main__":
    verify()
