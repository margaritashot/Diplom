const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Database configuration
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'aga',
    password: 'Aceral20',
    port: 5432,
    ssl: false // Disable SSL for local development
});

// Function to initialize database connection
async function initDatabase() {
    try {
        const client = await pool.connect();
        console.log('Database connection established successfully');
        
        // Create users table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Create login_attempts table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS login_attempts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                success BOOLEAN NOT NULL,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Update existing passwords to use bcrypt
        await updateExistingPasswords();
        
        client.release();
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
}

// Function to update existing passwords to use bcrypt
async function updateExistingPasswords() {
    const client = await pool.connect();
    try {
        // Get all users with plain text passwords
        const result = await client.query(
            'SELECT id, password FROM users WHERE password NOT LIKE \'$2b$%\''
        );

        for (const user of result.rows) {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await client.query(
                'UPDATE users SET password = $1 WHERE id = $2',
                [hashedPassword, user.id]
            );
        }

        if (result.rows.length > 0) {
            console.log(`Updated ${result.rows.length} passwords to use bcrypt`);
        }
    } catch (error) {
        console.error('Error updating passwords:', error);
    } finally {
        client.release();
    }
}

// Function to register a new user
async function registerUser(name, phone, password, isAdmin = false) {
    try {
        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE phone = $1',
            [phone]
        );

        if (existingUser.rows.length > 0) {
            throw new Error('Пользователь с таким номером телефона уже существует');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const result = await pool.query(
            'INSERT INTO users (name, phone, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, name, phone, is_admin',
            [name, phone, hashedPassword, isAdmin]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
}

// Function to authenticate user
async function authenticateUser(phone, password) {
    try {
        console.log('Attempting to authenticate user with phone:', phone);
        
        // Get user by phone
        const result = await pool.query(
            'SELECT id, name, phone, password, is_admin FROM users WHERE phone = $1',
            [phone]
        );

        console.log('Database query result:', result.rows.length > 0 ? 'User found' : 'User not found');

        if (result.rows.length === 0) {
            console.log('User not found in database');
            throw new Error('Пользователь не найден');
        }

        const user = result.rows[0];
        console.log('User found:', { id: user.id, phone: user.phone, is_admin: user.is_admin });

        // Verify password
        console.log('Verifying password...');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password verification result:', isValidPassword ? 'Valid' : 'Invalid');

        if (!isValidPassword) {
            console.log('Invalid password provided');
            throw new Error('Неправильный пароль');
        }

        // Remove password from returned user object
        delete user.password;
        console.log('Authentication successful for user:', user.id);
        return user;
    } catch (error) {
        console.error('Error in authenticateUser:', error);
        throw error;
    }
}

// Function to log user login attempt
async function logLoginAttempt(userId, success, ipAddress) {
    try {
        await pool.query(
            'INSERT INTO login_attempts (user_id, success, ip_address) VALUES ($1, $2, $3)',
            [userId, success, ipAddress]
        );
    } catch (error) {
        console.error('Error logging login attempt:', error);
    }
}

// Function to check if user is admin
async function isAdmin(userId) {
    try {
        const result = await pool.query(
            'SELECT is_admin FROM users WHERE id = $1',
            [userId]
        );
        return result.rows[0]?.is_admin || false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// Function to update user password
async function updatePassword(userId, newPassword) {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            'UPDATE users SET password = $1 WHERE id = $2',
            [hashedPassword, userId]
        );
        return true;
    } catch (error) {
        console.error('Error updating password:', error);
        throw error;
    }
}

module.exports = {
    initDatabase,
    registerUser,
    authenticateUser,
    logLoginAttempt,
    isAdmin,
    updatePassword,
    pool
}; 