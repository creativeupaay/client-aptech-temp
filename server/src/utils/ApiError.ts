export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: unknown;

  constructor(
    statusCode: number,
    message: string,
    errors?: unknown,
    isOperational = true,
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static badRequest(message = "Bad Request", errors?: unknown): ApiError {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized"): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden"): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found"): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = "Conflict occurred"): ApiError {
    return new ApiError(409, message);
  }

  static badGateway(message = "Bad Gateway"): ApiError {
    return new ApiError(502, message);
  }

  static gatewayTimeout(message = "Gateway Timeout"): ApiError {
    return new ApiError(504, message);
  }

  static serviceUnavailable(message = "Service Unavailable"): ApiError {
    return new ApiError(503, message);
  }

  static internal(message = "Internal Server Error"): ApiError {
    return new ApiError(500, message, undefined, false);
  }
}
