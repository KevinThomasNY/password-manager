# Password Manager

A full-stack password manager application for securely storing and managing your passwords.

## About

This application allows users to:
- Register and login with secure authentication
- Store passwords with encryption
- Generate strong passwords
- Manage user profile and security questions

## Screenshots

### Home
![Home](docs/screenshots/home.png)

### Login
![Login](docs/screenshots/login.png)

### Add Password
![Add Password](docs/screenshots/add-password.png)

### Edit Password
![Edit Password](docs/screenshots/edit-password.png)

### Password Generation Rules
![Password Generation Rules](docs/screenshots/edit-password-generation-rules.png)

### Profile
![Profile](docs/screenshots/profile.png)

### Login History
![Login History](docs/screenshots/login-history.png)

## Technologies

### Frontend
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Axios](https://axios-http.com/)
- [React Hook Form](https://react-hook-form.com/)

### Backend
- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [SQLite](https://www.sqlite.org/)
- [Zod](https://zod.dev/)
- [Jest](https://jestjs.io/)

## Getting Started

### Docker (recommended)

Docker Compose builds the React frontend and Node backend into one image. The
application listens on localhost by default, and its SQLite database and uploads
are stored in a persistent Docker volume.

```bash
cp .env.example .env
openssl rand -hex 32 # use as SECRET_KEY
openssl rand -hex 32 # use as ENCRYPTION_KEY
# Add both generated values to .env, then start the app:
docker compose up --build -d
```

Open `http://localhost:3000` for local testing. On an Ubuntu server, keep the
container bound to `127.0.0.1` and put Caddy or another HTTPS reverse proxy in
front of it before allowing other devices to connect.

Useful commands:

```bash
docker compose ps
docker compose logs -f password-manager
docker compose down
```

`docker compose down` preserves the named data volume. Do not use the `--volumes`
option unless you intentionally want to permanently delete the database and
uploaded files.

### Backend
```bash
cd backend
cp .env.example .env
# Update .env with your values
npm install
npm run generate
npm run migrate
npm run dev
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## License

MIT
