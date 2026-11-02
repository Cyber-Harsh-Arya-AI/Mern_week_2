# User Authentication API

Demonstrates registration, secure password hashing with bcrypt, login, JWT issuance, and a protected profile route. Passwords are never stored in plain text.

## Run
1. Install Node.js 18+ and start MongoDB.
2. Run `npm install`.
3. Copy `.env.example` to `.env`. Replace `JWT_SECRET` with a long random secret (at least 32 characters). Never commit `.env`.
4. Run `npm run dev`. Base URL: `http://localhost:5002`.

## Endpoints
- `POST /api/auth/register` — `{ "name": "Asha", "email": "asha@example.com", "password": "ExamplePass123" }`
- `POST /api/auth/login` — `{ "email": "asha@example.com", "password": "ExamplePass123" }`
- `GET /api/auth/me` — add header `Authorization: Bearer YOUR_TOKEN`.

Use Postman → Body → raw → JSON for POST requests. Copy the token from login and use it as a Bearer Token for `/api/auth/me`.
