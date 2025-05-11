const sequelize = require('../config/database');
const User = require('./User');

// Define associations here
// Example: User.hasMany(Order);

// Sync all models with database
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true }); // Use { force: true } to drop tables and recreate them
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
}

syncDatabase();

module.exports = {
  sequelize,
  User
}; 