# Simple Project Manager

A compact full-stack project and task management application built with React, Spring Boot, and MySQL.

## What It Covers

- Authentication with register/login and JWT
- Role-based access control with `Project Manager` and `Developer`
- Projects with owners and assigned members
- Tasks linked to projects and users
- Dashboard cards and task status breakdown
- Form validation, API errors, and loading states
- Responsive UI for desktop and mobile

## Tech Stack

- Frontend: React, Vite, plain CSS
- Backend: Java 17, Spring Boot 3, Spring Security, Spring Data JPA
- Database: MySQL

## Backend Setup

1. Create a MySQL database:

```sql
CREATE DATABASE project_manager;
```

2. Update credentials in `backend/src/main/resources/application.properties` if needed.

3. Run the backend:

```bash
cd backend
mvn spring-boot:run
```

The API starts at `http://localhost:8080`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app starts at `http://localhost:5173`.

## Demo Roles

During registration, choose either `Project manager` or `Developer`.

- Project managers can manage team projects, tasks, members, and the user list.
- Developers see their permitted work and can update their assigned tasks.
- Internally, project managers are stored as `ADMIN` and developers are stored as `MEMBER`.

You can also change a user role manually in MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/{id}`
- `PUT /api/projects/{id}`
- `DELETE /api/projects/{id}`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/{id}`
- `DELETE /api/tasks/{id}`
- `GET /api/users`
