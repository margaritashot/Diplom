import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [address, setAddress] = useState('');
  const [comment, setComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(response.data);
      calculateTotal(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/cart/update/${itemId}`, 
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/cart/remove/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/orders', 
        { address, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Заказ успешно оформлен!');
      navigate('/');
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Ошибка при оформлении заказа');
    }
  };

  if (!localStorage.getItem('token')) {
    return (
      <Container>
        <Alert variant="warning">
          Пожалуйста, войдите в систему для просмотра корзины
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-center mb-4">Корзина</h2>
      
      {cartItems.length === 0 ? (
        <Alert variant="info">Ваша корзина пуста</Alert>
      ) : (
        <>
          <Table responsive>
            <thead>
              <tr>
                <th>Блюдо</th>
                <th>Цена</th>
                <th>Количество</th>
                <th>Сумма</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.price} ₽</td>
                  <td>
                    <Form.Control
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>{item.price * item.quantity} ₽</td>
                  <td>
                    <Button 
                      variant="danger" 
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      Удалить
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="mt-4">
            <h4>Итого: {total} ₽</h4>
            
            <Form className="mt-4">
              <Form.Group className="mb-3">
                <Form.Label>Адрес доставки</Form.Label>
                <Form.Control
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Введите адрес доставки"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Комментарий к заказу</Form.Label>
                <Form.Control
                  as="textarea"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Дополнительная информация"
                />
              </Form.Group>

              <Button 
                variant="success" 
                size="lg" 
                onClick={handleOrder}
                disabled={!address}
              >
                Оформить заказ
              </Button>
            </Form>
          </div>
        </>
      )}
    </Container>
  );
}

export default Cart; 