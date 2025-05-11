// Функция для загрузки заказов
async function loadOrders() {
    try {
        const response = await fetch('/api/admin/orders');
        const orders = await response.json();
        const ordersList = document.getElementById('ordersList');
        
        if (orders.length === 0) {
            ordersList.innerHTML = '<p>Нет заказов</p>';
            return;
        }

        ordersList.innerHTML = orders.map(order => `
            <div class="order-item">
                <h3>Заказ #${order.id}</h3>
                <p>Статус: ${order.status}</p>
                <p>Дата: ${new Date(order.created_at).toLocaleString()}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('ordersList').innerHTML = '<p>Ошибка загрузки заказов</p>';
    }
}

// Функция для загрузки акций
async function loadPromotions() {
    try {
        const response = await fetch('/api/admin/promotions');
        const promotions = await response.json();
        const promotionsList = document.getElementById('promotionsList');
        
        if (promotions.length === 0) {
            promotionsList.innerHTML = '<p>Нет акций</p>';
            return;
        }

        promotionsList.innerHTML = promotions.map(promo => `
            <div class="promotion-item">
                <h3>${promo.title}</h3>
                <p>${promo.description}</p>
                <p>Скидка: ${promo.discount_percent}%</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading promotions:', error);
        document.getElementById('promotionsList').innerHTML = '<p>Ошибка загрузки акций</p>';
    }
}

// Функция для загрузки отзывов
async function loadReviews() {
    try {
        const response = await fetch('/api/admin/reviews');
        const reviews = await response.json();
        const reviewsList = document.getElementById('reviewsList');
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>Нет отзывов</p>';
            return;
        }

        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <h3>Отзыв от ${review.user_name}</h3>
                <p>${review.text}</p>
                <p>Статус: ${review.status}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading reviews:', error);
        document.getElementById('reviewsList').innerHTML = '<p>Ошибка загрузки отзывов</p>';
    }
}

// Загрузка данных при открытии страницы
document.addEventListener('DOMContentLoaded', function() {
    // Проверка прав администратора
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminId = localStorage.getItem('adminId');
    const adminName = localStorage.getItem('adminName');

    if (!isAdmin || !adminId) {
        window.location.href = 'login.html';
        return;
    }

    // Отображение имени администратора
    const adminTitle = document.querySelector('.admin-title');
    if (adminTitle && adminName) {
        adminTitle.textContent = `Админ-панель - ${adminName}`;
    }

    // Обработка выхода
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            // Очищаем данные администратора
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminId');
            localStorage.removeItem('adminName');
            localStorage.removeItem('adminToken');
            // Перенаправляем на страницу входа
            window.location.href = 'login.html';
        });
    }

    // Загрузка заказов
    async function loadOrders(status = 'all') {
        try {
            const response = await fetch(`http://localhost:3001/api/admin/orders?status=${status}`, {
                headers: {
                    'admin-id': adminId
                }
            });

            if (response.ok) {
                const orders = await response.json();
                displayOrders(orders);
            } else {
                showNotification('Ошибка при загрузке заказов', 'error');
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            showNotification('Ошибка при загрузке заказов', 'error');
        }
    }

    // Отображение заказов
    function displayOrders(orders) {
        const ordersList = document.getElementById('ordersList');
        if (!ordersList) return;

        ordersList.innerHTML = orders.map(order => `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <h3>Заказ #${order.id}</h3>
                    <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
                </div>
                <div class="order-info">
                    <p>Дата: ${new Date(order.created_at).toLocaleString()}</p>
                    <p>Сумма: ${order.total_amount} ₽</p>
                </div>
                <button class="btn-secondary view-order" data-order-id="${order.id}">Просмотреть</button>
                <button class="btn-secondary view-order" data-order-id="${order.id}">Поменять статус</button>
            </div>
        `).join('');

        // Добавляем обработчики для кнопок просмотра
        document.querySelectorAll('.view-order').forEach(button => {
            button.addEventListener('click', function() {
                const orderId = this.dataset.orderId;
                showOrderDetails(orderId);
            });
        });
    }

    // Получение текста статуса
    function getStatusText(status) {
        const statusMap = {
            'new': 'Новый',
            'processing': 'В обработке',
            'delivery': 'Доставка',
            'completed': 'Завершен',
            'cancelled': 'Отменен'
        };
        return statusMap[status] || status;
    }

    // Показ деталей заказа
    async function showOrderDetails(orderId) {
        try {
            const response = await fetch(`http://localhost:3001/api/admin/orders/${orderId}`, {
                headers: {
                    'admin-id': adminId
                }
            });

            if (response.ok) {
                const order = await response.json();
                const modal = document.getElementById('orderModal');
                const content = document.getElementById('orderDetailsContent');
                
                content.innerHTML = `
                    <div class="order-detail">
                        <h3>Информация о заказе</h3>
                        <p>Номер заказа: #${order.id}</p>
                        <p>Дата: ${new Date(order.created_at).toLocaleString()}</p>
                        <p>Статус: ${getStatusText(order.status)}</p>
                        <p>Сумма: ${order.total_amount} ₽</p>
                    </div>
                    <div class="order-items">
                        <h3>Товары</h3>
                        ${order.items.map(item => `
                            <div class="order-item">
                                <p>${item.dish_name} x ${item.quantity}</p>
                                <p>${item.price} ₽</p>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Устанавливаем текущий статус
                const statusSelect = document.getElementById('orderStatus');
                if (statusSelect) {
                    statusSelect.value = order.status;
                }

                // Показываем модальное окно
                modal.style.display = 'block';
            } else {
                showNotification('Ошибка при загрузке деталей заказа', 'error');
            }
        } catch (error) {
            console.error('Error loading order details:', error);
            showNotification('Ошибка при загрузке деталей заказа', 'error');
        }
    }

    // Функция для показа уведомлений
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Обработчики событий
    const orderStatusSelect = document.getElementById('orderStatus');
    if (orderStatusSelect) {
        orderStatusSelect.addEventListener('change', function() {
            loadOrders(this.value);
        });
    }

    // Закрытие модальных окон
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Вместо загрузки с сервера — показываем нужный заказ
    displayOrders([
        {
            id: 25,
            status: 'new',
            created_at: '2024-06-09T10:15:00',
            pickup_point: 'ЦУМ Якутск; Улица Курашова, 4; 4 этаж;',
            total_amount: 1200
        }
    ]);

    // Показываем уведомление о новом заказе
    showNotification('Поступил новый заказ!', 'success');

    // Модалка добавления блюда
    const addDishBtn = document.getElementById('addDishBtn');
    const addDishModal = document.getElementById('addDishModal');
    const closeAddDishModal = document.getElementById('closeAddDishModal');
    const cancelAddDish = document.getElementById('cancelAddDish');

    if (addDishBtn && addDishModal) {
        addDishBtn.addEventListener('click', function() {
            addDishModal.style.display = 'block';
        });
    }
    if (closeAddDishModal) {
        closeAddDishModal.addEventListener('click', function() {
            addDishModal.style.display = 'none';
        });
    }
    if (cancelAddDish) {
        cancelAddDish.addEventListener('click', function() {
            addDishModal.style.display = 'none';
        });
    }
    // Закрытие по клику вне окна
    window.addEventListener('click', function(e) {
        if (e.target === addDishModal) {
            addDishModal.style.display = 'none';
        }
    });

    // Обработка формы добавления блюда
    const addDishForm = document.getElementById('addDishForm');
    if (addDishForm) {
        addDishForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Здесь могла бы быть отправка на сервер
            addDishModal.style.display = 'none';
            showNotification('Блюдо успешно добавлено!', 'success');
            addDishForm.reset();
        });
    }
});

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'aga',
    password: 'Aceral20', // Замените на ваш пароль
    port: 5432,
    ssl: true
});

// Переопределяю функцию loadOrders для мок-режима
function loadOrders() {
    displayOrders(mockOrders);
} 