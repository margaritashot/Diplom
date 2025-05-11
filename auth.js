document.addEventListener('DOMContentLoaded', function() {
    // Базовый URL для API
    const API_URL = 'http://localhost:3001';

    // Функция для показа уведомлений
    function showNotification(message, type = 'success') {
        // Удаляем предыдущие уведомления
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Добавляем анимацию исчезновения
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Переключение между вкладками
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // Обновляем активные вкладки
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Показываем соответствующую форму
            forms.forEach(form => {
                form.classList.remove('active');
                if (form.id === `${target}-form`) {
                    form.classList.add('active');
                }
            });
        });
    });

    // Маска для телефона
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
            e.target.value = !x[2] ? x[1] : '+7 (' + x[2] + (x[3] ? ') ' + x[3] : '') + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
        });
    });

    // Переключение видимости пароля
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });

    // Обработка формы входа
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const phone = document.getElementById('phone').value;
        const password = document.getElementById('password').value;
        const adminCode = document.getElementById('admin-code').value;
        const remember = document.getElementById('remember').checked;

        try {
            // Проверка администратора
            if (adminCode === 'admin123') {
                const response = await fetch(`${API_URL}/api/auth/admin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phone, password })
                });

                if (response.ok) {
                    const data = await response.json();
                    // Сохраняем данные администратора
                    localStorage.setItem('isAdmin', 'true');
                    localStorage.setItem('adminId', data.id);
                    localStorage.setItem('adminName', data.name);
                    localStorage.setItem('adminToken', data.token); // Если есть токен
                    
                    showNotification('Вход в панель администратора выполнен успешно', 'success');
                    
                    // Переход на страницу админ-панели
                    window.location.href = 'admin.html';
                    return;
                } else {
                    const error = await response.json();
                    showNotification(error.error || 'Неверные данные администратора', 'error');
                    return;
                }
            }
            
            // Проверка обычного пользователя
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, password })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userPhone', phone);
                if (remember) {
                    localStorage.setItem('rememberMe', 'true');
                }
                showNotification('Вход выполнен успешно', 'success');
                window.location.href = 'index.html';
            } else {
                const error = await response.json();
                showNotification(error.error || 'Неверный телефон или пароль', 'error');
            }
        } catch (error) {
            console.error('Error during login:', error);
            showNotification('Ошибка при входе в систему', 'error');
        }
    });

    // Обработка формы регистрации
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name')?.value || 'Гость';
        const phone = document.getElementById('register-phone').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Проверка совпадения паролей
        if (password !== confirmPassword) {
            showNotification('Пароли не совпадают', 'error');
            return;
        }
        
        // Проверка сложности пароля
        if (password.length < 6) {
            showNotification('Пароль должен содержать не менее 6 символов', 'error');
            return;
        }

        // Проверка формата телефона
        const phoneRegex = /^\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}$/;
        if (!phoneRegex.test(phone)) {
            showNotification('Неверный формат номера телефона', 'error');
            return;
        }

        try {
            showNotification('Регистрация...', 'info');
            
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, phone, password })
            });

            const data = await response.json();

            if (response.ok) {
                showNotification('Регистрация успешна! Теперь вы можете войти', 'success');
                // Переключаем на вкладку входа
                document.querySelector('[data-tab="login"]').click();
                // Очищаем поля формы
                registerForm.reset();
            } else {
                showNotification(data.error || 'Ошибка при регистрации', 'error');
            }
        } catch (error) {
            console.error('Error during registration:', error);
            showNotification('Ошибка при регистрации. Проверьте подключение к серверу', 'error');
        }
    });
}); 