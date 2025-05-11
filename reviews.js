document.addEventListener('DOMContentLoaded', function() {
    // Получаем элементы формы
    const reviewForm = document.getElementById('reviewForm');
    const reviewsContainer = document.getElementById('reviewsContainer');
    
    // Загружаем отзывы из localStorage при загрузке страницы
    loadReviews();

    // Обработчик отправки формы
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Получаем данные из формы
        const name = document.getElementById('name').value;
        const rating = document.querySelector('input[name="rating"]:checked').value;
        const comment = document.getElementById('comment').value;
        
        // Создаем новый отзыв
        const review = {
            name: name,
            rating: rating,
            comment: comment,
            date: new Date().toLocaleDateString('ru-RU')
        };
        
        // Сохраняем отзыв
        saveReview(review);
        
        // Очищаем форму
        reviewForm.reset();
        
        // Обновляем список отзывов
        loadReviews();
        
        // Обновляем среднюю оценку
        updateAverageRating();
    });

    // Функция сохранения отзыва
    function saveReview(review) {
        let reviews = JSON.parse(localStorage.getItem('reviews')) || [];
        reviews.push(review);
        localStorage.setItem('reviews', JSON.stringify(reviews));
    }

    // Функция загрузки отзывов
    function loadReviews() {
        const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
        reviewsContainer.innerHTML = '';
        
        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p>Пока нет отзывов. Будьте первым!</p>';
            return;
        }
        
        // Сортируем отзывы по дате (новые сверху)
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        reviews.forEach(review => {
            const reviewElement = createReviewElement(review);
            reviewsContainer.appendChild(reviewElement);
        });
    }

    // Функция создания элемента отзыва
    function createReviewElement(review) {
        const reviewItem = document.createElement('div');
        reviewItem.className = 'review-item';
        
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        reviewItem.innerHTML = `
            <div class="review-header">
                <span class="review-author">${review.name}</span>
                <span class="review-date">${review.date}</span>
            </div>
            <div class="review-rating">${stars}</div>
            <div class="review-text">${review.comment}</div>
        `;
        
        return reviewItem;
    }

    // Функция обновления средней оценки
    function updateAverageRating() {
        const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
        if (reviews.length === 0) return;
        
        const totalRating = reviews.reduce((sum, review) => sum + parseInt(review.rating), 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);
        
        // Обновляем отображение средней оценки
        document.querySelector('.rating-value').textContent = averageRating;
        document.querySelector('.reviews-count').textContent = `на основе ${reviews.length} отзывов`;
        
        // Обновляем звезды
        const starsContainer = document.querySelector('.stars');
        const fullStars = Math.floor(averageRating);
        const hasHalfStar = averageRating % 1 >= 0.5;
        
        starsContainer.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsContainer.innerHTML += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                starsContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsContainer.innerHTML += '<i class="far fa-star"></i>';
            }
        }
    }

    // Инициализация средней оценки при загрузке страницы
    updateAverageRating();
}); 