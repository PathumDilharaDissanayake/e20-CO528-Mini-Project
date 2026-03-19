export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export const successResponse = <T>(
  data: T,
  message = 'Success',
  meta?: ApiResponse['meta']
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  meta
});

export const errorResponse = (
  message = 'Error occurred',
  error?: any
): ApiResponse => ({
  success: false,
  message,
  error
});

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
