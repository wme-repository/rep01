export class RetryableError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'RetryableError';
    this.statusCode = statusCode;
  }
}

export class NonRetryableError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'NonRetryableError';
    this.statusCode = statusCode;
  }
}

export class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
    this.statusCode = 500;
  }
}
