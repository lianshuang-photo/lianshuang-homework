from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pymysql
import redis
from pymongo import MongoClient
import json
from datetime import datetime
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
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

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

@app.route('/api/submit', methods=['POST'])
def submit_info():
    try:
        # 获取表单数据
        data = request.form.to_dict()
        
        # 处理图片上传
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # 使用时间戳确保文件名唯一
                filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                image_path = filename

        # 存储到MySQL
        conn = get_mysql_connection()
        cursor = conn.cursor()
        
        sql = """
        INSERT INTO users (name, email, phone, address, birth_date, mood, image_path)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(sql, (
            data['name'],
            data['email'],
            data['phone'],
            data['address'],
            data['birth_date'],
            data.get('mood', None),  # 可选字段
            image_path  # 可选字段
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
               mood,  # 添加 mood 字段
               image_path,  # 添加 image_path 字段
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

# 添加图片访问路由
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000) 