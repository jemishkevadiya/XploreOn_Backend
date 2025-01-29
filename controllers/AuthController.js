// controllers/AuthController.js

class AuthController {
    static async login(req, res) {
      // This calls express-openid-connect's built-in login
      // You can specify returnTo if you want a custom callback location
      return res.oidc.login({ returnTo: '/auth/profile' });
    }
  
    static async logout(req, res) {
      // This calls express-openid-connect's built-in logout
      // returnTo: where the user should land after logout
      return res.oidc.logout({ returnTo: '/' });
    }
  
    static async callback(req, res) {
      try {
        const auth0Profile = req.oidc.user;
        await userService.findOrCreateUser(auth0Profile);
        return res.redirect('/auth/profile');
      } catch (error) {
        console.error('Auth0 Callback Error:', error);
        return res.status(500).json({ message: 'Error during Auth callback' });
      }
    }
  
    static async profile(req, res) {
      return res.json(req.oidc.user);
    }
  }
  
  module.exports = AuthController;
  