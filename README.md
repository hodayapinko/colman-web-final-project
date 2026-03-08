# Node.js Express TypeScript Application

A modern Node.js application built with Express and TypeScript.

## Features

- Express.js web framework
- TypeScript for type safety
- CORS enabled
- Environment variable configuration
- Modular route structure
- Error handling middleware

## Project Structure

```
├── src/
│   ├── server.ts           # Application entry point
│   ├── routes/             # Route definitions
│   │   ├── index.ts        # Route aggregator
│   └── middleware/         # Custom middleware
│       └── errorHandler.ts
├── dist/                   # Compiled JavaScript output
├── .env                    # Environment variables
├── tsconfig.json           # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Getting Started

### Installation

```bash
npm install
```

### Development

Run the application in development mode with hot reload:

```bash
npm run dev
```

Or with nodemon for automatic restarts:

```bash
npm run dev:watch
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Production

Run the compiled application:

```bash
npm start
```

## Available Endpoints

- `GET /health` - Health check endpoint

## Environment Variables

Configure these variables in your `.env` file:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## License

ISC

<img width="751" height="1093" alt="image" src="https://github.com/user-attachments/assets/0a274125-8bce-4a45-a838-d648edfbb1a0" />

