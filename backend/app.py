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
    conn = None
    try:
        # 添加调试日志
        print("Received request:", request.form)
        print("Files:", request.files)
        
        # 获取表单数据
        data = request.form.to_dict()
        
        # 处理图片上传
        image_path = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                # 先不保存文件，等数据库操作成功后再保存

        # 存储到MySQL（使用事务）
        conn = get_mysql_connection()
        conn.begin()  # 开始事务
        cursor = conn.cursor()
        
        sql = """
        INSERT INTO users (name, email, phone, address, birth_date, mood, image_path)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            data['name'],
            data['email'],
            data['phone'],
            data['address'],
            data['birth_date'],
            data.get('mood', None),
            image_path
        )
        print("SQL values:", values)
        
        cursor.execute(sql, values)
        user_id = cursor.lastrowid
        
        # 如果有图片，现在保存它
        if 'image' in request.files and file and file.filename and allowed_file(file.filename):
            file.save(file_path)
            image_path = filename
            # 更新图片路径
            cursor.execute("UPDATE users SET image_path = %s WHERE id = %s", (image_path, user_id))
        
        # 提交事务
        conn.commit()
        print("Data saved to MySQL, user_id:", user_id)
        
        return jsonify({'status': 'success', 'user_id': user_id})
    
    except Exception as e:
        print("Error:", str(e))  # 添加错误日志
        if conn:
            conn.rollback()  # 发生错误时回滚事务
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
    finally:
        if conn:
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
    app.run(debug=True, host='0.0.0.0', port=5001) 