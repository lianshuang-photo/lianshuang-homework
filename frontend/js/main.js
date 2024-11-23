document.getElementById('image').addEventListener('change', function(e) {
    const preview = document.getElementById('image-preview');
    const file = e.target.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="预览图片">`;
        }
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
});

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('email', document.getElementById('email').value);
    formData.append('phone', document.getElementById('phone').value);
    formData.append('address', document.getElementById('address').value);
    formData.append('birth_date', document.getElementById('birth_date').value);
    
    const mood = document.getElementById('mood').value;
    if (mood) {
        formData.append('mood', mood);
    }
    
    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch('http://localhost:8000/api/submit', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.status === 'success') {
            alert('提交成功！');
            document.getElementById('userForm').reset();
            document.getElementById('image-preview').innerHTML = '';
            window.location.href = 'records.html';
        } else {
            alert('提交失败：' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('提交出错：' + error.message);
    }
}); 