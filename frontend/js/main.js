document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        birth_date: document.getElementById('birth_date').value
    };

    try {
        const response = await fetch('http://localhost:8000/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            mode: 'cors',
            credentials: 'same-origin',
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            alert('提交成功！');
            document.getElementById('userForm').reset();
            window.location.href = 'records.html';
        } else {
            alert('提交失败：' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('提交出错：' + error.message);
    }
}); 