import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
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

    const responseBody: BaseResponse = {
      success: false,
      message: exception.message,
    };

    if (
      status === HttpStatus.BAD_REQUEST &&
      isExceptionResponse(exceptionResponse) &&
      'errors' in exceptionResponse
    ) {
      // This comes from our custom ValidationPipe exceptionFactory
      responseBody.message =
        normalizeMessage(exceptionResponse.message) || 'Validation failed';
      responseBody.errors = exceptionResponse.errors;
    } else if (
      exception instanceof BadRequestException &&
      isExceptionResponse(exceptionResponse) &&
      'message' in exceptionResponse
    ) {
      // Handle manual BadRequestException(message)
      // If message is "Role with this name already exists", we might want to map it?
      // Or we just send it as general message.
      // If we want field specific manual errors, we should populate 'errors' in the exception.
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
