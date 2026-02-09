import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { BaseResponse } from '@gym-monorepo/shared';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus() as HttpStatus;
    const exceptionResponse: unknown = exception.getResponse();
    const responseBody: BaseResponse & { code?: string; detail?: any } = {
      success: false,
      message: exception.message,
    };

    if (isExceptionResponse(exceptionResponse)) {
      if ('code' in exceptionResponse) {
        responseBody.code = exceptionResponse.code as string;
      }
      if ('detail' in exceptionResponse) {
        responseBody.detail = exceptionResponse.detail;
      }
      if ('errors' in exceptionResponse && status === HttpStatus.BAD_REQUEST) {
        // This comes from our custom ValidationPipe exceptionFactory
        responseBody.message =
          normalizeMessage(exceptionResponse.message) || 'Validation failed';
        responseBody.errors = exceptionResponse.errors;
      } else if ('message' in exceptionResponse) {
        responseBody.message = normalizeMessage(
          exceptionResponse.message,
        ) as string;
      }
    }

    response.status(status).send(responseBody);
  }
}

type ExceptionResponse = {
  message?: string | string[];
  errors?: Record<string, string[]>;
};

function isExceptionResponse(value: unknown): value is ExceptionResponse {
  return typeof value === 'object' && value !== null;
}

function normalizeMessage(message?: string | string[]): string | undefined {
  if (Array.isArray(message)) {
    return message[0];
  }
  return message;
}
