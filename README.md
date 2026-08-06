SDM Steel - Demo

SDM Steel is a full-stack web app for tracking steel coils, customers, setup sheets, schedules, and finished goods.
I built this project to practice creating a real business-style application with Next.js, TypeScript, Prisma, and PostgreSQL. The app is based on a steel service center workflow, where material comes in as master coils, gets assigned to jobs, moves through scheduling, and becomes finished goods.

What The App Does

SDM Steel helps organize a simple production workflow:
Receive new steel coils into inventory
View and filter stock inventory
Manage salesmen and customers
View customer sales memos
Create setup sheets for slitting jobs
Add setups to a production schedule
Mark jobs complete
Track finished goods that are ready to ship

Main Features

Login And Roles
The app has a simple role-based login system.
Admin can access everything
Sales can view sales and inventory pages
Setup / Scheduler can create setups and manage the schedule
This helped me practice protecting pages and showing different options based on the user's role.

Testing

This project uses Playwright for end-to-end testing. The current test checks the live SDM Steel site and verifies the sales and inventory navigation flow.

Install the Playwright browser files:

bash
npx playwright install

Live Link

http://sdm-steel.vercel.app

<img width="1428" height="778" alt="image" src="https://github.com/user-attachments/assets/e0b4decc-c656-4bc1-8ebd-7245029550e7" />
