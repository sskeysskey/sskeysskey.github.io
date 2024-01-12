from flask import Flask, request, jsonify, send_from_directory, render_template
import os

app = Flask(__name__)

# 假设我们有一个存储摘要的文件
summary_file_path = 'summary.txt'

@app.route('/')
def index():
    # 渲染一个包含编辑和摘要按钮的HTML页面
    return render_template('index.html')

@app.route('/edit', methods=['POST'])
def edit():
    content = request.form['content']
    # 将内容写入摘要文件
    with open(summary_file_path, 'w') as file:
        file.write(content)
    return jsonify(success=True)

@app.route('/summary', methods=['GET'])
def summary():
    # 从摘要文件中读取内容
    if os.path.exists(summary_file_path):
        with open(summary_file_path, 'r') as file:
            content = file.read()
    else:
        content = "No content available."
    return jsonify(summary=content)

if __name__ == '__main__':
    app.run(debug=True)