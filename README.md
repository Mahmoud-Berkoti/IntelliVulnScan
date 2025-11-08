# IntelliVulnScan

A comprehensive vulnerability management platform built with React, Node.js, and SQLite, designed to help security teams identify, track, and remediate security vulnerabilities across their infrastructure.

## Features

- **Vulnerability Management**: Track and manage vulnerabilities across your entire infrastructure
- **Asset Inventory**: Maintain a comprehensive inventory of all assets
- **Dashboard**: Visual overview of your security posture with key metrics
- **Reports**: Generate detailed reports on vulnerability status
- **API Integration**: Easily integrate with existing security tools via API
- **User Management**: Role-based access control

## Technology Stack

### Backend
- Node.js + TypeScript
- Express.js
- Prisma ORM
- SQLite
- JWT Authentication

### Frontend
- React + TypeScript
- Material-UI
- React Router
- Axios
- Recharts for data visualization

## Prerequisites

- Node.js (v14+)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/IntelliVulnScan.git
cd IntelliVulnScan
```

2. Install dependencies for backend:
```bash
cd backend
npm install
```

3. Set up database:
```bash
npm run migrate
npm run seed
```

4. Install dependencies for frontend:
```bash
cd ../frontend
npm install
```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend application:
```bash
cd frontend
npm start
```

3. Access the application at http://localhost:3000

## Default Credentials

- Admin: admin@intellivulnscan.com / admin123
- User: user@intellivulnscan.com / password123

## API Endpoints

- **Authentication**: `/api/auth`
- **Settings**: `/api/settings`
- **API Keys**: `/api/api-keys`
- **Vulnerabilities**: `/api/vulnerabilities`
- **Assets**: `/api/assets`
- **Scans**: `/api/scans`
- **Reports**: `/api/reports`

## Dashboard

The dashboard provides a comprehensive overview of your security posture, including:

- Vulnerability metrics by severity
- Vulnerability trends over time
- Top vulnerable assets
- Recent scans

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions, issues, and feature requests are welcome! 

