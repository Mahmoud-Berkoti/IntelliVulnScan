import { Request, Response, NextFunction } from 'express';

// Define custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Cast to AppError if possible, otherwise use defaults
  const statusCode = (err as AppError).statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const isOperational = (err as AppError).isOperational || false;

  // Log error
  console.error(`[Error] ${statusCode} - ${message}`);
  if (!isOperational) {
    console.error(err.stack);
  }

  // Send response
  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      path: req.path,
      timestamp: new Date().toISOString(),
    }
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(err);
}; 