const express = require('express');
const cors = require('cors');
const { addToCart, getCart, updateCartItem, removeFromCart } = require('./db');
const { Pool } = require('pg');
const { initDatabase, authenticateUser, registerUser, logLoginAttempt, isAdmin } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'aga',
    password: 'Aceral20',
    port: 5432,
});

// Initialize database connection
initDatabase().catch(console.error);

// Middleware to get client IP
const getClientIp = (req) => {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
};

// Middleware для проверки прав администратора
const checkAdmin = async (req, res, next) => {
    try {
        const adminId = req.headers['admin-id'];
        if (!adminId) {
            return res.status(401).json({ error: 'Требуется авторизация администратора' });
        }

        const isUserAdmin = await isAdmin(adminId);
        if (!isUserAdmin) {
            return res.status(403).json({ error: 'Доступ запрещен' });
        }

        next();
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).json({ error: 'Ошибка при проверке прав администратора' });
    }
};

// Добавление товара в корзину
app.post('/api/cart', async (req, res) => {
    try {
        const { userId, dishId, quantity } = req.body;
        const result = await addToCart(userId, dishId, quantity);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получение корзины пользователя
app.get('/api/cart/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const cart = await getCart(userId);
        res.json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обновление количества товара в корзине
app.put('/api/cart/:cartItemId', async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const { quantity } = req.body;
        const result = await updateCartItem(cartItemId, quantity);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Удаление товара из корзины
app.delete('/api/cart/:cartItemId', async (req, res) => {
    try {
        const { cartItemId } = req.params;
        const result = await removeFromCart(cartItemId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, phone, password } = req.body;
        
        console.log('Registration attempt:', { name, phone });
        
        // Validate input
        if (!name || !phone || !password) {
            console.log('Missing required fields:', { name: !!name, phone: !!phone, password: !!password });
            return res.status(400).json({ 
                success: false,
                error: 'Все поля должны быть заполнены' 
            });
        }

        // Validate phone number format
        const phoneRegex = /^\+7\s?\(\d{3}\)\s?\d{3}-\d{2}-\d{2}$/;
        if (!phoneRegex.test(phone)) {
            console.log('Invalid phone format:', phone);
            return res.status(400).json({
                success: false,
                error: 'Неверный формат номера телефона'
            });
        }

        // Validate password length
        if (password.length < 6) {
            console.log('Password too short');
            return res.status(400).json({
                success: false,
                error: 'Пароль должен содержать не менее 6 символов'
            });
        }

        // Register user
        const user = await registerUser(name, phone, password);
        console.log('User registered successfully:', { id: user.id, name: user.name });
        
        // Automatically authenticate the user after registration
        const authenticatedUser = await authenticateUser(phone, password);
        const ipAddress = req.ip || req.connection.remoteAddress;
        await logLoginAttempt(authenticatedUser.id, true, ipAddress);

        res.status(201).json({
            success: true,
            message: 'Регистрация успешно завершена',
            user: authenticatedUser
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ 
            success: false,
            error: error.message === 'User with this phone number already exists' 
                ? 'Пользователь с таким номером телефона уже существует'
                : 'Ошибка при регистрации'
        });
    }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const ipAddress = getClientIp(req);
        
        // Validate input
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                error: 'Телефон и пароль обязательны'
            });
        }
        
        try {
            const user = await authenticateUser(phone, password);
            await logLoginAttempt(user.id, true, ipAddress);
            res.json({
                success: true,
                message: 'Вход выполнен успешно',
                user: user
            });
        } catch (authError) {
            // Log failed attempt if user exists
            const user = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
            if (user.rows.length > 0) {
                await logLoginAttempt(user.rows[0].id, false, ipAddress);
            }
            throw authError;
        }
    } catch (error) {
        res.status(401).json({
            success: false,
            error: error.message || 'Неверный телефон или пароль'
        });
    }
});

// Admin login endpoint
app.post('/api/auth/admin', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const ipAddress = getClientIp(req);
        
        const user = await authenticateUser(phone, password);
        const isUserAdmin = await isAdmin(user.id);
        
        if (!isUserAdmin) {
            await logLoginAttempt(user.id, false, ipAddress);
            throw new Error('Пользователь не является администратором');
        }
        
        await logLoginAttempt(user.id, true, ipAddress);
        res.json(user);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Эндпоинты для заказов
app.get('/api/admin/orders', checkAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT o.*, 
                   json_agg(json_build_object(
                       'dish_name', d.name,
                       'quantity', oi.quantity,
                       'price', oi.price
                   )) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN dishes d ON oi.dish_id = d.id
        `;
        const params = [];
        
        if (status && status !== 'all') {
            query += ' WHERE o.status = $1';
            params.push(status);
        }
        
        query += ' GROUP BY o.id ORDER BY o.created_at DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching orders:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/orders/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT o.*, 
                   json_agg(json_build_object(
                       'dish_name', d.name,
                       'quantity', oi.quantity,
                       'price', oi.price
                   )) as items
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN dishes d ON oi.dish_id = d.id
            WHERE o.id = $1
            GROUP BY o.id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching order details:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/admin/orders/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment } = req.body;
        
        const result = await pool.query(
            'UPDATE orders SET status = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [status, comment, id]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating order:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинты для акций
app.get('/api/admin/promotions', checkAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM promotions ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching promotions:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/promotions', checkAdmin, async (req, res) => {
    try {
        const { title, description, discount_percent, start_date, end_date } = req.body;
        
        const result = await pool.query(
            'INSERT INTO promotions (title, description, discount_percent, start_date, end_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, description, discount_percent, start_date, end_date]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating promotion:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/admin/promotions/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, discount_percent, start_date, end_date, is_active } = req.body;
        
        const result = await pool.query(
            'UPDATE promotions SET title = $1, description = $2, discount_percent = $3, start_date = $4, end_date = $5, is_active = $6 WHERE id = $7 RETURNING *',
            [title, description, discount_percent, start_date, end_date, is_active, id]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating promotion:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/admin/promotions/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM promotions WHERE id = $1', [id]);
        res.json({ message: 'Promotion deleted successfully' });
    } catch (err) {
        console.error('Error deleting promotion:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Эндпоинты для отзывов
app.get('/api/admin/reviews', checkAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        let query = 'SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id';
        const params = [];
        
        if (status && status !== 'all') {
            query += ' WHERE r.status = $1';
            params.push(status);
        }
        
        query += ' ORDER BY r.created_at DESC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/reviews/:id/response', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { response } = req.body;
        
        await pool.query(
            'INSERT INTO review_responses (review_id, admin_id, response) VALUES ($1, $2, $3)',
            [id, req.adminId, response]
        );
        
        await pool.query('UPDATE reviews SET status = $1 WHERE id = $2', ['answered', id]);
        
        res.json({ message: 'Response added successfully' });
    } catch (err) {
        console.error('Error adding review response:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/admin/reviews/:id', checkAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM review_responses WHERE review_id = $1', [id]);
        await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
        res.json({ message: 'Review deleted successfully' });
    } catch (err) {
        console.error('Error deleting review:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 