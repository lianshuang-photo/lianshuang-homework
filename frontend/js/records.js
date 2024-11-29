async function loadRecords() {
    try {
        const response = await fetch('/api/records', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            displayRecords(result.records);
        } else {
            showError('获取记录失败：' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('获取记录出错：' + error.message);
    }
}

function displayRecords(records) {
    const tableContainer = document.getElementById('recordsTable');
    
    if (records.length === 0) {
        tableContainer.innerHTML = '<div class="no-records">暂无记录 😊</div>';
        return;
    }

    let html = `
        <table class="record-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>姓名</th>
                    <th>邮箱</th>
                    <th>电话</th>
                    <th>地址</th>
                    <th>出生日期</th>
                    <th>心情</th>
                    <th>图片</th>
                    <th>提交时间</th>
                </tr>
            </thead>
            <tbody>
    `;

    records.forEach(record => {
        const imageHtml = record.image_path 
            ? `<div class="image-container" 
                  onmousemove="showImagePreview(event, this)" 
                  onmouseleave="hideImagePreview()"
                  onclick="showFullImage('/uploads/${record.image_path}')">
                 <img src="/uploads/${record.image_path}" 
                      alt="上传图片" 
                      class="record-image">
               </div>` 
            : '<span class="no-image">无图片</span>';
            
        const moodEmoji = getMoodEmoji(record.mood);
            
        html += `
            <tr class="record-row">
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${record.email}</td>
                <td>${record.phone}</td>
                <td>${record.address || '未填写'}</td>
                <td>${formatDate(record.birth_date)}</td>
                <td>${moodEmoji}</td>
                <td>${imageHtml}</td>
                <td>${formatDateTime(record.created_at)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = html;
}

function getMoodEmoji(mood) {
    const moodMap = {
        '开心': '😊 开心',
        '平静': '😌 平静',
        '疲惫': '😫 疲惫',
        '兴奋': '🤩 兴奋',
        '沮丧': '😔 沮丧'
    };
    return moodMap[mood] || '未填写';
}

function formatDate(dateStr) {
    if (!dateStr) return '未填写';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
}

function formatDateTime(dateStr) {
    if (!dateStr) return '未知';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
}

function showFullImage(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.onclick = e => {
        if (e.target === modal) modal.remove();
    };
    modal.innerHTML = `
        <div class="modal-content">
            <img src="${src}" alt="全屏图片">
            <button onclick="this.parentElement.parentElement.remove()">关闭</button>
        </div>
    `;
    document.body.appendChild(modal);

    // 添加键盘事件监听
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.remove();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// 添加图片预览功能
function showImagePreview(event, container) {
    const img = container.querySelector('img');
    let preview = document.getElementById('image-preview-hover');
    
    if (!preview) {
        preview = document.createElement('img');
        preview.id = 'image-preview-hover';
        preview.className = 'image-preview-hover';
        document.body.appendChild(preview);
    }
    
    preview.src = img.src;
    preview.style.opacity = '1';
    
    // 计算预览图片位置
    const x = event.pageX + 20;
    const y = event.pageY + 20;
    
    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;
}

function hideImagePreview() {
    const preview = document.getElementById('image-preview-hover');
    if (preview) {
        preview.style.opacity = '0';
        setTimeout(() => preview.remove(), 200);
    }
}

// 添加滚动提示
function addScrollHint() {
    const container = document.querySelector('.records-container');
    if (container.scrollWidth > container.clientWidth) {
        // 如果有横向滚动
        const hint = document.createElement('div');
        hint.className = 'scroll-hint';
        hint.innerHTML = `
            <span class="icon">👉</span>
            <span>向右滑动查看更多内容</span>
        `;
        document.body.appendChild(hint);
        
        // 显示提示
        setTimeout(() => hint.classList.add('show'), 100);
        
        // 监听滚动
        container.addEventListener('scroll', () => {
            if (container.scrollLeft > 50) {
                hint.classList.remove('show');
                setTimeout(() => hint.remove(), 300);
            }
        });
        
        // 3秒后自动隐藏
        setTimeout(() => {
            hint.classList.remove('show');
            setTimeout(() => hint.remove(), 300);
        }, 3000);
    }
}

// 在记录显示后添加滚动提示
document.addEventListener('DOMContentLoaded', () => {
    loadRecords().then(() => {
        setTimeout(addScrollHint, 500);
    });
});

// 页面加载时自动加载记录
document.addEventListener('DOMContentLoaded', loadRecords); 