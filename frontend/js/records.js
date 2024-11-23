async function loadRecords() {
    try {
        const response = await fetch('http://localhost:8000/api/records', {
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
            alert('获取记录失败：' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('获取记录出错：' + error.message);
    }
}

function displayRecords(records) {
    const tableContainer = document.getElementById('recordsTable');
    
    if (records.length === 0) {
        tableContainer.innerHTML = '<div class="no-records">暂无记录</div>';
        return;
    }

    let html = `
        <table class="record-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>姓名</th>
                    <th>邮箱</th>
                    <th>电话</th>
                    <th>地址</th>
                    <th>出生日期</th>
                    <th>提交时间</th>
                </tr>
            </thead>
            <tbody>
    `;

    records.forEach(record => {
        html += `
            <tr>
                <td>${record.id}</td>
                <td>${record.name}</td>
                <td>${record.email}</td>
                <td>${record.phone}</td>
                <td>${record.address}</td>
                <td>${record.birth_date}</td>
                <td>${record.created_at}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = html;
}

// 页面加载时自动加载记录
document.addEventListener('DOMContentLoaded', loadRecords); 