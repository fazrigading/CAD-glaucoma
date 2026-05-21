import mysql.connector
from mysql.connector import Error
from flask import current_app


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=current_app.config["DB_HOST"],
            database=current_app.config["DB_NAME"],
            user=current_app.config["DB_USER"],
            password=current_app.config["DB_PASSWORD"],
        )
        return connection
    except Error as e:
        current_app.logger.error(f"Error connecting to database: {e}")
        return None
