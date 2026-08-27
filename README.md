# SDM Steel - Demo

SDM Steel is a full-stack web app for tracking steel coils, customers, setup sheets, schedules, and finished goods.

I built this project to practice creating a real business-style application with Next.js, TypeScript, Prisma, and PostgreSQL. The app is based on a steel service center workflow where material comes in as master coils, gets assigned to jobs, moves through scheduling, and becomes finished goods.

## Live Deployment

[SDM Steel on Vercel](http://sdm-steel.vercel.app)

The app is deployed with Vercel and also has an AWS deployment setup through AWS Amplify.

## Tech Stack

- Next.js
- TypeScript
- React
- Prisma
- PostgreSQL
- Docker
- GitHub Actions
- Vercel
- AWS Amplify
- Playwright

## What The App Does

SDM Steel helps organize a production workflow:

- Receive new steel coils into inventory
- View and filter stock inventory
- Manage salesmen and customers
- View customer sales memos
- Create setup sheets for slitting jobs
- Add setups to a production schedule
- Mark jobs complete
- Track finished goods that are ready to ship

## Main Features

### Login And Roles

The app has a simple role-based login system.

- Admin can access everything
- Sales can view sales and inventory pages
- Setup / Scheduler can create setups and manage the schedule

This helped me practice protecting pages and showing different options based on the user's role.

### Inventory And Receiving

Users can add master coils, track stock inventory, filter coils, and reserve material for customers.

### Sales And Customers

The sales workflow includes customer records, salesmen, and customer sales memo views.

### Setup Sheets And Scheduling

The setup workflow lets users create slitting setups, apply coils to jobs, schedule production, and mark jobs ready to ship.

## Docker

This project includes Docker support so the app can be built and run in a container.

```bash
docker compose up --build
```

The Docker setup includes:

- `Dockerfile`
- `compose.yaml`
- `.dockerignore`

## CI/CD

This project uses GitHub Actions for continuous integration.

The CI workflow checks:

- Dependency installation with `npm ci`
- Linting with `npm run lint`
- Production build with `npm run build`
- Docker image build validation

The project also uses continuous deployment through Vercel. When changes are pushed to the connected GitHub repository, Vercel can automatically deploy the latest version.

## AWS

The project can also be deployed on AWS using AWS Amplify Hosting. AWS Amplify connects to the GitHub repository and deploys the Next.js app from the selected branch.

Environment variables such as `DATABASE_URL` must be configured in the hosting platform instead of being committed to the repository.

## Testing

This project uses Playwright for end-to-end testing. The current test checks the live SDM Steel site and verifies the sales and inventory navigation flow.

Install the Playwright browser files:

```bash
npx playwright install
```

Run tests:

```bash
npx playwright test
```

## Screenshot

<img width="1428" height="778" alt="SDM Steel app screenshot" src="https://github.com/user-attachments/assets/e0b4decc-c656-4bc1-8ebd-7245029550e7" />
