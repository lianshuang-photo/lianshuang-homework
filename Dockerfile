# 使用Python基础镜像
FROM python:3.9

# 安装MySQL客户端
RUN apt-get update && apt-get install -y default-mysql-client

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY backend/requirements.txt .

# 安装依赖
RUN pip install -r requirements.txt

# 复制应用代码
COPY backend/ .

# 添加启动脚本
COPY backend/wait-for-it.sh /wait-for-it.sh
RUN chmod +x /wait-for-it.sh

# 暴露端口
EXPOSE 5001

# 启动命令
CMD ["/wait-for-it.sh", "mysql", "uwsgi", "--ini", "uwsgi.ini"] 