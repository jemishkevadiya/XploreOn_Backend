// services/UserService.js
class UserService {
    constructor(userRepository) {
      this.userRepository = userRepository;
    }
  
    /**
     * Finds or creates a user based on the Auth0 profile.
     * @param {Object} auth0Profile - The Auth0 user object from req.oidc.user
     */
    async findOrCreateUser(auth0Profile) {
      // Auth0 gives a globally unique user ID in auth0Profile.sub, e.g. "auth0|someId"
      const auth0UserId = auth0Profile.sub;
  
      // 1. Check if user already exists in DB
      let user = await this.userRepository.findByAuth0UserId(auth0UserId);
      if (user) {
        return user;
      }
  
      // 2. If not found by auth0UserId, we might also check by email if you want to link existing records
      user = await this.userRepository.findByEmail(auth0Profile.email);
      if (user) {
        // Optionally, update that user to store the new auth0UserId
        user.auth0UserId = auth0UserId;
        return user.save();
      }
  
      // 3. Otherwise, create a new user record
      return this.userRepository.create({
        auth0UserId,
        email: auth0Profile.email,
        firstname: auth0Profile.given_name || '',
        lastname: auth0Profile.family_name || '',
        // role: defaults to 'user' from your schema
      });
    }
  }
  
  module.exports = UserService;
  