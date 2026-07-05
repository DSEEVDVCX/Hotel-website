# Sewar Al-Andalus Hotel (suwar-al-dhahab)

A modern, full-featured hotel booking and management platform built with Next.js, Prisma, and Tailwind CSS.

## Features

- **Guest Booking:** Seamlessly browse rooms, check availability, and book stays.
- **Admin Dashboard:** Manage rooms, bookings, users, and rates.
- **Payments:** Integrated Stripe payments for secure transactions.
- **Authentication:** Secure user and admin authentication using Next-Auth.
- **Database:** PostgreSQL with Prisma ORM for robust data modeling.
- **Testing:** Comprehensive test suite with Vitest and Playwright.

## Tech Stack

- **Framework:** Next.js 15
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Styling:** Tailwind CSS 4
- **Authentication:** NextAuth.js
- **Payments:** Stripe
- **Testing:** Vitest, Playwright, k6

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/DSEEVDVCX/Hotel-website.git
   cd Hotel-website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the required variables (e.g., `DATABASE_URL`, Stripe keys, NextAuth secret).

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs ESLint.
- `npm run test`: Runs unit tests with Vitest.
- `npm run test:e2e`: Runs end-to-end tests with Playwright.
