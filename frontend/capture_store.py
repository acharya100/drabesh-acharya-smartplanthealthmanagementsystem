import asyncio
from playwright.async_api import async_playwright
import os

ARTIFACT_DIR = r"c:\Users\Nitro\.gemini\antigravity\brain\13595786-bd16-4e5f-8e73-92744f3bf74b"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1920, "height": 1080})
        
        print("Logging in...")
        await page.goto('http://localhost:5173/')
        # Wait for login page to load
        await page.wait_for_selector('input[type="text"]')
        await page.fill('input[type="text"]', 'drabesh')
        await page.fill('input[type="password"]', 'acharya')
        await page.click('button[type="submit"]')
        await page.wait_for_url('**/dashboard', timeout=10000)
        
        print("Capturing Store...")
        await page.goto('http://localhost:5173/store')
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, 'store_view.png'))
        
        print("Capturing Cart...")
        await page.goto('http://localhost:5173/cart')
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, 'cart_view.png'))
        
        print("Capturing Orders...")
        await page.goto('http://localhost:5173/orders')
        await page.wait_for_timeout(2000)
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, 'orders_view.png'))
        
        await browser.close()
        print("Done.")

asyncio.run(main())
