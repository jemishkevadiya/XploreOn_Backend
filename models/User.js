const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
        {
          auth0UserId: {
            type: String,
            required: true,
            unique: true,
            // e.g., "auth0|123456789" from Auth0
          },
          firstname: {
            type: String,
            trim: true,
            default: '',
          },
          lastname: {
            type: String,
            trim: true,
            default: '',
          },
          email: {
            type: String,
            trim: true,
            unique: true,
            match: [
              /^\S+@\S+\.\S+$/,
              'Please use a valid email address',
            ],
          },
          role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
          },
        },
        {
          timestamps: true,
        }
      );


module.exports = mongoose.model('User', userSchema);