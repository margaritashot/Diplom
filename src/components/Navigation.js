import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';

function Navigation() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">Кафе "АГА"</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/menu">Меню</Nav.Link>
            <Nav.Link as={Link} to="/actions">Акции</Nav.Link>
            <Nav.Link as={Link} to="/reviews">Отзывы</Nav.Link>
            <Nav.Link as={Link} to="/about">О нас</Nav.Link>
            <Nav.Link as={Link} to="/contacts">Контакты</Nav.Link>
            <Nav.Link as={Link} to="/delivery">Доставка</Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/cart">Корзина</Nav.Link>
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/admin">Админ</Nav.Link>
                <Nav.Link onClick={handleLogout}>Выйти</Nav.Link>
              </>
            ) : (
              <Nav.Link as={Link} to="/login">Войти</Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Navigation; 