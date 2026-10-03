"""
Minimal OIDC discovery mock server for functional testing.
Serves OpenID Connect discovery document and JWKS so that
the Ordering.API can validate self-signed JWT tokens.
"""
import os
import base64
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# Generate RSA key pair
private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
public_key = private_key.public_key()

# Export private key in PEM format for JWT signing
private_key_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode()

# Export public key numbers for JWKS
pub_numbers = public_key.public_numbers()

def int_to_base64url(n, length=None):
    """Convert an integer to base64url-encoded string."""
    n_bytes = n.to_bytes((n.bit_length() + 7) // 8, byteorder='big')
    if length and len(n_bytes) < length:
        n_bytes = b'\x00' * (length - len(n_bytes)) + n_bytes
    return base64.urlsafe_b64encode(n_bytes).rstrip(b'=').decode()

ISSUER = os.environ.get("MOCK_OIDC_ISSUER", "http://localhost:5223")
PORT = int(os.environ.get("MOCK_OIDC_PORT", "5223"))
KID = "test-key-1"

jwks = {
    "keys": [{
        "kty": "RSA",
        "use": "sig",
        "kid": KID,
        "alg": "RS256",
        "n": int_to_base64url(pub_numbers.n),
        "e": int_to_base64url(pub_numbers.e),
    }]
}

discovery = {
    "issuer": ISSUER,
    "authorization_endpoint": f"{ISSUER}/connect/authorize",
    "token_endpoint": f"{ISSUER}/connect/token",
    "userinfo_endpoint": f"{ISSUER}/connect/userinfo",
    "jwks_uri": f"{ISSUER}/.well-known/openid-configuration/jwks",
    "response_types_supported": ["code", "token", "id_token"],
    "subject_types_supported": ["public"],
    "id_token_signing_alg_values_supported": ["RS256"],
    "scopes_supported": ["openid", "profile", "orders"],
}

# Save private key for test scripts to use
key_file = os.path.join(os.path.dirname(__file__), "test_private_key.pem")
with open(key_file, "w") as f:
    f.write(private_key_pem)

# Also save KID
kid_file = os.path.join(os.path.dirname(__file__), "test_kid.txt")
with open(kid_file, "w") as f:
    f.write(KID)

# Flask server
from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/.well-known/openid-configuration")
def openid_config():
    return jsonify(discovery)

@app.route("/.well-known/openid-configuration/jwks")
def jwks_endpoint():
    return jsonify(jwks)

@app.route("/connect/authorize")
def authorize():
    return jsonify({"error": "not_implemented"}), 501

@app.route("/connect/token", methods=["POST"])
def token():
    return jsonify({"error": "not_implemented"}), 501

if __name__ == "__main__":
    print(f"Mock OIDC server starting on port {PORT}, issuer={ISSUER}", flush=True)
    app.run(host="0.0.0.0", port=PORT, debug=False)
