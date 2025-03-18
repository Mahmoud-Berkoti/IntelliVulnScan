# IntelliVulnScan Frontend

This is the frontend application for the IntelliVulnScan system, an Intelligent Vulnerability Detection and Prioritization platform.

## Features

- Dashboard with vulnerability statistics and metrics
- Asset management for tracking systems and applications
- Vulnerability scanning and results visualization
- Machine learning-based vulnerability prioritization
- User authentication and role-based access control
- Responsive design for desktop and mobile devices

## Technology Stack

- **React**: Frontend library for building user interfaces
- **TypeScript**: Type-safe JavaScript
- **Material-UI**: React component library implementing Google's Material Design
- **React Router**: Declarative routing for React applications
- **Axios**: Promise-based HTTP client
- **Recharts**: Composable charting library for React

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```
   cd IntelliVulnScan/frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

### Development

Start the development server:

```
npm start
```

or

```
yarn start
```

The application will be available at http://localhost:3000 and will proxy API requests to the backend at http://localhost:8000.

### Building for Production

Build the application for production:

```
npm run build
```

or

```
yarn build
```

The build artifacts will be stored in the `build/` directory.

## Project Structure

```
frontend/
├── public/             # Static files
├── src/                # Source code
│   ├── components/     # Reusable components
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application component
│   └── index.tsx       # Application entry point
├── package.json        # Dependencies and scripts
└── tsconfig.json       # TypeScript configuration
```

## API Integration

The frontend communicates with the IntelliVulnScan backend API. The API base URL is configured in the `package.json` file using the `proxy` field for development, and should be configured in environment variables for production deployments.

## Authentication

The application uses JWT (JSON Web Tokens) for authentication. Tokens are stored in localStorage and included in API requests via Axios interceptors.

## Theming

The application supports both light and dark themes, which can be toggled by the user. Theme preferences are saved in localStorage.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request 