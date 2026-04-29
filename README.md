# TaskFlow — Team Task Manager (MERN Stack)

A production-ready Team Task Manager built with MongoDB, Express, React, and Node.js. Features JWT authentication, role-based access control (Admin/Member), project management, and Kanban-style task tracking — all styled with Bootstrap 5.

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js      # Signup, login, get users
│   │   ├── projectController.js   # CRUD projects + members
│   │   └── taskController.js      # CRUD tasks + dashboard stats
│   ├── middleware/
│   │   ├── auth.js                # JWT protect + adminOnly
│   │   └── errorHandler.js        # Global error handler
│   ├── models/
│   │   ├── User.js                # name, email, password, role
│   │   ├── Project.js             # name, description, createdBy, members[]
│   │   └── Task.js                # title, description, status, priority, dueDate, project, assignedTo
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── .env.example
│   ├── railway.toml
│   ├── package.json               # "type": "module" (ES6)
│   └── server.js                  # Express app entry point
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Layout.js           # Wraps pages with Navbar
    │   │   ├── Navbar.js           # Top navigation
    │   │   ├── ProtectedRoute.js   # Auth guard
    │   │   └── TaskCard.js         # Reusable Kanban task card
    │   ├── context/
    │   │   └── AuthContext.js      # Global auth state (Context API)
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Signup.js
    │   │   ├── Dashboard.js        # Stats + recent tasks
    │   │   ├── Projects.js         # Project list + create
    │   │   ├── ProjectDetail.js    # Kanban board per project
    │   │   ├── Tasks.js            # All tasks table with filters
    │   │   └── NewTask.js          # Create task form
    │   ├── utils/
    │   │   └── api.js              # Axios instance + all API calls
    │   ├── App.js                  # React Router routes
    │   ├── index.js                # Bootstrap imports + ReactDOM
    │   └── index.css               # Global style overrides
    ├── .env.example
    └── package.json
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js >= 18
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### 1. Clone and install dependencies

```bash
# Backend
cd team-task-manager/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

**Backend** — create `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/teamtaskmanager
JWT_SECRET=your_super_secret_key_min_32_chars
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend** — create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Run development servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend
npm start
```

App opens at **http://localhost:3000**

---

## 🌐 Deploy to Railway (Backend)

### Option A: Railway CLI

```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

### Option B: Railway Dashboard (recommended)

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your repo, set **Root Directory** to `backend`
3. Add environment variables in Railway dashboard:
   - `MONGO_URI` → your MongoDB Atlas URI
   - `JWT_SECRET` → a strong random string
   - `CLIENT_URL` → your Vercel frontend URL (after deploying frontend)
   - `NODE_ENV` → `production`
4. Railway auto-detects `package.json` and runs `npm start`

### Deploy Frontend to Vercel

```bash
cd frontend
npm run build
# Deploy the `build/` folder to Vercel
# Or connect your GitHub repo to vercel.com
```

Set Vercel environment variable:
```
REACT_APP_API_URL=https://your-railway-app.railway.app/api
```

---

## 🔑 Role System

| Feature | Admin | Member |
|---|---|---|
| Create project | ✅ | ❌ |
| Delete project | ✅ (own) | ❌ |
| Add/remove members | ✅ (own project) | ❌ |
| Create task | ✅ | ❌ |
| Delete task | ✅ (own) | ❌ |
| View tasks | ✅ (all in projects) | ✅ (assigned only) |
| Update task status | ✅ | ✅ (own tasks) |

---

## 📡 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Access | Body |
|---|---|---|---|
| POST | `/signup` | Public | `name, email, password, role` |
| POST | `/login` | Public | `email, password` |
| GET | `/me` | Private | — |
| GET | `/users` | Admin | — |

### Projects — `/api/projects`

| Method | Endpoint | Access | Body |
|---|---|---|---|
| GET | `/` | Private | — |
| POST | `/` | Admin | `name, description?, members?[]` |
| GET | `/:id` | Private | — |
| PUT | `/:id/members` | Admin | `memberIds[]` |
| DELETE | `/:id` | Admin | — |

### Tasks — `/api/tasks`

| Method | Endpoint | Access | Body / Query |
|---|---|---|---|
| GET | `/dashboard` | Private | — |
| GET | `/` | Private | `?project=id` (optional) |
| POST | `/` | Admin | `title, project, assignedTo, dueDate, description?, status?, priority?` |
| GET | `/:id` | Private | — |
| PUT | `/:id` | Private | Admin: all fields, Member: `status` only |
| DELETE | `/:id` | Admin | — |

### Example Request — Create Task
```http
POST /api/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Design login page",
  "description": "Create Figma mockup first",
  "status": "Todo",
  "priority": "High",
  "dueDate": "2025-06-01",
  "project": "664abc123...",
  "assignedTo": "664def456..."
}
```

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens expire after 7 days
- Protected routes verified on every request
- Role checked server-side (not just frontend)
- CORS configured to accept only `CLIENT_URL`

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Bootstrap 5, Bootstrap Icons |
| State | Context API + useState/useEffect hooks |
| HTTP | Axios with interceptors |
| Backend | Node.js 18+, Express 4 (ES Modules) |
| Auth | JWT + bcryptjs |
| Database | MongoDB + Mongoose |
| Deployment | Railway (backend) + Vercel (frontend) |
