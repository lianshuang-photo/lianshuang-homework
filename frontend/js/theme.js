// 检查本地存储中的主题设置
function getTheme() {
    return localStorage.getItem('theme') || 'light';
}

// 设置主题
function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
}

// 更新主题图标
function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle .icon');
    icon.textContent = theme === 'dark' ? '🌞' : '🌓';
}

// 切换主题
function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// 页面加载时应用保存的主题
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = getTheme();
    setTheme(savedTheme);
}); 