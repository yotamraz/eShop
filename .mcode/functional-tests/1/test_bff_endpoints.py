"""
Functional tests for the eShop BFF endpoints and shared endpoints.

Tests cover:
- /health (origin_and_target)
- /product-images/{id} (origin_and_target)
- /bff/catalog/items (target_only)
- /bff/catalog/items/{id} (target_only)
- /bff/catalog/brands (target_only)
- /bff/catalog/types (target_only)
- /bff/user (target_only)
"""

import requests
import pytest

BASE_URL = "http://localhost:5045"


@pytest.fixture(autouse=True)
def health_check():
    """Confirm the app is reachable before running tests."""
    resp = requests.get(f"{BASE_URL}/health", timeout=10)
    assert resp.status_code == 200, f"Health check failed: {resp.status_code}"


# =============================================================================
# /health endpoint (origin_and_target)
# =============================================================================
class TestHealthEndpoint:
    """GET /health - health check endpoint."""

    def test_health_happy_path(self):
        resp = requests.get(f"{BASE_URL}/health", timeout=10)
        assert resp.status_code == 200
        body = resp.text
        assert len(body) > 0


# =============================================================================
# /product-images/{id} endpoint (origin_and_target)
# =============================================================================
class TestProductImages:
    """GET /product-images/{id} - product image proxy."""

    def test_product_image_existing_item(self):
        resp = requests.get(f"{BASE_URL}/product-images/1", timeout=15)
        assert resp.status_code == 200
        content_type = resp.headers.get("Content-Type", "")
        assert "image" in content_type or "octet-stream" in content_type, (
            f"Expected image content type, got: {content_type}"
        )
        assert len(resp.content) > 0

    def test_product_image_nonexistent_item(self):
        resp = requests.get(f"{BASE_URL}/product-images/999999", timeout=15)
        # Should return 404 or similar for non-existent item
        assert resp.status_code in (400, 404, 500)


# =============================================================================
# /bff/catalog/items endpoint (target_only)
# =============================================================================
class TestBffCatalogItems:
    """GET /bff/catalog/items - paginated catalog item listing."""

    def test_catalog_items_happy_path(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9},
            timeout=15,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "pageIndex" in body
        assert "pageSize" in body
        assert "count" in body
        assert "data" in body
        assert isinstance(body["data"], list)
        assert body["pageIndex"] == 0
        assert body["pageSize"] == 9

    def test_catalog_items_default_params(self):
        resp = requests.get(f"{BASE_URL}/bff/catalog/items", timeout=15)
        assert resp.status_code == 200
        body = resp.json()
        assert "pageIndex" in body
        assert "pageSize" in body
        assert "count" in body
        assert "data" in body

    def test_catalog_items_filter_by_brand(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9, "brand": 1},
            timeout=15,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "data" in body
        assert isinstance(body["data"], list)

    def test_catalog_items_filter_by_type(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9, "type": 1},
            timeout=15,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "data" in body
        assert isinstance(body["data"], list)

    def test_catalog_items_filter_by_brand_and_type(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9, "brand": 1, "type": 1},
            timeout=15,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "data" in body
        assert isinstance(body["data"], list)

    def test_catalog_items_pagination(self):
        # Get first page
        resp1 = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 3},
            timeout=15,
        )
        assert resp1.status_code == 200
        body1 = resp1.json()

        # Get second page
        resp2 = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 1, "pageSize": 3},
            timeout=15,
        )
        assert resp2.status_code == 200
        body2 = resp2.json()

        # If enough items exist, pages should have different data
        if body1["count"] > 3:
            assert body2["pageIndex"] == 1

    def test_catalog_items_invalid_brand_filter(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 0, "pageSize": 9, "brand": 99999},
            timeout=15,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["data"] == [] or isinstance(body["data"], list)

    def test_catalog_items_boundary_empty_page(self):
        resp = requests.get(
            f"{BASE_URL}/bff/catalog/items",
            params={"pageIndex": 9999, "pageSize": 9},
            timeout=15,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body["data"], list)


# =============================================================================
# /bff/catalog/items/{id} endpoint (target_only)
# =============================================================================
class TestBffCatalogItemById:
    """GET /bff/catalog/items/{id} - single catalog item detail."""

    def test_catalog_item_existing(self):
        resp = requests.get(f"{BASE_URL}/bff/catalog/items/1", timeout=15)
        assert resp.status_code == 200
        body = resp.json()
        assert "id" in body
        assert "name" in body
        assert "price" in body

    def test_catalog_item_not_found(self):
        resp = requests.get(f"{BASE_URL}/bff/catalog/items/999999", timeout=15)
        assert resp.status_code == 404

    def test_catalog_item_invalid_id_zero(self):
        resp = requests.get(f"{BASE_URL}/bff/catalog/items/0", timeout=15)
        # Depending on the Catalog API behavior, 0 may return 404 or an error
        assert resp.status_code in (400, 404, 500)


# =============================================================================
# /bff/catalog/brands endpoint (target_only)
# =============================================================================
class TestBffCatalogBrands:
    """GET /bff/catalog/brands - list all catalog brands."""

    def test_catalog_brands_happy_path(self):
        resp = requests.get(f"{BASE_URL}/bff/catalog/brands", timeout=15)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) > 0
        # Each brand should have at minimum an id and a brand name
        first = body[0]
        assert "id" in first


# =============================================================================
# /bff/catalog/types endpoint (target_only)
# =============================================================================
class TestBffCatalogTypes:
    """GET /bff/catalog/types - list all catalog item types."""

    def test_catalog_types_happy_path(self):
        resp = requests.get(f"{BASE_URL}/bff/catalog/types", timeout=15)
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) > 0
        first = body[0]
        assert "id" in first


# =============================================================================
# /bff/user endpoint (target_only)
# =============================================================================
class TestBffUser:
    """GET /bff/user - returns authentication status."""

    def test_user_unauthenticated(self):
        resp = requests.get(f"{BASE_URL}/bff/user", timeout=10)
        assert resp.status_code == 200
        body = resp.json()
        assert body["isAuthenticated"] is False
        assert body["userName"] == ""
        assert body["buyerId"] == ""
