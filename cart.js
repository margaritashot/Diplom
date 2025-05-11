// Функция для сохранения корзины в localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Функция для загрузки корзины из localStorage
function loadCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Функция для обновления счетчика корзины в шапке
function updateCartCount() {
    const cart = loadCart();
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalCount;
    });
}

// Функция для добавления товара в корзину
function addToCart(dish) {
    const cart = loadCart();
    const existingItem = cart.find(item => item.id === dish.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: dish.id,
            name: dish.name,
            price: dish.price,
            image: dish.image,
            quantity: 1
        });
    }
    
    saveCart(cart);
    updateCartCount();
    
    // Показываем уведомление
    showNotification('Товар добавлен в корзину');
}

// Функция для показа уведомления
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Функция для инициализации корзины
function initCart() {
    // Получаем сохраненные товары из localStorage
    let cartItems = loadCart();
    
    // Отображаем товары в корзине
    displayCartItems(cartItems);
    
    // Обновляем итоговую сумму
    updateCartSummary(cartItems);

    // Добавляем обработчик для кнопки оформления заказа
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', showOrderModal);
    }
}

// Функция для отображения товаров в корзине
function displayCartItems(items) {
    const cartItemsContainer = document.querySelector('.cart-items');
    
    if (items.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Корзина пуста</p>';
        return;
    }
    
    let html = '';
    
    items.forEach((item, index) => {
        html += `
            <div class="cart-item" data-index="${index}">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <div class="cart-item-price">${item.price}₽</div>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" onclick="updateQuantity(${index}, -1)">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1" onchange="updateQuantityInput(${index}, this.value)">
                    <button class="quantity-btn plus" onclick="updateQuantity(${index}, 1)">+</button>
                    <button class="remove-item" onclick="removeItem(${index})">×</button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = html;
}

// Функция для обновления количества товара
function updateQuantity(index, change) {
    let cartItems = loadCart();
    const newQuantity = cartItems[index].quantity + change;
    
    if (newQuantity < 1) return;
    
    cartItems[index].quantity = newQuantity;
    saveCart(cartItems);
    
    displayCartItems(cartItems);
    updateCartSummary(cartItems);
    updateCartCount();
}

// Функция для обновления количества через input
function updateQuantityInput(index, value) {
    let cartItems = loadCart();
    const newQuantity = parseInt(value);
    
    if (newQuantity < 1) return;
    
    cartItems[index].quantity = newQuantity;
    saveCart(cartItems);
    
    displayCartItems(cartItems);
    updateCartSummary(cartItems);
    updateCartCount();
}

// Функция для удаления товара
function removeItem(index) {
    let cartItems = loadCart();
    cartItems.splice(index, 1);
    saveCart(cartItems);
    
    displayCartItems(cartItems);
    updateCartSummary(cartItems);
    updateCartCount();
}

// Функция для обновления итоговой суммы
function updateCartSummary(items) {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.querySelector('.summary-row:first-child').textContent = `Товаров: ${totalItems}`;
    document.querySelector('.summary-row:last-child').textContent = `Итого: ${totalPrice}₽`;
}

// Функция для отображения модального окна заказа
function showOrderModal() {
    const modal = document.createElement('div');
    modal.className = 'order-modal';
    modal.innerHTML = `
        <div class="order-modal-content">
            <span class="order-modal-close">&times;</span>
            <h2>Оформление заказа</h2>
            <form class="order-form" id="orderForm">
                <div class="form-group">
                    <label for="name">Имя</label>
                    <input type="text" id="name" required>
                </div>
                <div class="form-group">
                    <label for="phone">Телефон</label>
                    <input type="tel" id="phone" required>
                </div>
                
                <div class="delivery-type">
                    <label>
                        <input type="radio" name="deliveryType" value="delivery" checked>
                        Доставка
                    </label>
                    <label>
                        <input type="radio" name="deliveryType" value="pickup">
                        Самовывоз
                    </label>
                </div>

                <div id="deliveryFields">
                    <div class="form-group">
                        <label for="street">Улица</label>
                        <input type="text" id="street" required>
                    </div>
                    <div class="form-group">
                        <label for="house">Дом</label>
                        <input type="text" id="house" required>
                    </div>
                    <div class="form-group">
                        <label for="entrance">Подъезд</label>
                        <input type="text" id="entrance" required>
                    </div>
                    <div class="form-group">
                        <label for="apartment">Квартира/Офис</label>
                        <input type="text" id="apartment" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="deliveryTime">Дата и время доставки</label>
                    <input type="datetime-local" id="deliveryTime" required>
                </div>

                <div class="form-group">
                    <label for="paymentMethod">Способ оплаты</label>
                    <select id="paymentMethod" required>
                        <option value="card">Картой</option>
                        <option value="cash">Наличными</option>
                    </select>
                </div>

                <button type="submit" class="submit-order-btn">Подтвердить заказ</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Обработчики событий
    const closeBtn = modal.querySelector('.order-modal-close');
    const form = modal.querySelector('#orderForm');
    const deliveryTypeInputs = modal.querySelectorAll('input[name="deliveryType"]');
    const deliveryFields = modal.querySelector('#deliveryFields');

    closeBtn.onclick = () => {
        modal.remove();
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.remove();
        }
    };

    deliveryTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            deliveryFields.style.display = e.target.value === 'delivery' ? 'block' : 'none';
            const inputs = deliveryFields.querySelectorAll('input');
            inputs.forEach(input => input.required = e.target.value === 'delivery');
        });
    });

    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const orderData = {
            name: formData.get('name'),
            phone: formData.get('phone'),
            deliveryType: formData.get('deliveryType'),
            street: formData.get('street'),
            house: formData.get('house'),
            entrance: formData.get('entrance'),
            apartment: formData.get('apartment'),
            deliveryTime: formData.get('deliveryTime'),
            paymentMethod: formData.get('paymentMethod'),
            items: loadCart()
        };

        // Здесь можно добавить отправку данных на сервер
        console.log('Order data:', orderData);
        showNotification('Заказ успешно оформлен!');
        modal.remove();
        // Очищаем корзину после успешного оформления
        localStorage.removeItem('cart');
        updateCartCount();
        displayCartItems([]);
        updateCartSummary([]);
    };
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Добавляем обработчики для кнопок "В корзину"
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const dish = {
                id: this.dataset.id,
                name: this.dataset.name,
                price: parseInt(this.dataset.price),
                image: this.dataset.image
            };
            addToCart(dish);
        });
    });
    
    // Инициализируем корзину, если мы на странице корзины
    if (document.querySelector('.cart-page')) {
        initCart();
    }
    
    // Обновляем счетчик корзины
    updateCartCount();
}); 