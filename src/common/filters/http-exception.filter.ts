import { ExceptionFilter, HttpException } from '@nestjs/common';

import { ERROR_MESSAGES } from '../const/error-message';

export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message = ERROR_MESSAGES.InternalServerErrorException;

    if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionName = exception.constructor.name;

      message = ERROR_MESSAGES[exceptionName] || exception.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
