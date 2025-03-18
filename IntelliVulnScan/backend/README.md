# IntelliVulnScan Backend

The backend server for IntelliVulnScan, a comprehensive vulnerability scanning and management platform.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **API Key Management**: Create and manage API keys for integration with external tools
- **Settings Management**: User-specific configuration settings
- **Database Integration**: PostgreSQL database with Prisma ORM
- **RESTful API**: Well-structured API endpoints for all functionality

## Tech Stack

- **Node.js & Express**: Backend framework
- **TypeScript**: Type-safe JavaScript
- **PostgreSQL**: Relational database
- **Prisma**: Database ORM and query builder
- **JWT**: Authentication token
- **bcrypt**: Password hashing

## Setup Instructions

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- PostgreSQL

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file following the `.env.example` pattern
4. Set up the PostgreSQL database and update the DATABASE_URL in your `.env` file
5. Generate Prisma client:
   ```
   npx prisma generate
   ```
6. Run database migrations:
   ```
   npx prisma migrate dev
   ```
7. Seed the database with initial data:
   ```
   npx prisma db seed
   ```

### Running the Application

#### Development Mode
```
npm run dev
```

#### Production Build
```
npm run build
npm start
```

## API Documentation

The API is organized into the following sections:

- **Authentication**: `/api/auth/*`
  - POST `/api/auth/register` - Create a new user account
  - POST `/api/auth/login` - Authenticate and get token
  - GET `/api/auth/me` - Get current user info
  - POST `/api/auth/change-password` - Change password

- **Settings**: `/api/settings/*`
  - GET `/api/settings` - Get user settings
  - PUT `/api/settings` - Update user settings

- **API Keys**: `/api/api-keys/*`
  - GET `/api/api-keys` - List all API keys
  - POST `/api/api-keys` - Create a new API key
  - DELETE `/api/api-keys/:id` - Delete an API key

## Security

- Passwords are hashed using bcrypt
- Authentication uses JWT tokens
- API endpoints are protected with middleware
- Rate limiting protects against brute force attacks
- Data validation on all inputs

## License

[Your License] 