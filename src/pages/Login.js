import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (isRegistering) {
        // Регистрация
        const response = await axios.post('/api/auth/register', {
          name,
          phone,
          password
        });

        if (response.data.success) {
          setSuccess(response.data.message);
          // Автоматически сохраняем данные пользователя и перенаправляем
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      } else {
        // Вход
        const response = await axios.post('/api/auth/login', {
          phone,
          password
        });

        if (response.data.success) {
          setSuccess(response.data.message);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setTimeout(() => {
            navigate('/');
          }, 1500);
        }
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Произошла ошибка');
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Body>
              <h2 className="text-center mb-4">
                {isRegistering ? 'Регистрация' : 'Вход'}
              </h2>

              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit}>
                {isRegistering && (
                  <Form.Group className="mb-3">
                    <Form.Label>Имя</Form.Label>
                    <Form.Control
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Введите ваше имя"
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>Телефон</Form.Label>
                  <Form.Control
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7XXXXXXXXXX"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Пароль</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Введите пароль"
                  />
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 mb-3">
                  {isRegistering ? 'Зарегистрироваться' : 'Войти'}
                </Button>

                <Button
                  variant="link"
                  className="w-100"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                    setSuccess('');
                  }}
                >
                  {isRegistering
                    ? 'Уже есть аккаунт? Войти'
                    : 'Нет аккаунта? Зарегистрироваться'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login; 