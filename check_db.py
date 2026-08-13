import os
import requests
import json

def check():
    url = os.environ.get("VITE_SUPABASE_URL")
    key = os.environ.get("VITE_SUPABASE_ANON_KEY")
    if not url or not key:
        print("Missing env vars")
        return

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
    
    # Listar slugs de produtos ativos
    res = requests.get(f"{url}/rest/v1/products?select=slug&active=eq.true&limit=1", headers=headers)
    if res.status_code == 200:
        data = res.json()
        if data:
            print(f"FOUND_SLUG:{data[0]['slug']}")
        else:
            print("NO_PRODUCTS_FOUND")
    else:
        print(f"ERROR: {res.status_code} - {res.text}")

if __name__ == "__main__":
    check()
