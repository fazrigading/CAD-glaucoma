from flask_cors import CORS


def init_cors(app):
    CORS(
        app,
        supports_credentials=True,
        origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5000", "http://localhost:5000"],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        expose_headers=["Content-Type", "Authorization"],
    )
