# Notes App Backend

A notes API with registration/login and JWT-protected CRUD routes. Each note is linked to its owner; users can only read, update, or delete their own notes.

## Run
1. Use Node.js 18+ and start MongoDB.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set a random `JWT_SECRET` of at least 32 characters. Do not commit `.env`.
4. Run `npm run dev`. Base URL: `http://localhost:5003`.

## Endpoints
- `POST /api/auth/register` — `{ "name": "Asha", "email": "asha@example.com", "password": "ExamplePass123" }`
- `POST /api/auth/login` — returns a JWT token.
- `POST /api/notes` — protected; body `{ "title": "Class notes", "content": "Revise MongoDB CRUD" }`
- `GET /api/notes` — list your notes
- `GET /api/notes/:id` — fetch one of your notes
- `PATCH /api/notes/:id` — update title/content
- `DELETE /api/notes/:id` — delete your note

For every `/api/notes` request, set Postman Authorization → Bearer Token to the token from login. The server checks ownership on every note query.
