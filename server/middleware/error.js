import { ZodError } from 'zod';
import multer from 'multer';
import { ApiError } from './auth.js';

export const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

export const errorHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong.';
  let details = error.details;

  if (error instanceof ZodError) {
    statusCode = 422;
    message = error.issues[0]?.message || 'Invalid input.';
    details = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(error.errors)[0]?.message || 'Invalid data.';
  } else if (error.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found.';
  } else if (error.code === 11000) {
    statusCode = 409;
    message = `${Object.keys(error.keyValue || { field: '' })[0]} already exists.`;
  } else if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : error.message;
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Your session has expired. Please login again.';
  }

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[error]', error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
};
