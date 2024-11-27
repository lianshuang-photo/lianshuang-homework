
# 个人信息管理系统部署文档

## 系统概况
- **操作系统**：macOS / Ubuntu
- **Python版本**：3.13.0
- **数据库**：MySQL 8.0, Redis, MongoDB
- **Web服务器**：Nginx
- **WSGI服务器**：uWSGI
- **前端**：HTML, CSS, JavaScript
- **后端**：Flask

## 安装步骤

### 1. 基础软件安装

#### macOS 环境
使用 Homebrew 安装：

```bash
# 安装 Homebrew（如果没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装必要软件
brew install python
brew install mysql
brew install redis
brew install mongodb-community
brew install nginx
```

#### Ubuntu 环境
使用 apt 安装：

```bash
# 更新包列表
sudo apt update
sudo apt upgrade

# 安装 Python
sudo apt install python3 python3-pip python3-venv

# 安装 MySQL
sudo apt install mysql-server

# 安装 Redis
sudo apt install redis-server

# 安装 MongoDB
# 添加 MongoDB 源
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install mongodb-org

# 安装 Nginx
sudo apt install nginx
```

### 2. 项目结构设置

#### macOS 环境
创建项目目录结构：

```bash
# 创建项目目录
mkdir -p ~/Projects/personal_info_system
cd ~/Projects/personal_info_system

# 创建子目录
mkdir -p backend/uploads
mkdir -p frontend/{css,js}
mkdir nginx
```

#### Ubuntu 环境
创建项目目录结构：

```bash
# 创建项目目录
mkdir -p /var/www/personal_info_system
cd /var/www/personal_info_system

# 创建子目录
mkdir -p backend/uploads
mkdir -p frontend/{css,js}
mkdir nginx

# 设置目录权限
sudo chown -R $USER:$USER /var/www/personal_info_system
sudo chmod -R 755 /var/www/personal_info_system
```

#### 最终目录结构
```plaintext
personal_info_system/
├── backend/
│   ├── uploads/
│   ├── app.py
│   ├── wsgi.py
│   └── uwsgi.ini
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── records.html
├── nginx/
│   └── nginx.conf
├── venv/
└── README.md
```

### 3. Python环境配置

1. 创建虚拟环境并安装依赖：

```bash
# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install flask flask-cors pymysql redis pymongo uwsgi
```

2. `requirements.txt` 内容：

```plaintext
flask==2.0.1
flask-cors==3.0.10
pymysql==1.0.2
redis==4.0.2
pymongo==4.0.1
uwsgi==2.0.20
```

### 4. 数据库配置

1. **MySQL 配置**：

```sql
CREATE DATABASE user_info;
USE user_info;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    birth_date DATE,
    mood VARCHAR(100),
    image_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

2. **Redis 配置**：
   - 用于缓存用户数据
   - 设置过期时间

3. **MongoDB 配置**：
   - 创建数据库：user_info
   - 创建集合：user_logs

### 5. Nginx配置

`nginx.conf` 配置内容：

```nginx
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen 8080;
        server_name localhost;

        # 错误日志配置
        error_log /opt/homebrew/var/log/nginx/error.log debug;
        access_log /opt/homebrew/var/log/nginx/access.log;

        # 前端静态文件
        location / {
            root /Users/baotianyi/PycharmProjects/lianshuang-homework/frontend;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # 后端API代理
        location /api {
            proxy_pass http://127.0.0.1:5001;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 上传文件访问
        location /uploads {
            alias /Users/baotianyi/PycharmProjects/lianshuang-homework/backend/uploads;
        }
    }
}
```

### 6. uWSGI配置

`uwsgi.ini` 配置内容：

```ini
[uwsgi]
# Python相关配置
module = app:app
pythonpath = /app
virtualenv = /path/to/venv

# 进程相关配置
master = true
processes = 4
threads = 2

# 使用HTTP
http = :5001

# 日志配置
logto = /path/to/uwsgi.log
log-4xx = true
log-5xx = true
log-slow = true
log-date = true

# 其他配置
vacuum = true
die-on-term = true
enable-threads = true
buffer-size = 32768
harakiri = 30
```

### 7. 启动服务

#### 数据库服务启动：

```bash
# 启动MySQL
brew services start mysql

# 启动Redis
brew services start redis

# 启动MongoDB
brew services start mongodb-community
```

#### Nginx服务启动：

```bash
# 检查配置
nginx -t

# 启动nginx
brew services start nginx
```

#### 后端服务启动：

```bash
# 进入后端目录
cd backend

# 激活虚拟环境
source ../venv/bin/activate

# 启动uwsgi
uwsgi --ini uwsgi.ini
```

### 8. 验证服务

测试API：

```bash
# 测试记录API
curl http://localhost:8080/api/records

# 检查服务状态
brew services list
```

### 9. 常见问题处理

#### 端口占用问题处理：

```bash
# 查看端口占用
lsof -i :8080
lsof -i :5001

# 结束进程
kill -9 <PID>
```

#### 日志查看：

```bash
# nginx错误日志
tail -f /opt/homebrew/var/log/nginx/error.log

# 后端日志
tail -f backend/uwsgi.log

# MySQL错误日志
tail -f /opt/homebrew/var/log/mysql/error.log
```

#### 权限问题处理：

```bash
# 设置上传目录权限
chmod 755 backend/uploads

# 设置日志目录权限
sudo chmod 755 /opt/homebrew/var/log/nginx
sudo chown -R $(whoami):admin /opt/homebrew/var/log/nginx
```

## 技术栈说明
- **Nginx**：用于负载均衡、反向代理及静态文件服务。
- **uWSGI**：WSGI服务器，支持多进程和多线程，用于运行Flask应用。
- **Flask**：Python Web框架，负责处理Web请求和响应。
- **MySQL**：主数据存储，用于保存用户数据。
- **Redis**：缓存服务，用于缓存热点数据，提升应用性能。
- **MongoDB**：日志存储数据库，用于存储系统日志。

## 注意事项
1. 确保所有路径配置正确。
2. 检查文件和目录权限，确保服务能够正常访问。
3. 保持各服务的日志监控，以便及时发现问题。
4. 定期备份数据库，防止数据丢失。
