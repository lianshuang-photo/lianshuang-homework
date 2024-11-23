# 使用Python基础镜像
FROM python:3.9

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY backend/requirements.txt .

# 安装依赖
RUN pip install -r requirements.txt

# 复制应用代码
COPY backend/ .

# 暴露端口
EXPOSE 5001

# 启动命令
CMD ["uwsgi", "--ini", "uwsgi.ini"] 