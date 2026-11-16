# Employee Add – সহজ Deploy (Windows)

1. Supabase Dashboard থেকে Project ID/Project Ref কপি করুন (Project Settings > General)।
2. এই folder-এর `DEPLOY_EMPLOYEE_FUNCTION.bat`-এ double-click করুন।
3. Project Ref চাইলে paste করে Enter দিন।
4. Supabase login চাইলে browser-এ login/authorize করুন।
5. Link করার সময় database password চাইলে Supabase project-এর database password দিন (এটি ChatGPT-তে পাঠাবেন না)।
6. `SUCCESS! Employee function deployed.` দেখালে CMD বন্ধ করুন।
7. Vite চালু CMD-তে Ctrl+C দিয়ে থামিয়ে `npm run dev` চালান; browser refresh করুন।
8. Employees > Add Employee দিয়ে নতুন কর্মচারী তৈরি করুন।

নিরাপত্তা: `service_role`/`sb_secret_...` key কখনো frontend `.env`-এ দেবেন না বা কাউকে পাঠাবেন না।
