import hashlib
from functools import wraps
from flask import Blueprint, request, jsonify, session
from app.db import get_db_connection

auth_bp = Blueprint("auth", __name__)


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({
                "success": False,
                "message": "Authentication required",
                "redirect": "/login",
            }), 401
        return f(*args, **kwargs)
    return decorated_function


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data or "username" not in data or "password" not in data:
        return jsonify({
            "success": False,
            "message": "Username dan password harus diisi",
        }), 400

    username = data["username"]
    password = data["password"]
    hashed_password = hashlib.md5(password.encode()).hexdigest()

    connection = get_db_connection()
    if not connection:
        return jsonify({
            "success": False,
            "message": "Database connection error",
        }), 500

    try:
        cursor = connection.cursor(dictionary=True)
        select_query = """
            SELECT id, name, dr_id_number, email, username
            FROM users
            WHERE username = %s AND password = %s
        """
        cursor.execute(select_query, (username, hashed_password))
        user = cursor.fetchone()
        cursor.close()
        connection.close()

        if user:
            session["user_id"] = user["id"]
            session["username"] = user["username"]
            session["name"] = user["name"]
            session["dr_id_number"] = user["dr_id_number"]
            session["email"] = user["email"]

            return jsonify({
                "success": True,
                "message": "Login berhasil",
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "username": user["username"],
                    "dr_id_number": user["dr_id_number"],
                    "email": user["email"],
                },
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": "Username atau password salah",
            }), 401
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Error: {str(e)}",
        }), 500


@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({
        "success": True,
        "message": "Logout berhasil",
    }), 200


@auth_bp.route("/api/auth/check", methods=["GET"])
def check_auth():
    if "user_id" in session:
        return jsonify({
            "success": True,
            "authenticated": True,
            "user": {
                "id": session["user_id"],
                "name": session["name"],
                "username": session["username"],
                "dr_id_number": session["dr_id_number"],
                "email": session["email"],
            },
        }), 200
    else:
        return jsonify({
            "success": True,
            "authenticated": False,
            "message": "Not authenticated",
        }), 200
