document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    let currentSlide = 0;
    let slideInterval;

    // Function to show a specific slide
    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    // Function to show next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Function to show previous slide
    function prevSlide() {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    }

    // Event listeners for navigation buttons
    prevBtn.addEventListener('click', () => {
        clearInterval(slideInterval);
        prevSlide();
        startSlideshow();
    });

    nextBtn.addEventListener('click', () => {
        clearInterval(slideInterval);
        nextSlide();
        startSlideshow();
    });

    // Event listeners for dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(slideInterval);
            showSlide(index);
            startSlideshow();
        });
    });

    // Function to start automatic slideshow
    function startSlideshow() {
        slideInterval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    }

    // Start the slideshow
    startSlideshow();

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

    // Обновляем счетчик корзины
    updateCartCount();
    
    // Добавляем обработчики для кнопок "В корзину"
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const dishCard = this.closest('.dish-card');
            const dish = {
                id: dishCard.dataset.id,
                name: dishCard.querySelector('h3').textContent,
                price: parseInt(dishCard.querySelector('.price').textContent),
                image: dishCard.querySelector('img').src
            };
            addToCart(dish);
        });
    });
}); 