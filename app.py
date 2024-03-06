from flask import Flask, render_template, request, jsonify, abort
import logging
from logging.handlers import RotatingFileHandler
from db import get_db_connection
import mysql.connector

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html') 

@app.route('/get-tables', methods=['GET'])
def get_tables():
    try:
        connexion = get_db_connection()
        cursor = connexion.cursor()
        cursor.execute("SHOW TABLES;")
        tables = cursor.fetchall()
        table_names = [table[0] for table in tables]
        return jsonify(table_names)
    except mysql.connector.Error as err:
        print("Something went wrong: {}".format(err))
        abort(500)
    finally:
        cursor.close()
        connexion.close()

@app.route('/tables/<table_name>', methods=['GET'])
def get_table_data(table_name):
    connexion = get_db_connection()
    cursor = connexion.cursor(dictionary=True)
    try:
        query = f"SELECT * FROM `{table_name}`"
        cursor.execute(query)
        data = cursor.fetchall()
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connexion.close()

@app.route('/tables/<table_name>', methods=['POST'])
def add_table_data(table_name):
    connection = None
    cursor = None
    try:
        data = request.json
        columns = ', '.join(data.keys())
        values = ', '.join([f"'{value}'" for value in data.values()])
        query = f"INSERT INTO `{table_name}` ({columns}) VALUES ({values})"
        
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(query)
        connection.commit()
        
        return jsonify({"message": "Data added successfully"}), 201
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route('/tables/<table_name>/<int:data_id>', methods=['GET'])
def get_data(table_name, data_id):
    connexion = get_db_connection()
    cursor = connexion.cursor(dictionary=True)
    try:
        query = f"SELECT * FROM `{table_name}` WHERE TSECID = {data_id}"
        cursor.execute(query)
        data = cursor.fetchone()  
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connexion.close()


@app.route('/tables/<table_name>/<int:data_id>', methods=['PUT'])
def update_data(table_name, data_id):
    try:
        data = request.json
        updates = ', '.join([f"{key} = '{value}'" for key, value in data.items()])
        query = f"UPDATE `{table_name}` SET {updates} WHERE TSECID = {data_id}"
        
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(query)
        connection.commit()
        
        return jsonify({"message": "Data updated successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/tables/<table_name>/<int:data_id>', methods=['DELETE'])
def delete_data(table_name, data_id):
    try:
        query = f"DELETE FROM `{table_name}` WHERE TSECID = {data_id}"
        
        connection = get_db_connection()
        cursor = connection.cursor()
        cursor.execute(query)
        connection.commit()
        
        return jsonify({"message": "Data deleted successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/table-columns/<table_name>', methods=['GET'])
def get_table_columns(table_name):
    try:
        connexion = get_db_connection()
        cursor = connexion.cursor(dictionary=True)
        query = f"DESCRIBE `{table_name}`"
        cursor.execute(query)
        columns = cursor.fetchall()  
        return jsonify(columns)
    except mysql.connector.Error as err:
        print("Something went wrong: {}".format(err))
        abort(500)
    finally:
        cursor.close()
        connexion.close()

