// repositories/UserRepository.js
const User = require('../models/User');

class UserRepository {
  async findByAuth0UserId(auth0UserId) {
    return User.findOne({ auth0UserId });
  }

  async findByEmail(email) {
    return User.findOne({ email });
  }

  async create(userData) {
    const newUser = new User(userData);
    return newUser.save();
  }

  // Additional CRUD operations as needed...
}

module.exports = UserRepository;
