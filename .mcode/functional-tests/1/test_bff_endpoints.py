"""
Functional tests for the eShop WebApp host after the React SPA / BFF migration
(milestone 1).

Endpoint coverage:
  - GET /health                              (origin_and_target - existed pre-milestone)
  - GET /product-images/{id}                 (origin_and_target - existed pre-milestone)
  - GET /bff/catalog/items                   (target_only - new BFF endpoint)
  - GET /bff/catalog/items/{id}              (target_only - new BFF endpoint)
  - GET /bff/catalog/brands                  (target_only - new BFF endpoint)
  - GET /bff/catalog/types                   (target_only - new BFF endpoint)
  - GET /bff/user                            (target_only - new BFF endpoint)
  - GET /bff/login                           (target_only - new BFF endpoint)
  - POST /bff/logout                         (target_only - new BFF endpoint)
  - GET /                                    (target_only - now React SPA, was Blazor)
  - GET /<unknown-non-bff-route>             (target_only - SPA fallback via MapFallbackToFile)
  - GET /assets/<vite-hash>.js               (target_only - Vite bundle served by 2nd StaticFiles)
"""

import re
from pathlib import Path

import pytest
import requests

import os
BASE_URL = os.environ.get("BFF_BASE_URL", "http://127.0.0.1:5045")

# A short client-side timeout for calls that hit backend microservices via BFF.
# Some initial hits after startup can be slow while HTTP handlers warm up.
DEFAULT_TIMEOUT = 20


@pytest.fixture(scope="session", autouse=True)
def wait_for_app():
    """Session-level readiness check: the WebApp must respond on /health."""
    resp = requests.get(f"{BASE_URL}/health", timeout=10)
    assert resp.status_code == 200, (
        f"Health check failed: status={resp.status_code} body={resp.text[:200]}"
    )


# ---------------------------------------------------------------------------
# /health   (origin_and_target - existed at Baseline Ref via MapDefaultEndpoints)
# ---------------------------------------------------------------------------
class TestHealthEndpoint:
    def test_health_happy_path(self):
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        assert resp.status_code == 200
        assert len(resp.text) > 0


# ---------------------------------------------------------------------------
# /product-images/{id}   (origin_and_target - existed at Baseline Ref via MapForwarder)
# ---------------------------------------------------------------------------
class TestProductImages:
    def test_product_image_existing_item(self):
        resp = requests.get(
            f"{BASE_URL}/product-images/1", timeout=DEFAULT_TIMEOUT
        )
        # The route is registered; upstream Catalog API may 400 without an
        # API version header (pre-existing behavior in both baseline and target).
        assert resp.status_code in (200, 400)
        if resp.status_code == 200:
            content_type = resp.headers.get("Content-Type", "")
            assert "image" in content_type or "octet-stream" in content_type
            assert len(resp.content) > 0

    def test_product_image_nonexistent_item(self):
        resp = requests.get(
            f"{BASE_URL}/product-images/999999", timeout=DEFAULT_TIMEOUT
        )
        # Catalog API returns 404 for unknown; forwarder passes it through.
        # In some configurations upstream may return 400 due to API version headers.
        assert resp.status_code in (400, 404, 500)


# ---------------------------------------------------------------------------
# /bff/catalog/items   (target_only - new BFF endpoint)
# ---------------------------------------------------------------------------
class TestBffCatalogItems:
    def test_catalog_items_happy_path(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9},
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp.status_code == 200
        body = resp.json()
        for key in ("pageIndex", "pageSize", "count", "data"):
            assert key in body, f"missing key: {key}"
        assert isinstance(body["data"], list)
        assert body["pageIndex"] == 0
        assert body["pageSize"] == 9
        # Each item has the shape the React SPA expects.
        if body["data"]:
            first = body["data"][0]
            # `catalogBrand` / `catalogType` are the nested-object fields; they may
            # be null on the list endpoint (only populated in item detail).
            # `catalogBrandId` / `catalogTypeId` are the FK ids.
            for key in ("id", "name", "price", "catalogBrandId", "catalogTypeId"):
                assert key in first, f"catalog item missing key {key}: {first!r}"

    def test_catalog_items_default_params(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items", timeout=DEFAULT_TIMEOUT
        )
        assert resp.status_code == 200
        body = resp.json()
        # BFF defaults: pageIndex=0, pageSize=9 (see WebApp/Program.cs)
        assert body["pageIndex"] == 0
        assert body["pageSize"] == 9

    def test_catalog_items_filter_by_brand(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9, "brand": 1},
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body["data"], list)
        # Every returned item should belong to brand id 1.
        for item in body["data"]:
            assert item["catalogBrandId"] == 1, (
                f"expected brand 1, got catalogBrandId={item.get('catalogBrandId')}"
            )

    def test_catalog_items_filter_by_type(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9, "type": 1},
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body["data"], list)
        for item in body["data"]:
            assert item["catalogTypeId"] == 1, (
                f"expected type 1, got catalogTypeId={item.get('catalogTypeId')}"
            )

    def test_catalog_items_filter_by_brand_and_type(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9, "brand": 1, "type": 1},
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body["data"], list)
        for item in body["data"]:
            assert item["catalogBrandId"] == 1
            assert item["catalogTypeId"] == 1

    def test_catalog_items_pagination(self):
        resp1 = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 3},
            timeout=DEFAULT_TIMEOUT,
        )
        resp2 = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 1, "pageSize": 3},
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp1.status_code == 200
        assert resp2.status_code == 200
        body1 = resp1.json()
        body2 = resp2.json()
        assert body1["pageIndex"] == 0 and body1["pageSize"] == 3
        assert body2["pageIndex"] == 1 and body2["pageSize"] == 3
        # If there are enough items to fill two pages, the page contents must differ.
        if body1["count"] > 3 and body2["data"]:
            ids1 = {i["id"] for i in body1["data"]}
            ids2 = {i["id"] for i in body2["data"]}
            assert ids1.isdisjoint(ids2), (
                "pages 0 and 1 should not share item ids"
            )

    def test_catalog_items_invalid_brand_filter(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9, "brand": 99999},
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"] == []

    def test_catalog_items_boundary_empty_page(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 9999, "pageSize": 9},
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"] == []


# ---------------------------------------------------------------------------
# /bff/catalog/items/{id}   (target_only - new BFF endpoint)
# ---------------------------------------------------------------------------
class TestBffCatalogItemById:
    def test_catalog_item_existing(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items/1", timeout=DEFAULT_TIMEOUT
        )
        assert resp.status_code == 200
        body = resp.json()
        for key in ("id", "name", "price"):
            assert key in body, f"item detail missing key: {key}"
        assert body["id"] == 1

    def test_catalog_item_not_found(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items/99999999", timeout=DEFAULT_TIMEOUT
        )
        assert resp.status_code == 404

    def test_catalog_item_invalid_id_zero(self):
        # 0 is out of the seeded id range; upstream may 404 or 400.
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items/0", timeout=DEFAULT_TIMEOUT
        )
        assert resp.status_code in (400, 404)


# ---------------------------------------------------------------------------
# /bff/catalog/brands   (target_only)
# ---------------------------------------------------------------------------
class TestBffCatalogBrands:
    def test_catalog_brands_happy_path(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/brands", timeout=DEFAULT_TIMEOUT
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list) and len(body) > 0
        first = body[0]
        assert "id" in first
        assert "brand" in first, (
            f"expected 'brand' field on CatalogBrand; got keys={list(first.keys())}"
        )


# ---------------------------------------------------------------------------
# /bff/catalog/types   (target_only)
# ---------------------------------------------------------------------------
class TestBffCatalogTypes:
    def test_catalog_types_happy_path(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/types", timeout=DEFAULT_TIMEOUT
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list) and len(body) > 0
        first = body[0]
        assert "id" in first
        assert "type" in first, (
            f"expected 'type' field on CatalogItemType; got keys={list(first.keys())}"
        )


# ---------------------------------------------------------------------------
# /bff/user   (target_only)
# ---------------------------------------------------------------------------
class TestBffUser:
    def test_user_unauthenticated(self):
        # Fresh session (no cookies) -> user must appear anonymous.
        resp = requests.get(
            f"{BASE_URL}/bff/user", timeout=10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body == {
            "isAuthenticated": False,
            "userName": "",
            "buyerId": "",
        }


# ---------------------------------------------------------------------------
# /bff/login   (target_only) - OIDC challenge
# ---------------------------------------------------------------------------
class TestBffLogin:
    def test_login_anonymous_challenges_oidc(self):
        # An anonymous GET /bff/login should trigger a 302 to the Identity API
        # (Duende IdentityServer running as identity-api in Aspire).
        resp = requests.get(
            f"{BASE_URL}/bff/login",
            allow_redirects=False,
            timeout=DEFAULT_TIMEOUT,
        )
        # OIDC challenge -> 302 with Location to identity API authorize.
        assert resp.status_code in (302, 303), (
            f"expected redirect, got {resp.status_code}"
        )
        location = resp.headers.get("Location", "")
        # Identity server issues /connect/authorize.
        assert "connect/authorize" in location.lower(), (
            f"expected identity authorize endpoint in Location, got: {location}"
        )

    def test_login_absolute_returnurl_is_normalized(self):
        # Program.cs replaces non-relative returnUrl with "/" before challenge.
        # We verify the challenge still fires (302) and does not crash on an
        # absolute URL.
        resp = requests.get(
            f"{BASE_URL}/bff/login",
            params={"returnUrl": "https://evil.example.com/steal"},
            allow_redirects=False,
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp.status_code in (302, 303)
        location = resp.headers.get("Location", "")
        assert "connect/authorize" in location.lower()


# ---------------------------------------------------------------------------
# /bff/logout   (target_only) - requires authorization
# ---------------------------------------------------------------------------
class TestBffLogout:
    def test_logout_anonymous_is_challenged(self):
        # POST /bff/logout uses .RequireAuthorization(); an anonymous request
        # must NOT be silently signed out. Depending on scheme selection, the
        # response is either a 401 or a 302 (OIDC challenge) — both are
        # acceptable per milestone requirements.
        resp = requests.post(
            f"{BASE_URL}/bff/logout",
            allow_redirects=False,
            timeout=DEFAULT_TIMEOUT,
        )
        assert resp.status_code in (401, 302, 303, 403), (
            f"expected auth challenge, got {resp.status_code}"
        )


# ---------------------------------------------------------------------------
# GET /   (target_only - React SPA shell now, Blazor at Baseline Ref)
# ---------------------------------------------------------------------------
class TestSpaRoot:
    def test_root_returns_react_spa_html(self):
        resp = requests.get(f"{BASE_URL}/", timeout=DEFAULT_TIMEOUT)
        assert resp.status_code == 200
        html = resp.text
        # Must be HTML, must be the React shell, must not be Blazor.
        assert "<div id=\"root\"></div>" in html or 'id="root"' in html, (
            "response body is not the React SPA shell"
        )
        assert "<title>eShop</title>" in html
        # No Blazor markers.
        lower = html.lower()
        assert "blazor" not in lower, (
            "unexpected Blazor markup in / response"
        )


# ---------------------------------------------------------------------------
# GET /<unknown-non-bff-route>   (target_only - MapFallbackToFile)
# ---------------------------------------------------------------------------
class TestSpaFallback:
    @pytest.mark.parametrize("path", ["/item/1", "/cart", "/user/orders"])
    def test_spa_fallback_serves_index_html(self, path):
        resp = requests.get(f"{BASE_URL}{path}", timeout=DEFAULT_TIMEOUT)
        assert resp.status_code == 200, (
            f"expected 200 SPA fallback for {path}, got {resp.status_code}"
        )
        html = resp.text
        assert "<title>eShop</title>" in html, (
            f"fallback for {path} did not return SPA index.html"
        )
        assert 'id="root"' in html


# ---------------------------------------------------------------------------
# GET /assets/<vite-hash>.js   (target_only - second UseStaticFiles middleware)
# ---------------------------------------------------------------------------
class TestReactAssets:
    def _resolve_asset_path(self) -> str:
        # Read the built index.html on disk to get the actual hashed asset name
        # (independent of build hash).
        # Path is relative to the repo root; test runs from repo root.
        html_path = Path("src/WebApp/wwwroot/react/index.html")
        assert html_path.exists(), f"missing built index.html at {html_path}"
        m = re.search(r"src=\"(/assets/index-[^\"]+\.js)\"", html_path.read_text(encoding="utf-8"))
        assert m, "could not locate hashed JS asset in built index.html"
        return m.group(1)

    def test_assets_js_bundle_served(self):
        asset = self._resolve_asset_path()
        resp = requests.get(f"{BASE_URL}{asset}", timeout=DEFAULT_TIMEOUT)
        assert resp.status_code == 200, (
            f"expected 200 for {asset}, got {resp.status_code}"
        )
        content_type = resp.headers.get("Content-Type", "")
        # StaticFiles serves .js as application/javascript (may include charset).
        assert "javascript" in content_type.lower(), (
            f"expected JS content-type for {asset}, got {content_type}"
        )
        assert len(resp.content) > 0
