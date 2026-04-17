# The Auction House

A full-stack luxury watch auction platform.

## Stack
- **Backend**: Laravel 11 + Sanctum (API)
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Database**: MySQL

## Features
- Live auction bidding with countdown timers & auto-extend
- Buy Now marketplace with filters
- Watch Vault (private portfolio with P&L tracking)
- User authentication, deposit management, favourites
- Admin dashboard (watches, auctions, users, valuations)

## Setup

### Backend (`/backend`)
```bash
cp .env.example .env          # configure DB_* vars
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve              # http://localhost:8000
```

### Frontend (`/frontend`)
```bash
npm install
npm start                      # http://localhost:3000
```

## Demo Credentials
| Role  | Email                            | Password  |
|-------|----------------------------------|-----------|
| Admin | admin@theauctionhouse.com        | password  |
| User  | john@example.com                 | password  |
