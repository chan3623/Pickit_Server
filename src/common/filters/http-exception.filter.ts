import { ExceptionFilter, HttpException, ArgumentsHost, Logger } from '@nestjs/common';
import { ERROR_MESSAGES } from '../const/error-message';

export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: any, host: ArgumentsHost) {
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

    const logMessage = `${request.method} ${request.url} ${status} - ${message}`;
    if (status >= 500) {
      this.logger.error(logMessage, exception.stack);
    } else {
      this.logger.warn(logMessage);
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
