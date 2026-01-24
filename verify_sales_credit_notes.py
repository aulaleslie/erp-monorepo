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

    # 5. Create Sales Invoice (to base CN on)
    print("\n--- Creating Base Invoice ---")
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
        "notes": "Base Invoice for Credit Note"
    }
    resp = session.post(f"{BASE_URL}/sales/invoices", json=invoice_data)
    if resp.status_code != 201:
        print(f"Failed to create invoice: {resp.text}")
        return
    invoice = resp.json().get('data')
    invoice_id = invoice['id']
    print(f"Invoice created. ID: {invoice_id}")
    print(json.dumps(invoice, indent=2))

    # 6. Post Invoice (required for CN)
    print("Posting Invoice...")
    # Submit
    session.post(f"{BASE_URL}/sales/invoices/{invoice_id}/submit")
    # Approve
    session.post(f"{BASE_URL}/sales/invoices/{invoice_id}/approve/0", json={"notes": "Auto approved"})
    # Post
    resp = session.post(f"{BASE_URL}/sales/invoices/{invoice_id}/post")
    if resp.status_code != 201:
        print(f"Failed to post invoice: {resp.text}")
        return
    print("Invoice posted.")

    # 7. Create Credit Note from Invoice
    print("\n--- Creating Credit Note ---")
    resp = session.post(f"{BASE_URL}/sales/invoices/{invoice_id}/credit-notes", json={"notes": "Damage credit"})
    if resp.status_code != 201:
        print(f"Failed to create credit note: {resp.text}")
        return
    credit_note = resp.json().get('data')
    cn_id = credit_note['id']
    print(f"Credit Note created. ID: {cn_id}, Number: {credit_note['number']}")
    
    # Validation: Items should be cloned
    if len(credit_note['items']) != len(invoice['items']):
        print(f"Error: Item count mismatch. CN: {len(credit_note['items'])}, INV: {len(invoice['items'])}")
        return
    print("Items cloned successfully.") 
    print(json.dumps(credit_note, indent=2))

    # 8. Update Credit Note
    print("\n--- Updating Credit Note ---")
    # Reduce quantity of first item
    item_to_update = credit_note['items'][0]
    update_data = {
        "items": [
            {
                "itemId": item_to_update['itemId'],
                "quantity": 1, # Return only 1 instead of 5
                "unitPrice": item_to_update['unitPrice'],
                "discountPercent": 0
            }
        ]
    }
    resp = session.put(f"{BASE_URL}/sales/credit-notes/{cn_id}", json=update_data)
    if resp.status_code != 200:
        print(f"Failed to update CN: {resp.text}")
        return
    updated_cn = resp.json().get('data')
    print(f"Credit Note updated. New Total: {updated_cn['total']}")

    # 9. Submit Credit Note
    print("\n--- Submitting Credit Note ---")
    resp = session.post(f"{BASE_URL}/sales/credit-notes/{cn_id}/submit")
    if resp.status_code != 201:
        print(f"Failed to submit CN: {resp.text}")
        return
    print("Credit Note submitted.")

    # 10. Approve Credit Note
    print("\n--- Approving Credit Note ---")
    resp = session.post(f"{BASE_URL}/sales/credit-notes/{cn_id}/approve/0", json={"notes": "Approved return"})
    if resp.status_code != 201:
        print(f"Failed to approve CN: {resp.text}")
        return
    print("Credit Note approved.")

    # 11. Post Credit Note
    print("\n--- Posting Credit Note ---")
    resp = session.post(f"{BASE_URL}/sales/credit-notes/{cn_id}/post")
    if resp.status_code != 201:
        print(f"Failed to post CN: {resp.text}")
        return
    final_cn = resp.json().get('data')
    print(f"Credit Note posted. Status: {final_cn['status']}")

    print("\n--- Credit Note Flow Verified Successfully! ---")

if __name__ == "__main__":
    verify()
