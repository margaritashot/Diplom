const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'aga',
    password: 'Aceral20', // Замените на ваш пароль
    port: 5432,
});

// Функция для добавления товара в корзину
async function addToCart(userId, dishId, quantity) {
    try {
        const query = `
            INSERT INTO cart_items (user_id, dish_id, quantity)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [userId, dishId, quantity];
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (error) {
        console.error('Error adding to cart:', error);
        throw error;
    }
}

// Функция для получения корзины пользователя
async function getCart(userId) {
    try {
        const query = `
            SELECT ci.*, d.name, d.price, d.image
            FROM cart_items ci
            JOIN dishes d ON ci.dish_id = d.id
            WHERE ci.user_id = $1;
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting cart:', error);
        throw error;
    }
}

// Функция для обновления количества товара в корзине
async function updateCartItem(cartItemId, quantity) {
    try {
        const query = `
            UPDATE cart_items
            SET quantity = $1
            WHERE id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [quantity, cartItemId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error updating cart item:', error);
        throw error;
    }
}

// Функция для удаления товара из корзины
async function removeFromCart(cartItemId) {
    try {
        const query = `
            DELETE FROM cart_items
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [cartItemId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error removing from cart:', error);
        throw error;
    }
}

module.exports = {
    addToCart,
    getCart,
    updateCartItem,
    removeFromCart
}; 