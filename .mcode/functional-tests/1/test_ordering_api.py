"""
Functional tests for the Ordering.API endpoints.
Validates the .NET 8 migration preserves all endpoint behavior.

The API uses query-string versioning: ?api-version=1.0
All endpoints require JWT Bearer authentication.
"""
import uuid
import requests
import pytest
import os
import time

ORDERING_API_PORT = os.environ.get("ORDERING_API_PORT", "5224")
BASE_URL = f"http://localhost:{ORDERING_API_PORT}"
API_BASE = f"{BASE_URL}/api/orders"
API_VERSION = "api-version=1.0"


def api_url(path="", extra_params=""):
    """Build a versioned API URL."""
    separator = "&" if "?" in path else "?"
    base = f"{API_BASE}{path}"
    if extra_params:
        return f"{base}{separator}{API_VERSION}&{extra_params}"
    return f"{base}{separator}{API_VERSION}"


# ---------------------------------------------------------------
# Health Endpoints (no auth required)
# ---------------------------------------------------------------
class TestHealthEndpoints:
    """Health check endpoints provided by ServiceDefaults."""

    def test_alive_endpoint(self):
        """GET /alive returns 200 (liveness probe)."""
        resp = requests.get(f"{BASE_URL}/alive", timeout=5)
        assert resp.status_code == 200


# ---------------------------------------------------------------
# Authentication Tests (no auth header)
# ---------------------------------------------------------------
class TestAuthRequired:
    """Verify all API endpoints require authentication."""

    def test_get_orders_without_auth(self):
        """GET /api/orders without auth returns 401."""
        resp = requests.get(api_url(), timeout=10)
        assert resp.status_code == 401

    def test_get_order_by_id_without_auth(self):
        """GET /api/orders/1 without auth returns 401."""
        resp = requests.get(api_url("/1"), timeout=10)
        assert resp.status_code == 401

    def test_get_cardtypes_without_auth(self):
        """GET /api/orders/cardtypes without auth returns 401."""
        resp = requests.get(api_url("/cardtypes"), timeout=10)
        assert resp.status_code == 401

    def test_create_order_without_auth(self):
        """POST /api/orders without auth returns 401."""
        resp = requests.post(
            api_url(),
            json={},
            headers={"x-requestid": str(uuid.uuid4())},
            timeout=10,
        )
        assert resp.status_code == 401

    def test_create_draft_without_auth(self):
        """POST /api/orders/draft without auth returns 401."""
        resp = requests.post(
            api_url("/draft"),
            json={"buyerId": "test", "items": []},
            timeout=10,
        )
        assert resp.status_code == 401

    def test_cancel_order_without_auth(self):
        """PUT /api/orders/cancel without auth returns 401."""
        resp = requests.put(
            api_url("/cancel"),
            json={"orderNumber": 1},
            headers={"x-requestid": str(uuid.uuid4())},
            timeout=10,
        )
        assert resp.status_code == 401

    def test_ship_order_without_auth(self):
        """PUT /api/orders/ship without auth returns 401."""
        resp = requests.put(
            api_url("/ship"),
            json={"orderNumber": 1},
            headers={"x-requestid": str(uuid.uuid4())},
            timeout=10,
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------
# API Version Required
# ---------------------------------------------------------------
class TestApiVersioning:
    """Verify API versioning is enforced."""

    def test_request_without_api_version(self, auth_headers):
        """GET /api/orders without api-version returns 400."""
        resp = requests.get(
            f"{API_BASE}", headers=auth_headers, timeout=10
        )
        assert resp.status_code == 400


# ---------------------------------------------------------------
# GET /api/orders/cardtypes - Card Types
# ---------------------------------------------------------------
class TestGetCardTypes:
    """GET /api/orders/cardtypes - card type enumeration."""

    def test_get_cardtypes_returns_200(self, auth_headers):
        """GET /api/orders/cardtypes returns 200 with card types list."""
        resp = requests.get(
            api_url("/cardtypes"), headers=auth_headers, timeout=10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)
        assert len(body) > 0
        for ct in body:
            assert "id" in ct
            assert "name" in ct

    def test_cardtypes_contains_known_types(self, auth_headers):
        """Card types include the standard set (Amex, Visa, MasterCard)."""
        resp = requests.get(
            api_url("/cardtypes"), headers=auth_headers, timeout=10
        )
        assert resp.status_code == 200
        body = resp.json()
        names = [ct["name"] for ct in body]
        assert "Amex" in names
        assert "Visa" in names
        assert "MasterCard" in names


# ---------------------------------------------------------------
# GET /api/orders - List Orders
# ---------------------------------------------------------------
class TestGetOrders:
    """GET /api/orders - list orders for authenticated user."""

    def test_get_orders_returns_200(self, auth_headers):
        """GET /api/orders returns 200 with a list."""
        resp = requests.get(
            api_url(), headers=auth_headers, timeout=10
        )
        assert resp.status_code == 200
        body = resp.json()
        assert isinstance(body, list)


# ---------------------------------------------------------------
# GET /api/orders/{orderId} - Get Order By ID
# ---------------------------------------------------------------
class TestGetOrderById:
    """GET /api/orders/{orderId} - get order by ID."""

    def test_get_nonexistent_order_returns_404(self, auth_headers):
        """GET /api/orders/99999 returns 404 for non-existent order."""
        resp = requests.get(
            api_url("/99999"), headers=auth_headers, timeout=10
        )
        assert resp.status_code == 404


# ---------------------------------------------------------------
# POST /api/orders/draft - Create Order Draft (in-memory)
# ---------------------------------------------------------------
class TestCreateOrderDraft:
    """POST /api/orders/draft - create an order draft (in-memory)."""

    def test_create_draft_with_items(self, auth_headers):
        """POST /api/orders/draft returns calculated total and items."""
        payload = {
            "buyerId": "test-buyer-1",
            "items": [
                {
                    "id": "item-1",
                    "productId": 1,
                    "productName": "Widget A",
                    "unitPrice": 10.50,
                    "oldUnitPrice": 10.50,
                    "quantity": 2,
                    "pictureUrl": "http://example.com/widget-a.png",
                },
                {
                    "id": "item-2",
                    "productId": 2,
                    "productName": "Widget B",
                    "unitPrice": 25.00,
                    "oldUnitPrice": 25.00,
                    "quantity": 1,
                    "pictureUrl": "http://example.com/widget-b.png",
                },
            ],
        }
        resp = requests.post(
            api_url("/draft"),
            json=payload,
            headers=auth_headers,
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "orderItems" in body
        assert "total" in body
        assert len(body["orderItems"]) == 2
        # Total = (10.50 * 2) + (25.00 * 1) = 46.00
        assert body["total"] == 46.00

    def test_create_draft_with_empty_items(self, auth_headers):
        """POST /api/orders/draft with empty items returns 0 total."""
        payload = {"buyerId": "test-buyer-2", "items": []}
        resp = requests.post(
            api_url("/draft"),
            json=payload,
            headers=auth_headers,
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["total"] == 0
        assert len(body["orderItems"]) == 0

    def test_create_draft_single_item(self, auth_headers):
        """POST /api/orders/draft with one item returns correct total."""
        payload = {
            "buyerId": "test-buyer-3",
            "items": [
                {
                    "id": "item-3",
                    "productId": 3,
                    "productName": "Gadget C",
                    "unitPrice": 99.99,
                    "oldUnitPrice": 99.99,
                    "quantity": 3,
                    "pictureUrl": "http://example.com/gadget-c.png",
                }
            ],
        }
        resp = requests.post(
            api_url("/draft"),
            json=payload,
            headers=auth_headers,
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        assert len(body["orderItems"]) == 1
        # Total = 99.99 * 3 = 299.97
        assert body["total"] == pytest.approx(299.97, abs=0.01)

    def test_draft_item_fields(self, auth_headers):
        """Verify draft response includes all expected item fields."""
        payload = {
            "buyerId": "test-buyer-4",
            "items": [
                {
                    "id": "item-4",
                    "productId": 42,
                    "productName": "Test Product",
                    "unitPrice": 15.00,
                    "oldUnitPrice": 15.00,
                    "quantity": 1,
                    "pictureUrl": "http://example.com/test.png",
                }
            ],
        }
        resp = requests.post(
            api_url("/draft"),
            json=payload,
            headers=auth_headers,
            timeout=10,
        )
        assert resp.status_code == 200
        body = resp.json()
        item = body["orderItems"][0]
        assert item["productId"] == 42
        assert item["productName"] == "Test Product"
        assert item["unitPrice"] == 15.00
        assert item["units"] == 1
        assert item["pictureUrl"] == "http://example.com/test.png"


# ---------------------------------------------------------------
# PUT /api/orders/cancel - Cancel Order
# ---------------------------------------------------------------
class TestCancelOrder:
    """PUT /api/orders/cancel - cancel an order."""

    def test_cancel_nonexistent_order_returns_500(self, auth_headers):
        """PUT /api/orders/cancel for non-existent order returns Problem 500.

        The API returns TypedResults.Problem(statusCode: 500) when the
        cancel command returns false (order not found).
        """
        request_id = str(uuid.uuid4())
        resp = requests.put(
            api_url("/cancel"),
            json={"orderNumber": 99999},
            headers={**auth_headers, "x-requestid": request_id},
            timeout=10,
        )
        assert resp.status_code == 500
        body = resp.json()
        assert body["detail"] == "Cancel order failed to process."

    def test_cancel_without_request_id(self, auth_headers):
        """PUT /api/orders/cancel without x-requestid returns 400.

        The requestId is a required Guid header parameter. Missing it
        causes ASP.NET Core to throw BadHttpRequestException.
        """
        resp = requests.put(
            api_url("/cancel"),
            json={"orderNumber": 1},
            headers=auth_headers,
            timeout=10,
        )
        assert resp.status_code == 400


# ---------------------------------------------------------------
# PUT /api/orders/ship - Ship Order
# ---------------------------------------------------------------
class TestShipOrder:
    """PUT /api/orders/ship - ship an order."""

    def test_ship_nonexistent_order_returns_500(self, auth_headers):
        """PUT /api/orders/ship for non-existent order returns Problem 500.

        The API returns TypedResults.Problem(statusCode: 500) when the
        ship command returns false (order not found).
        """
        request_id = str(uuid.uuid4())
        resp = requests.put(
            api_url("/ship"),
            json={"orderNumber": 99999},
            headers={**auth_headers, "x-requestid": request_id},
            timeout=10,
        )
        assert resp.status_code == 500
        body = resp.json()
        assert body["detail"] == "Ship order failed to process."

    def test_ship_without_request_id(self, auth_headers):
        """PUT /api/orders/ship without x-requestid returns 400."""
        resp = requests.put(
            api_url("/ship"),
            json={"orderNumber": 1},
            headers=auth_headers,
            timeout=10,
        )
        assert resp.status_code == 400


# ---------------------------------------------------------------
# POST /api/orders - Create Order
# ---------------------------------------------------------------
class TestCreateOrder:
    """POST /api/orders - create a new order."""

    def test_create_order_without_request_id(self, auth_headers):
        """POST /api/orders without x-requestid returns 400."""
        payload = {
            "userId": "test-user",
            "userName": "Test User",
            "city": "Redmond",
            "street": "123 Main St",
            "state": "WA",
            "country": "US",
            "zipCode": "98052",
            "cardNumber": "4111111111111111",
            "cardHolderName": "Test User",
            "cardExpiration": "2028-01-01T00:00:00Z",
            "cardSecurityNumber": "123",
            "cardTypeId": 1,
            "buyer": "test-buyer",
            "items": [],
        }
        resp = requests.post(
            api_url(),
            json=payload,
            headers=auth_headers,
            timeout=10,
        )
        assert resp.status_code == 400

    def test_create_order_success(self, auth_headers):
        """POST /api/orders with valid data creates an order."""
        request_id = str(uuid.uuid4())
        payload = {
            "userId": "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00",
            "userName": "ftrun_testuser",
            "city": "Redmond",
            "street": "123 Main St",
            "state": "WA",
            "country": "US",
            "zipCode": "98052",
            "cardNumber": "4111111111111111",
            "cardHolderName": "Test User",
            "cardExpiration": "2028-01-01T00:00:00Z",
            "cardSecurityNumber": "123",
            "cardTypeId": 1,
            "buyer": "ftrun_testbuyer",
            "items": [
                {
                    "id": "ftrun-item-1",
                    "productId": 1,
                    "productName": "FT Test Widget",
                    "unitPrice": 19.99,
                    "oldUnitPrice": 19.99,
                    "quantity": 1,
                    "pictureUrl": "http://example.com/ft-widget.png",
                }
            ],
        }
        resp = requests.post(
            api_url(),
            json=payload,
            headers={**auth_headers, "x-requestid": request_id},
            timeout=15,
        )
        assert resp.status_code == 200

    def test_create_order_then_retrieve(self, auth_headers):
        """Create an order and verify it appears in the user's order list."""
        request_id = str(uuid.uuid4())
        payload = {
            "userId": "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00",
            "userName": "ftrun_testuser",
            "city": "Seattle",
            "street": "456 Oak Ave",
            "state": "WA",
            "country": "US",
            "zipCode": "98101",
            "cardNumber": "5500000000000004",
            "cardHolderName": "FT Test User",
            "cardExpiration": "2029-06-01T00:00:00Z",
            "cardSecurityNumber": "456",
            "cardTypeId": 2,
            "buyer": "ftrun_testbuyer2",
            "items": [
                {
                    "id": "ftrun-item-2",
                    "productId": 2,
                    "productName": "FT Test Gadget",
                    "unitPrice": 49.99,
                    "oldUnitPrice": 49.99,
                    "quantity": 2,
                    "pictureUrl": "http://example.com/ft-gadget.png",
                }
            ],
        }
        # Create the order
        create_resp = requests.post(
            api_url(),
            json=payload,
            headers={**auth_headers, "x-requestid": request_id},
            timeout=15,
        )
        assert create_resp.status_code == 200

        # Wait briefly for async processing
        time.sleep(1)

        # List orders for this user - should have at least one
        list_resp = requests.get(
            api_url(), headers=auth_headers, timeout=10
        )
        assert list_resp.status_code == 200
        orders = list_resp.json()
        assert len(orders) >= 1

        # Get the latest order by order number
        order_number = orders[-1]["orderNumber"]
        detail_resp = requests.get(
            api_url(f"/{order_number}"), headers=auth_headers, timeout=10
        )
        assert detail_resp.status_code == 200
        order = detail_resp.json()
        assert order["orderNumber"] == order_number
        assert order["status"] is not None
        assert "orderItems" in order

    def test_create_order_idempotency(self, auth_headers):
        """Same x-requestid should not create duplicate orders."""
        request_id = str(uuid.uuid4())
        payload = {
            "userId": "9e3163b9-1ae6-4652-9dc6-7898ab7b7a00",
            "userName": "ftrun_testuser",
            "city": "Portland",
            "street": "789 Pine St",
            "state": "OR",
            "country": "US",
            "zipCode": "97201",
            "cardNumber": "378282246310005",
            "cardHolderName": "FT Idempotent User",
            "cardExpiration": "2029-12-01T00:00:00Z",
            "cardSecurityNumber": "789",
            "cardTypeId": 1,
            "buyer": "ftrun_idempotent",
            "items": [
                {
                    "id": "ftrun-item-idem",
                    "productId": 5,
                    "productName": "Idempotent Widget",
                    "unitPrice": 5.00,
                    "oldUnitPrice": 5.00,
                    "quantity": 1,
                    "pictureUrl": "http://example.com/idem.png",
                }
            ],
        }
        headers = {**auth_headers, "x-requestid": request_id}

        # First request
        resp1 = requests.post(
            api_url(), json=payload, headers=headers, timeout=15
        )
        assert resp1.status_code == 200

        time.sleep(1)

        # Count orders before second request
        list_before = requests.get(
            api_url(), headers=auth_headers, timeout=10
        )
        count_before = len(list_before.json())

        # Same request ID - should be idempotent
        resp2 = requests.post(
            api_url(), json=payload, headers=headers, timeout=15
        )
        assert resp2.status_code == 200

        time.sleep(1)

        # Count should not have increased
        list_after = requests.get(
            api_url(), headers=auth_headers, timeout=10
        )
        count_after = len(list_after.json())
        assert count_after == count_before
