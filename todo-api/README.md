# To-Do List REST API

A simple REST API for creating, viewing, updating, and deleting tasks.

## Requirements
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

## Run
1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI` if needed.
3. Run `npm run dev` (or `npm start`).
4. API base URL: `http://localhost:5001`.

## Endpoints
| Method | URL | Purpose |
|---|---|---|
| GET | `/api/tasks` | List tasks |
| GET | `/api/tasks/:id` | Get one task |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update task fields |
| DELETE | `/api/tasks/:id` | Delete task |

## Postman examples
POST `/api/tasks`, Body → raw → JSON:
```json
{ "title": "Finish assignment", "description": "Test API with Postman" }
```
PATCH `/api/tasks/ID`, JSON body: `{ "completed": true }`. Replace `ID` with the `_id` returned when creating a task.
