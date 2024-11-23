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

async function submitForm(formData, retryCount = 3) {
    for (let i = 0; i < retryCount; i++) {
        try {
            const response = await fetch('http://localhost:8080/api/submit', {
                method: 'POST',
                body: formData
            });

            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Response data:', result);
            
            if (result.status === 'success') {
                return result;
            }
            throw new Error(result.message || '提交失败');
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retryCount - 1) {
                throw error;
            }
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
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

        console.log('Sending data:', Object.fromEntries(formData));

        const result = await submitForm(formData);
        alert('提交成功！');
        document.getElementById('userForm').reset();
        document.getElementById('image-preview').innerHTML = '';
        window.location.href = 'records.html';
    } catch (error) {
        console.error('Error details:', error);
        alert('提交出错：' + error.message);
    }
}); 