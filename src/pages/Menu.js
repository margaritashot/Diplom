import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

function Menu() {
  const [dishes, setDishes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notification, setNotification] = useState({ show: false, message: '' });

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const response = await axios.get('/api/dishes');
      setDishes(response.data);
      
      // Получаем уникальные категории
      const uniqueCategories = [...new Set(response.data.map(dish => dish.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching dishes:', error);
    }
  };

  const addToCart = async (dishId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        // Перенаправляем на страницу входа, если пользователь не авторизован
        window.location.href = '/login';
        return;
      }

      await axios.post('/api/cart/add', { dishId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Показываем уведомление
      setNotification({ show: true, message: 'Блюдо добавлено в корзину!' });
      
      // Скрываем уведомление через 3 секунды
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      setNotification({ show: true, message: 'Ошибка при добавлении в корзину' });
      setTimeout(() => {
        setNotification({ show: false, message: '' });
      }, 3000);
    }
  };

  const filteredDishes = selectedCategory === 'all' 
    ? dishes 
    : dishes.filter(dish => dish.category === selectedCategory);

  return (
    <Container>
      <h2 className="text-center mb-4">Меню</h2>
      
      {/* Уведомление */}
      {notification.show && (
        <Alert 
          variant="success" 
          className="position-fixed top-0 start-50 translate-middle-x mt-5"
          style={{ zIndex: 1000 }}
          onClose={() => setNotification({ show: false, message: '' })}
          dismissible
        >
          {notification.message}
        </Alert>
      )}
      
      {/* Фильтр категорий */}
      <div className="mb-4">
        <Button 
          variant={selectedCategory === 'all' ? 'primary' : 'outline-primary'} 
          className="me-2"
          onClick={() => setSelectedCategory('all')}
        >
          Все
        </Button>
        {categories.map(category => (
          <Button 
            key={category}
            variant={selectedCategory === category ? 'primary' : 'outline-primary'} 
            className="me-2"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Список блюд */}
      <Row>
        {filteredDishes.map(dish => (
          <Col key={dish.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
            <Card>
              <Card.Img 
                variant="top" 
                src={dish.image_url} 
                alt={dish.name}
                style={{ height: '200px', objectFit: 'cover' }}
              />
              <Card.Body>
                <Card.Title>{dish.name}</Card.Title>
                <Card.Text>{dish.description}</Card.Text>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="h5 mb-0">{dish.price} ₽</span>
                  <Button 
                    variant="primary"
                    onClick={() => addToCart(dish.id)}
                  >
                    В корзину
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Menu; 