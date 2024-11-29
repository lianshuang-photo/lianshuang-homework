document.getElementById('image').addEventListener('change', function(e) {
    const preview = document.getElementById('image-preview');
    const file = e.target.files[0];
    
    if (file) {
        if (!file.type.startsWith('image/')) {
            showError('请选择图片文件');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="preview-container">
                    <img src="${e.target.result}" alt="预览图片">
                    <button type="button" class="remove-image" onclick="clearImage()">×</button>
                </div>`;
        }
        reader.readAsDataURL(file);
    } else {
        clearImage();
    }
});

function clearImage() {
    document.getElementById('image').value = '';
    document.getElementById('image-preview').innerHTML = '';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
}

async function submitForm(formData, retryCount = 3) {
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="loading-spinner"></span> 提交中...';

    for (let i = 0; i < retryCount; i++) {
        try {
            const response = await fetch('/api/submit', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`提交失败 (${response.status})`);
            }

            const result = await response.json();
            if (result.status === 'success') {
                showSuccess('提交成功！');
                return result;
            }
            throw new Error(result.message || '提交失败');
        } catch (error) {
            console.error(`尝试 ${i + 1} 失败:`, error);
            if (i === retryCount - 1) {
                throw error;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        } finally {
            if (i === retryCount - 1) {
                submitButton.disabled = false;
                submitButton.textContent = '提交信息';
            }
        }
    }
}

document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const formData = new FormData();
        const requiredFields = ['name', 'email', 'phone', 'birth_date'];
        
        for (const field of requiredFields) {
            const value = document.getElementById(field).value.trim();
            if (!value) {
                showError(`请填写${field === 'birth_date' ? '出生日期' : field}`);
                return;
            }
            formData.append(field, value);
        }
        
        formData.append('address', document.getElementById('address').value.trim());
        
        const mood = document.getElementById('mood').value;
        if (mood) {
            formData.append('mood', mood);
        }
        
        const imageFile = document.getElementById('image').files[0];
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const result = await submitForm(formData);
        document.getElementById('userForm').reset();
        document.getElementById('image-preview').innerHTML = '';
        
        // 使用平滑过渡到记录页面
        document.body.style.opacity = '0';
        setTimeout(() => {
            window.location.href = 'records.html';
        }, 500);
    } catch (error) {
        showError(error.message);
    }
});

// 添加表单验证
document.querySelectorAll('input, textarea').forEach(element => {
    element.addEventListener('input', function() {
        this.classList.remove('error');
        const errorMessage = this.parentElement.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    });
}); 