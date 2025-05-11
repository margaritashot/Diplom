const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('aga', 'postgres', 'your_password', {
  host: 'localhost',
  dialect: 'postgres',
  logging: 'Aceral20', // Set to console.log to see SQL queries
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

testConnection();

module.exports = sequelize; 