from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import redis
from pymongo import MongoClient
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# MySQL配置
mysql_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '123456',
    'database': 'user_info'
}

# Redis配置
redis_client = redis.Redis(host='localhost', port=6379, db=0)

# MongoDB配置
mongo_client = MongoClient('mongodb://localhost:27017/')
mongo_db = mongo_client['user_info']
mongo_collection = mongo_db['user_logs']

def get_mysql_connection():
    return pymysql.connect(**mysql_config)

@app.route('/api/submit', methods=['POST'])
def submit_info():
    try:
        data = request.json
        if not data:
            return jsonify({'status': 'error', 'message': 'No data received'}), 400
            
        # 验证必要字段
        required_fields = ['name', 'email', 'phone', 'address', 'birth_date']
        for field in required_fields:
            if field not in data:
                return jsonify({'status': 'error', 'message': f'Missing field: {field}'}), 400
        
        # 存储到MySQL
        conn = get_mysql_connection()
        cursor = conn.cursor()
        
        sql = """
        INSERT INTO users (name, email, phone, address, birth_date)
        VALUES (%s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data['name'],
            data['email'],
            data['phone'],
            data['address'],
            data['birth_date']
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        # 存储到Redis缓存
        redis_client.setex(
            f"user:{user_id}",
            3600,  # 1小时过期
            json.dumps(data)
        )
        
        # 记录到MongoDB
        mongo_collection.insert_one({
            'user_id': user_id,
            'action': 'submit',
            'data': data,
            'timestamp': datetime.now()
        })
        
        return jsonify({'status': 'success', 'user_id': user_id})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
    finally:
        if 'conn' in locals():
            conn.close()

@app.route('/api/records', methods=['GET'])
def get_records():
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor(pymysql.cursors.DictCursor)  # 使用字典游标
        
        sql = """
        SELECT id, name, email, phone, address, 
               DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date,
               DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as created_at
        FROM users
        ORDER BY created_at DESC
        """
        cursor.execute(sql)
        records = cursor.fetchall()
        
        return jsonify({'status': 'success', 'records': records})
    
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000) 