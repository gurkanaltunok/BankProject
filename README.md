<div align="center">

# BankProject

Full-Stack Banking Demo (ASP.NET Core + Next.js)

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)](#)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](#license)

<sub>Multi-currency accounts, transactions, FX rates, and admin dashboards.</sub>

</div>

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment](#environment)
- [Scripts](#scripts)
- [Key Endpoints](#key-endpoints)
- [Security Notes](#security-notes)
- [Screenshots](#screenshots)
- [License](#license)

## Overview
A modern multi-currency banking demo featuring authentication, accounts, transactions, FX rates, and admin dashboards. Total balance is calculated on the backend as a single source of truth.

## Features
- 🔐 JWT authentication (login/register/change password)
- 💱 Multi-currency accounts (TRY/USD/EUR/GBP)
- 💸 Transactions: deposit, withdraw, transfer, FX buy/sell
- 📊 Total balance (TRY-based, backend authority)
- 🧾 Balance history (audit trail + charts)
- 📈 Daily FX rates (Frankfurter API)
- 📉 Admin metrics & dashboards
- 🎯 Responsive UI (Next.js, Tailwind, Shadcn UI)

## Tech Stack
- Backend: ASP.NET Core (.NET 8), Entity Framework Core, SQL Server, JWT
- Frontend: Next.js 14, React 18, TypeScript, TailwindCSS, Shadcn UI, Chart.js/Recharts

## Architecture
- Layered: API (Controllers) → Business (Services) → DataAccess (EF/Repositories) → Entities
- Enums: `CurrencyType`, `AccountType`, `TransactionType`
- Tables: `Users`, `Roles`, `Accounts`, `Transactions`, `BalanceHistories`, `Addresses`, `ExchangeRates`
- Indexes: `Accounts.IBAN (unique)`, `ExchangeRates.Date (unique)`
- Note: `Transaction.BalanceAfter` = quick snapshot; `BalanceHistories` = detailed time-series/audit

## Project Structure
```
BankProject2/
  BankProject.API/            # ASP.NET Core API (Swagger enabled)
  BankProject.Business/       # Services, DTOs
  BankProject.DataAccess/     # Repositories, DbContext, Migrations
  BankProject.Entities/       # Entities & Enums
  bank-app/                   # Next.js frontend
```

## Getting Started
Prereqs: Node.js 18+, npm; .NET SDK 8; SQL Server (local/Docker)

### 1) Database
Edit `BankProject.API/appsettings.json` → `ConnectionStrings:DefaultConnection`

Apply EF migrations:
```bash
# optional: dotnet tool install --global dotnet-ef
dotnet restore && dotnet build
# create/update DB
dotnet ef database update --project BankProject.DataAccess --startup-project BankProject.API
```

### 2) Backend (API)
```bash
dotnet run --project BankProject.API --launch-profile http
# API:     http://localhost:5020
# Swagger: http://localhost:5020/swagger
```

### 3) Frontend (Next.js)
```bash
cd bank-app
npm install
NEXT_PUBLIC_API_URL=http://localhost:5020/api npm run dev
# Frontend: http://localhost:3000
```

## Environment
- Backend: set connection string in `BankProject.API/appsettings.json`
- Frontend: `NEXT_PUBLIC_API_URL` must point to your API base (e.g., `http://localhost:5020/api`)

## Scripts
```bash
# Backend
dotnet restore && dotnet build
dotnet ef database update --project BankProject.DataAccess --startup-project BankProject.API
dotnet run --project BankProject.API --launch-profile http

# Frontend
cd bank-app
npm install
NEXT_PUBLIC_API_URL=http://localhost:5020/api npm run dev
```

## Key Endpoints
- Auth: `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/change-password`
- Users: `GET /api/users/me` (includes `registerDate`), `PUT /api/users/update`
- Accounts: `GET /api/accounts/my-accounts`, `GET /api/accounts/my-total-balance`, `POST /api/accounts`, `DELETE /api/accounts/{id}`
- Transactions: `POST /api/transactions/deposit|withdraw|transfer`, `POST /api/transactions/exchange-buy|exchange-sell`
- Admin/FX: `GET /api/admin/dashboard`, `GET /api/admin/daily-transaction-volume`, `GET /api/admin/daily-commission-revenue`

## Security Notes
- JWT Bearer + [Authorize]
- Server-side ownership checks (prevent IDOR)
- Dev CORS relaxed; restrict in production
- Recommended: HTTPS, rate limiting, centralized logging/telemetry

## Screenshots
> Add screenshots or GIFs of key screens (login, dashboard, exchange trading, profile)

## License
MIT

---

<details>
<summary><strong>🇹🇷 Türkçe Açıklama</strong></summary>

## Genel Bakış
Kimlik doğrulama, hesaplar, işlemler, döviz kurları ve admin panelleri içeren çok para birimli modern bir demo. Toplam bakiye, tek doğru kaynak olması için backend’te hesaplanır.

## Özellikler
- 🔐 JWT kimlik doğrulama (giriş/kayıt/şifre değiştir)
- 💱 TRY/USD/EUR/GBP hesaplar
- 💸 İşlemler: para yatır/çek, transfer, döviz al/sat
- 📊 Toplam bakiye (TRY bazlı, backend’te tek doğru kaynak)
- 🧾 Bakiye geçmişi (audit + grafik)
- 📈 Günlük kur tablosu (Frankfurter API)
- 📉 Admin metrikleri/grafikler
- 🎯 Responsive arayüz (Next.js, Tailwind, Shadcn UI)

## Mimari/Yığın
- Katmanlı: API → Business → DataAccess → Entities
- EF Core + SQL Server; Next.js 14 + TypeScript
- `Transaction.BalanceAfter` hızlı görünüm; `BalanceHistories` detaylı zaman serisi/audit

## Kurulum
```bash
# Veritabanı
dotnet restore && dotnet build
# (gerekirse) dotnet tool install --global dotnet-ef
dotnet ef database update --project BankProject.DataAccess --startup-project BankProject.API

# API
dotnet run --project BankProject.API --launch-profile http
# http://localhost:5020

# Frontend
cd bank-app
npm install
NEXT_PUBLIC_API_URL=http://localhost:5020/api npm run dev
# http://localhost:3000
```

## Önemli Uçlar
- Auth: `/api/auth/login|register|change-password`
- Users: `/api/users/me` (registerDate içerir), `/api/users/update`
- Accounts: `/api/accounts/my-accounts`, `/api/accounts/my-total-balance`, `/api/accounts`
- Transactions: `/api/transactions/deposit|withdraw|transfer|exchange-buy|exchange-sell`

## Güvenlik Notları
- JWT + [Authorize]
- Sunucu tarafı sahiplik kontrolleri (IDOR önleme)
- Prod’da CORS kısıtlayın; HTTPS, rate limit, merkezi log önerilir

## Lisans
MIT

</details>
