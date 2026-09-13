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

## Account access

On an empty database, the login page presents a one-time administrator setup.
After that account is created, public registration closes. Administrators create
single-use, expiring links from the Admin page and share them directly; the app
does not send email.

Invitation tokens are placed in the URL fragment so they are not sent in HTTP
requests or reverse-proxy access logs. The frontend removes the fragment after it
loads the token. Administrators can revoke unused invitations, promote trusted
users, and disable accounts without gaining access to those users' vaults.

## Getting Started

### Docker (recommended)

Docker Compose builds the React frontend and Node backend into one image. The
application listens on localhost by default, and its SQLite database and uploads
are stored in a persistent Docker volume.

```bash
cp .env.example .env
openssl rand -hex 32 # use as SECRET_KEY
# Add the generated value to .env, then start the app:
docker compose up --build -d
```

Open `http://localhost:3000` for local testing. On an Ubuntu server, keep the
container bound to `127.0.0.1` and put Caddy or another HTTPS reverse proxy in
front of it before allowing other devices to connect.

Each account has a random vault key protected by its master password using
Argon2id and AES-256-GCM. Unlocked keys exist only in the server's in-memory
session store, so restarting the container signs everyone out. There is no
administrator or recovery key that can decrypt another user's vault.

For an existing installation, retain its original `ENCRYPTION_KEY` (and
`ENCRYPTION_IV` if it used the oldest format). A user's legacy records are
migrated atomically to their per-user key on their next successful login. Back
up the Docker volume before upgrading, and do not remove the legacy values until
every existing user has logged in after the upgrade. Fresh installations leave
both legacy variables blank.

Useful commands:

```bash
docker compose ps
docker compose logs -f password-manager
docker compose down
```

`docker compose down` preserves the named data volume. Do not use the `--volumes`
option unless you intentionally want to permanently delete the database and
uploaded files.

If an administrator forgets their master password, restore administrative access
from the Ubuntu server without resetting or decrypting the inaccessible vault:

```bash
docker compose exec password-manager npm run admin:promote -- existing_username
docker compose exec password-manager npm run admin:create
```

The create command prompts for the master password without displaying it. These
commands restore the administrator role only; they cannot recover an encrypted
vault whose master password has been lost.

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
