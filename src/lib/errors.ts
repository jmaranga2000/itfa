export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "CONFIGURATION_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication is required.") {
    super("UNAUTHENTICATED", message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super("FORBIDDEN", message, 403);
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super("CONFIGURATION_ERROR", message, 500);
  }
}
