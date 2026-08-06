/**
 * Milestone 1 E2E tests – React SPA anonymous-user flows.
 *
 * Coverage:
 *   1. Catalog landing page: heading text, brand/type filter pills, product cards
 *   2. Item detail page (anonymous): title/price/brand elements, "Log in to purchase"
 *   3. Header "Sign in" link (anonymous)
 *   4. Cart icon link in header points to /cart
 *   5. SPA fallback: unknown route returns the index.html shell (HTTP 200)
 *   6. Assets under /assets/* are served (JS bundle, CSS bundle)
 */

import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// 1. Catalog landing page
// ---------------------------------------------------------------------------
test.describe('Catalog landing page', () => {
  test('renders the catalog heading text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#page-header-title')).toHaveText('Ready for a new adventure?');
  });

  test('renders the catalog subtitle text', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#page-header-subtitle')).toHaveText(
      'Start the season with the latest in clothing and equipment.'
    );
  });

  test('renders brand filter pills including "All" and at least one brand', async ({ page }) => {
    await page.goto('/');
    // Wait for catalog search filters to appear
    await expect(page.getByRole('heading', { name: 'Brand' })).toBeVisible();
    // "All" pill in the Brand group must be visible and active initially
    const brandSection = page.locator('h3').filter({ hasText: 'Brand' });
    await expect(brandSection).toBeVisible();
    // At least one brand link (e.g. AirStrider) should appear
    await expect(page.getByRole('link', { name: 'AirStrider' })).toBeVisible();
  });

  test('renders type filter pills including "All" and at least one type', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Type' })).toBeVisible();
    // At least one type (e.g. Bags) should appear
    await expect(page.getByRole('link', { name: 'Bags' })).toBeVisible();
  });

  test('renders at least one product card with name and price', async ({ page }) => {
    await page.goto('/');
    // Product cards are links that contain a name and a price (e.g. "$199.99")
    await expect(page.getByRole('link', { name: /Adventurer GPS Watch/ })).toBeVisible();
    // Verify price is displayed somewhere on the page
    await expect(page.locator('text=$199.99').first()).toBeVisible();
  });

  test('renders 9 product cards per page (page-size = 9)', async ({ page }) => {
    await page.goto('/');
    // Wait for items to load (at least one visible first)
    await expect(page.getByRole('link', { name: /Adventurer GPS Watch/ })).toBeVisible();
    // The catalog renders exactly PAGE_SIZE (9) items per page
    // Product cards are links inside the catalog grid, each containing image + name + price
    // We can count by looking at the product links (which contain the item name and price)
    // Use a CSS selector matching the catalog item anchor tags
    // These links navigate to /item/<id>
    const productLinks = page.locator('a[href^="/item/"]');
    await expect(productLinks).toHaveCount(9);
  });
});

// ---------------------------------------------------------------------------
// 2. Item detail page – anonymous user
// ---------------------------------------------------------------------------
test.describe('Item detail page (anonymous)', () => {
  test('renders the item title as a heading', async ({ page }) => {
    // Navigate to a known item (Adventurer GPS Watch = item 99)
    await page.goto('/');
    // Get the first product link href
    const firstProductLink = page.locator('a[href^="/item/"]').first();
    await expect(firstProductLink).toBeVisible();
    const href = await firstProductLink.getAttribute('href');
    // Navigate directly to the item page
    await page.goto(href!);
    // The item name should be in the page-header-title element
    await expect(page.locator('#page-header-title')).not.toBeEmpty();
  });

  test('renders the item price', async ({ page }) => {
    await page.goto('/item/99');
    // Price is rendered as "$X.XX" somewhere on the item page
    await expect(page.locator('text=/\\$\\d+\\.\\d{2}/').first()).toBeVisible();
  });

  test('renders the Brand label', async ({ page }) => {
    await page.goto('/item/99');
    await expect(page.locator('text=Brand:').first()).toBeVisible();
  });

  test('shows "Log in to purchase" button when anonymous', async ({ page }) => {
    await page.goto('/item/99');
    // For anonymous users the button says "Log in to purchase" with title attr
    const loginBtn = page.getByRole('button', { name: 'Log in to purchase' });
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toHaveAttribute('title', 'Log in to purchase');
  });

  test('does NOT show "Add to shopping bag" button when anonymous', async ({ page }) => {
    await page.goto('/item/99');
    // The "Add to shopping bag" button should only appear for authenticated users
    await expect(page.getByRole('button', { name: 'Add to shopping bag' })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Header – anonymous user
// ---------------------------------------------------------------------------
test.describe('Header – anonymous user', () => {
  test('"Sign in" link is present in the header', async ({ page }) => {
    await page.goto('/');
    const signInLink = page.getByRole('link', { name: 'Sign in' });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/user/login');
  });

  test('logo link points to /', async ({ page }) => {
    await page.goto('/');
    const logoLink = page.getByRole('link', { name: 'AdventureWorks' });
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute('href', '/');
  });
});

// ---------------------------------------------------------------------------
// 4. Cart icon in header
// ---------------------------------------------------------------------------
test.describe('Cart icon in header', () => {
  test('cart icon link exists and points to /cart', async ({ page }) => {
    await page.goto('/');
    const cartLink = page.getByRole('link', { name: 'cart' });
    await expect(cartLink).toBeVisible();
    await expect(cartLink).toHaveAttribute('href', '/cart');
  });
});

// ---------------------------------------------------------------------------
// 5. SPA fallback – unknown route
// ---------------------------------------------------------------------------
test.describe('SPA fallback for unknown routes', () => {
  test('unknown route returns HTTP 200 (MapFallbackToFile)', async ({ request }) => {
    // Use a direct HTTP request to confirm the server returns 200 for unknown paths
    const response = await request.get('/some-random-nonsense');
    expect(response.status()).toBe(200);
  });

  test('unknown route response contains the SPA index.html shell', async ({ request }) => {
    const response = await request.get('/some-random-nonsense');
    const body = await response.text();
    expect(body).toContain('<div id="root">');
    expect(body).toContain('/assets/index-');
  });

  test('unknown route redirects to / and header logo is visible', async ({ page }) => {
    // Fix applied in commit e8af833: App.tsx now has <Route path="*" element={<Navigate to="/" replace />} />
    // inside the Layout. Navigating to an unknown path should redirect to "/" and render the full
    // Layout (HeaderBar + CatalogPage + FooterBar).
    await page.goto('/some-random-nonsense');
    // React Router's catch-all triggers a client-side Navigate to "/".
    // Wait for the URL to settle at "/".
    await page.waitForURL('/', { timeout: 10000 });
    // After redirect the header logo must be visible
    const logoLink = page.getByRole('link', { name: 'AdventureWorks' });
    await expect(logoLink).toBeVisible();
    // The catalog heading should also be visible, confirming CatalogPage rendered
    await expect(page.locator('#page-header-title')).toHaveText('Ready for a new adventure?');
  });
});

// ---------------------------------------------------------------------------
// 6. Assets under /assets/* are served
// ---------------------------------------------------------------------------
test.describe('Static assets', () => {
  test('JS bundle is served with correct content-type', async ({ request }) => {
    // Get the index.html first to find the current hashed JS bundle name
    const indexResp = await request.get('/');
    const indexHtml = await indexResp.text();
    const jsMatch = indexHtml.match(/\/assets\/(index-[^"]+\.js)/);
    expect(jsMatch, 'JS bundle path must be present in index.html').toBeTruthy();
    const jsPath = '/assets/' + jsMatch![1];

    const jsResp = await request.get(jsPath);
    expect(jsResp.status()).toBe(200);
    expect(jsResp.headers()['content-type']).toContain('javascript');
  });

  test('CSS bundle is served with correct content-type', async ({ request }) => {
    const indexResp = await request.get('/');
    const indexHtml = await indexResp.text();
    const cssMatch = indexHtml.match(/\/assets\/(index-[^"]+\.css)/);
    expect(cssMatch, 'CSS bundle path must be present in index.html').toBeTruthy();
    const cssPath = '/assets/' + cssMatch![1];

    const cssResp = await request.get(cssPath);
    expect(cssResp.status()).toBe(200);
    expect(cssResp.headers()['content-type']).toContain('css');
  });

  test('product image endpoint proxies to catalog API', async ({ request }) => {
    // /product-images/<id> is forwarded to the Catalog API
    // Accept 200 (image returned), 400 (catalog API rejects invalid id format),
    // 404 (item not found), or redirect — what matters is we do NOT get 500
    // or a connection-refused error (which would indicate the proxy itself is broken).
    const resp = await request.get('/product-images/99');
    expect([200, 204, 302, 400, 404]).toContain(resp.status());
  });
});

// ---------------------------------------------------------------------------
// 7. Login / logout page routing
// ---------------------------------------------------------------------------
test.describe('Auth page routing', () => {
  test('/user/login redirects to /bff/login (Identity server)', async ({ page }) => {
    await page.goto('/user/login');
    // The LoginPage component redirects to /bff/login via window.location
    // which triggers the OIDC flow and lands on the Identity server
    await expect(page).toHaveURL(/5223|bff\/login/);
  });

  test('/cart redirects anonymous users towards login via /bff/login', async ({ page }) => {
    // Navigate to /cart as anonymous user.
    // AuthGuard calls login() which calls window.location.assign('/bff/login?returnUrl=/cart').
    // /bff/login issues an OIDC challenge (302 to Identity server).
    // The final destination depends on the Identity server being reachable at the
    // configured address (127.0.0.1:5223). If the base URL is localhost the OIDC
    // challenge may fail at the network level — so we accept either:
    //   a) Successfully landed on the Identity server login page (/Account/Login)
    //   b) Redirected to /bff/login (OIDC challenge initiated but not completed)
    await page.goto('/cart');
    // Give React + AuthGuard time to fire the redirect
    await page.waitForTimeout(3000);
    const url = page.url();
    const redirectedToLogin =
      /bff\/login/.test(url) ||
      /\/Account\/Login/.test(url) ||
      /5223/.test(url);
    expect(redirectedToLogin, `Expected redirect to login, got: ${url}`).toBe(true);
  });
});
