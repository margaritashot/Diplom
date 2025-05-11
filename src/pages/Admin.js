import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Table, Button, Form, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Admin() {
  const [orders, setOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [newPromo, setNewPromo] = useState({
    title: '',
    description: '',
    discount_percent: '',
    start_date: '',
    end_date: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [ordersRes, promotionsRes, reviewsRes] = await Promise.all([
        axios.get('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/promotions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/admin/reviews', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setOrders(ordersRes.data);
      setPromotions(promotionsRes.data);
      setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleAddPromotion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/admin/promotions',
        newPromo,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowPromoModal(false);
      setNewPromo({
        title: '',
        description: '',
        discount_percent: '',
        start_date: '',
        end_date: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error adding promotion:', error);
    }
  };

  const handleReviewResponse = async (reviewId, response) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/admin/reviews/${reviewId}/response`,
        { response },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      console.error('Error adding review response:', error);
    }
  };

  return (
    <Container>
      <h2 className="text-center mb-4">Панель администратора</h2>

      <Tabs defaultActiveKey="orders" className="mb-4">
        <Tab eventKey="orders" title="Заказы">
          <Table responsive>
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>{order.total_amount} ₽</td>
                  <td>
                    <Form.Select
                      value={order.status}
                      onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                    >
                      <option value="new">Новый</option>
                      <option value="processing">В обработке</option>
                      <option value="delivery">Доставляется</option>
                      <option value="completed">Завершен</option>
                      <option value="cancelled">Отменен</option>
                    </Form.Select>
                  </td>
                  <td>
                    <Button variant="info" size="sm">
                      Детали
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>

        <Tab eventKey="promotions" title="Акции">
          <Button
            variant="success"
            className="mb-3"
            onClick={() => setShowPromoModal(true)}
          >
            Добавить акцию
          </Button>

          <Table responsive>
            <thead>
              <tr>
                <th>Название</th>
                <th>Описание</th>
                <th>Скидка</th>
                <th>Период</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(promo => (
                <tr key={promo.id}>
                  <td>{promo.title}</td>
                  <td>{promo.description}</td>
                  <td>{promo.discount_percent}%</td>
                  <td>
                    {new Date(promo.start_date).toLocaleDateString()} - 
                    {new Date(promo.end_date).toLocaleDateString()}
                  </td>
                  <td>
                    {promo.is_active ? 'Активна' : 'Завершена'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>

        <Tab eventKey="reviews" title="Отзывы">
          <Table responsive>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>Оценка</th>
                <th>Текст</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review.id}>
                  <td>{review.user_name}</td>
                  <td>{review.rating}/5</td>
                  <td>{review.text}</td>
                  <td>{review.status}</td>
                  <td>
                    {review.status === 'pending' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleReviewResponse(review.id, 'Спасибо за отзыв!')}
                      >
                        Ответить
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>
      </Tabs>

      {/* Модальное окно для добавления акции */}
      <Modal show={showPromoModal} onHide={() => setShowPromoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Добавить акцию</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddPromotion}>
            <Form.Group className="mb-3">
              <Form.Label>Название</Form.Label>
              <Form.Control
                type="text"
                value={newPromo.title}
                onChange={(e) => setNewPromo({...newPromo, title: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Описание</Form.Label>
              <Form.Control
                as="textarea"
                value={newPromo.description}
                onChange={(e) => setNewPromo({...newPromo, description: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Скидка (%)</Form.Label>
              <Form.Control
                type="number"
                value={newPromo.discount_percent}
                onChange={(e) => setNewPromo({...newPromo, discount_percent: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Дата начала</Form.Label>
              <Form.Control
                type="date"
                value={newPromo.start_date}
                onChange={(e) => setNewPromo({...newPromo, start_date: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Дата окончания</Form.Label>
              <Form.Control
                type="date"
                value={newPromo.end_date}
                onChange={(e) => setNewPromo({...newPromo, end_date: e.target.value})}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Добавить
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default Admin; 