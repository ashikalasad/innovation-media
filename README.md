# Innovation Media Online Frontend (Starter)
## Setup
1. Install Node.js 20+.
2. Copy `.env.example` to `.env` and set Supabase Project URL + publishable/anon key.
3. `npm install`
4. `npm run dev`
5. `npm run build`
## Notes
- UI follows the previous Innovation Media demo's navy/orange visual direction.
- Auth is Supabase email/password.
- Dashboard, Projects list/create, Clients, Employees, Reports are connected to Supabase tables.
- This is a frontend foundation, not a complete feature parity build yet. Client/employee creation, project detail/update, progress/status editing, payments ledger, permissions UI and secure account invitation Edge Function remain to be implemented.
- Never place service_role/secret key in VITE env.

Project Update History SQL: PROJECT_UPDATE_HISTORY_SQL.sql (run in Supabase SQL Editor).
