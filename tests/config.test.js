const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // We need to export app from server.js
const SiteConfig = require('../src/models/SiteConfig');
const AdminUser = require('../src/models/AdminUser');

jest.setTimeout(30000);

let adminToken;
let adminId;

beforeAll(async () => {
    try {
        console.log('Test Setup: Connecting to DB...');
        // Wait for connection if not already connected
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('Test Setup: Connected to DB');
        }

        console.log('Test Setup: Creating Admin...');
        // Create a temp super admin for testing
        const testAdmin = await AdminUser.create({
            username: 'test_superadmin_' + Date.now(),
            email: 'test_super_' + Date.now() + '@example.com',
            password: 'password123',
            role: 'superadmin',
            name: 'Test Super Admin'
        });
        adminId = testAdmin._id;
        console.log('Test Setup: Admin Created', adminId);

        // login to get token
        console.log('Test Setup: Logging in...');
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({
                email: testAdmin.email,
                password: 'password123'
            });

        adminToken = loginRes.body.data.token;
        console.log('Test Setup: Login successful, Token received', adminToken ? 'YES' : 'NO');
    } catch (err) {
        console.error('Test Setup Failed:', err);
        throw err;
    }
});

afterAll(async () => {
    // Cleanup
    if (adminId) {
        await AdminUser.findByIdAndDelete(adminId);
    }
    await mongoose.connection.close();
});

describe('Site Config API', () => {
    it('GET /api/config should return 200 and config object', async () => {
        const res = await request(app).get('/api/config');
        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('branding');
        expect(res.body.data).toHaveProperty('features');
    });

    it('PUT /api/config should fail without token', async () => {
        const res = await request(app).put('/api/config').send({});
        expect(res.statusCode).toEqual(401);
    });

    it('PUT /api/config should update settings with valid token', async () => {
        // First get current config
        const currentRes = await request(app).get('/api/config');
        const currentShowSignIn = currentRes.body.data.features.showSignInButton;

        // Toggle it
        const newShowSignIn = !currentShowSignIn;

        const res = await request(app)
            .put('/api/config')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                features: {
                    showSignInButton: newShowSignIn
                }
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.features.showSignInButton).toBe(newShowSignIn);

        // Verify persistence
        const verifyRes = await request(app).get('/api/config');
        expect(verifyRes.body.data.features.showSignInButton).toBe(newShowSignIn);

        // Restore it back (optional, but good manners)
        await request(app)
            .put('/api/config')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                features: {
                    showSignInButton: currentShowSignIn
                }
            });
    });
});
