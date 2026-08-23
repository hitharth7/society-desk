import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]:', err.stack || err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server.';

  res.status(status).json({
    error: message,
  });
};
