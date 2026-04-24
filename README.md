# JT Paintings

Art portfolio site. PHP 8 API + React 18 frontend + MySQL. Images are managed through a private admin panel and displayed in a public gallery.

## Features

- Gallery organised into **groups** (supersections) shown in the nav, and **sections** within each group
- Images support custom grid sizing (e.g. 2×1 spans two columns at a 2:1 aspect ratio)
- Clicking an image opens a full-page viewer with scroll/pinch zoom and pan
- Thumbnail generation on upload (PHP GD) — gallery loads small thumbnails; viewer loads original
- HEIC/HEIF files converted to JPEG in the browser before upload
- Bulk upload via folder picker — subfolders become sections, `.txt` files with matching names become descriptions
- Contact form (recipient configured in admin settings, no redeploy needed)
- Admin panel at `/admin` behind a single password

---

## Local Development

**Prerequisites:** Node 20+, PHP 8.0+ with GD extension, MySQL

### 1. Clone and install

```bash
git clone <repo-url>
cd jtpaintings_art
npm install
```

### 2. Database

Create the database manually (the deploy script cannot — the MySQL user lacks `CREATE DATABASE`):

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS jtpaintings CHARACTER SET utf8mb4;"
mysql -u root -p jtpaintings < schema.sql
```

### 3. Environment

Create `.env` in the repo root:

```
DB_HOST=localhost
DB_NAME=jtpaintings
DB_USER=root
DB_PASS=
ADMIN_PASSWORD=$2y$10$...
```

Generate the bcrypt hash for `ADMIN_PASSWORD`:

```bash
php -r "echo password_hash('yourpassword', PASSWORD_DEFAULT);"
```

### 4. Run

In two terminals:

```bash
# Terminal 1 — PHP API server
php -S localhost:8000 -t public

# Terminal 2 — Vite dev server (proxies /api and /uploads to :8000)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Admin is at [http://localhost:5173/admin](http://localhost:5173/admin).

---

## Deployment

Deployment is fully automated via GitHub Actions. Every push to `main` builds the frontend and deploys to the server over SSH.

### Server prerequisites

- nginx (or OpenResty) pointed at `~/www/` as the web root, with PHP-FPM serving `.php` files
- MySQL database already created (the deploy script cannot create it)
- SSH access via a `.pem` key

> **nginx, not Apache.** `.htaccess` is not processed. API endpoints are served directly as real `.php` files (e.g. `/api/sections.php`) — no URL rewriting needed or used.

### First-time setup

1. Configure nginx to serve `~/www/` and PHP-FPM to execute `.php` files in `~/www/api/`.
2. Create the MySQL database:
   ```bash
   mysql -h localhost -u dbuser -p -e "CREATE DATABASE jtpaintings CHARACTER SET utf8mb4;"
   ```
   All tables are created automatically on first deploy via `schema.sql`.
3. Add all GitHub secrets (see below).
4. Push to `main`.

### GitHub Secrets

**Settings → Secrets and variables → Actions:**

| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Full `.pem` file contents (including `-----BEGIN...-----`) |
| `SSH_HOST` | Server hostname or IP |
| `SSH_USER` | SSH username |
| `SSH_PORT` | SSH port (usually `22`) |
| `DB_HOST` | MySQL host (usually `localhost`) |
| `DB_NAME` | Database name |
| `DB_USER` | MySQL username |
| `DB_PASS` | MySQL password |
| `ADMIN_PASSWORD` | Plain-text password — CI hashes it with bcrypt before writing to the server |

### What the deploy does

1. `npm ci && npm run build` — produces `public/dist/`
2. Creates `~/www/uploads/` and `~/www/api/` on the server if missing
3. Writes `~/.env` from secrets (admin password is bcrypt-hashed by CI first)
4. Copies the React build **flat** into `~/www/` — `index.html` and `assets/` land directly in the web root
5. Copies `public/index.php`, `.htaccess`, and `.user.ini` to `~/www/`
6. Copies `api/` to `~/www/api/`
7. Copies and runs `schema.sql` — idempotent, safe on every deploy
8. **Never touches** `~/www/uploads/` — uploaded images are preserved across deploys

### Server layout after deploy

```
~/
├── .env                ← DB credentials + hashed admin password
├── schema.sql
└── www/                ← nginx web root
    ├── index.html      ← React app
    ├── assets/
    ├── index.php       ← SPA fallback for unmatched routes
    ├── .htaccess       ← ignored by nginx; harmless
    ├── .user.ini       ← PHP-FPM upload limits (50M per file, 55M post)
    ├── api/            ← PHP API (nginx executes directly)
    └── uploads/        ← user images, preserved across deploys
        └── section-slug/
            ├── painting.jpg
            └── painting_thumb.jpg
```

---

## Admin Usage

Navigate to `/admin` and enter the admin password.

### Uploading images

**Folder upload** — select a local folder. The folder structure determines the layout:

```
MyFolder/
  Landscapes/           ← becomes a section named "Landscapes"
    sunset.jpg
    sunset.txt          ← file contents become the description for sunset.jpg
  portrait.jpg          ← no subfolder → unsectioned
```

HEIC/HEIF files are converted to JPEG in the browser before uploading. A compressed thumbnail is generated server-side for each image (used in the gallery grid).

**Single image** — inside any section, click **+ Add image** to upload one image with a title and description.

### Organising content

- **Groups** appear as navigation links in the site header. Create them with **New Group**.
- **Sections** hold images. Create them with **New Section**, then use the dropdown on each section to assign it to a group.
- Sections not assigned to any group appear on the home page.
- Image **grid size** (W × H) can be set per-image in edit mode — W=2, H=1 makes the thumbnail span two columns at a 2:1 aspect ratio.

### Settings

The **Settings** panel at the bottom of the admin page sets the contact form recipient email. Changes take effect immediately with no redeploy.
