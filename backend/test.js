const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function runTests() {
    try {
        console.log('Регистрация пользователя...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            email: 'testuser@example.com',
            password: '123456'
        }, { withCredentials: true });
        const { accessToken: regToken } = registerRes.data;
        console.log('Регистрация прошла, accessToken:', regToken);

        console.log('Логин...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'testuser@example.com',
            password: '123456'
        }, { withCredentials: true });
        const { accessToken: loginToken } = loginRes.data;
        console.log('Login прошёл, accessToken:', loginToken);

        console.log('Получение профиля...');
        const profileRes = await axios.get(`${API_URL}/user/profile`, {
            headers: { Authorization: `Bearer ${loginToken}` },
            withCredentials: true
        });
        console.log('Профиль:', profileRes.data);

        console.log('Получение истории игр...');
        const historyRes = await axios.get(`${API_URL}/user/history`, {
            headers: { Authorization: `Bearer ${loginToken}` },
            withCredentials: true
        });
        console.log('История игр:', historyRes.data);

        console.log('Обновление токена...');
        const refreshRes = await axios.post(`${API_URL}/auth/refresh`, {
            userId: profileRes.data.id,
            refreshToken: '' // cookie передастся автоматически
        }, { withCredentials: true });
        console.log('Новый accessToken:', refreshRes.data.accessToken);

        console.log('✅ Все тесты пройдены!');
    } catch (err) {
        console.error('❌ Ошибка в тесте');

        if (err.response) {
            console.error('STATUS:', err.response.status);
            console.error('DATA:', err.response.data);
            console.error('HEADERS:', err.response.headers);
        } else if (err.request) {
            console.error('Нет ответа от сервера');
            console.error(err.request);
        } else {
            console.error('Ошибка:', err.message);
        }
    }



}

runTests();
