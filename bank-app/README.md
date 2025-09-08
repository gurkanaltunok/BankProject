# Agartha Bank - Banking Management System

This is a modern banking management system built with Next.js 14 and .NET 8 Web API.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role management
- 💰 **Account Management** - Create, view, and manage multiple bank accounts
- 💸 **Transactions** - Deposit, withdraw, and transfer funds between accounts
- 📊 **Transaction History** - View and filter transaction history with advanced filters
- 📈 **Charts & Analytics** - Visual representation of account balances and transaction data
- 📱 **Responsive Design** - Mobile-first design that works on all devices

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **React Hook Form** - Form management

### Backend
- **.NET 8** - Web API framework
- **Entity Framework Core** - ORM
- **SQL Server** - Database
- **JWT** - Authentication tokens

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- .NET 8 SDK
- SQL Server (Local DB or Express)

### Backend Setup

1. Navigate to the API project:
   ```bash
   cd BankProject.API
   ```

2. Restore NuGet packages:
   ```bash
   dotnet restore
   ```

3. Update the connection string in `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=BankProjectDb;Trusted_Connection=true;MultipleActiveResultSets=true"
     },
     "Jwt": {
       "Key": "your-super-secret-jwt-key-here-make-it-long-and-secure",
       "Issuer": "BankProject",
       "Audience": "BankProject"
     }
   }
   ```

4. Run database migrations:
   ```bash
   dotnet ef database update --project BankProject.DataAccess
   ```

5. Start the API:
   ```bash
   dotnet run
   ```

The API will be available at `https://localhost:7163`

### Frontend Setup

1. Navigate to the frontend project:
   ```bash
   cd bank-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=https://localhost:7163/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Usage

### Registration & Login

1. Navigate to `/sign-up` to create a new account
2. Fill in the required information including:
   - First Name, Last Name
   - TC Kimlik No (11 digits)
   - Email and Password
   - Phone Number and Address
3. After registration, login at `/sign-in`

### Account Management

1. Go to "My Banks" to create new accounts
2. Choose account type (Vadeli, Vadesiz, Kredi)
3. Select currency (TRY, USD, EUR)
4. View all your accounts with balances and details

### Transactions

1. Navigate to "Payment Transfer"
2. Select the account to operate on
3. Choose transaction type:
   - **Deposit** - Add money to account
   - **Withdraw** - Remove money from account
   - **Transfer** - Move money between your accounts
4. Enter amount and description
5. Confirm the transaction

### Transaction History

1. Go to "Transaction History"
2. Filter by account, date range
3. View detailed transaction records
4. See running balances and transaction summaries

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/{id}` - Get account by ID
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/{id}` - Update account
- `DELETE /api/accounts/{id}` - Delete account

### Transactions
- `POST /api/transactions/deposit` - Deposit money
- `POST /api/transactions/withdraw` - Withdraw money
- `POST /api/transactions/transfer` - Transfer between accounts
- `GET /api/transactions/account/{accountId}` - Get transactions by account
- `GET /api/transactions/filter` - Get transactions with filters

## Security Features

- JWT token-based authentication
- Role-based authorization (Customer, Employee, Admin)
- Account ownership verification
- Secure password hashing
- CORS protection
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.