const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('Testing backend login...');
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'admin@fluxornews.com',
                password: 'admin123'
            })
        });

        const data = await response.json();
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(data, null, 2));

        if (data.success && data.data?.token) {
            console.log('✅ Login successful!');
            console.log('Token:', data.data.token.substring(0, 20) + '...');
        } else {
            console.log('❌ Login failed:', data.message);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLogin();
