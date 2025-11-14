# Sartarosh Biznes Uchun

## Project info

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Database Configuration

Loyiha PostgreSQL ma'lumotlar bazasidan foydalanadi.

### PostgreSQL ulanish sozlash

1. `.env` fayl yaratilgan va quyidagi ma'lumotlar bilan sozlangan:
   - Host: `localhost`
   - Port: `5432`
   - User: `postgres`
   - Password: `root`
   - Database: `postgres`

2. **Shell orqali PostgreSQL ga kirish:**

   Windows PowerShell yoki Command Prompt da:
   ```bash
   psql -U postgres -d postgres
   ```
   
   Yoki to'liq ma'lumotlar bilan:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres
   ```
   
   Parol so'ralganda `root` ni kiriting.

3. **Supabase CLI orqali ishga tushirish:**

   Agar Supabase CLI o'rnatilgan bo'lsa:
   ```bash
   supabase start
   ```
   
   Bu buyruq local PostgreSQL serverini ishga tushiradi va `supabase/config.toml` faylidagi sozlamalardan foydalanadi.

4. **Migrationlarni ishga tushirish:**

   Database jadvallarini yaratish uchun `supabase/migrations/` papkasidagi SQL fayllarni ishga tushiring:
   ```bash
   psql -U postgres -d postgres -f supabase/migrations/20251112065031_88ff5f27-7bf7-45b6-875d-3bb5b1ab5a90.sql
   ```

### Environment Variables

`.env` fayl quyidagi o'zgaruvchilarni o'z ichiga oladi:
- `VITE_SUPABASE_URL` - Supabase API URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase API kaliti
- `POSTGRES_HOST` - PostgreSQL server manzili
- `POSTGRES_PORT` - PostgreSQL port
- `POSTGRES_USER` - PostgreSQL foydalanuvchi nomi
- `POSTGRES_PASSWORD` - PostgreSQL parol
- `POSTGRES_DB` - Database nomi

## How can I deploy this project?

You can deploy this project using various hosting services like Vercel, Netlify, or any other static hosting provider.
