import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { BaseResponse } from '@gym-monorepo/shared';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const responseBody: BaseResponse = {
      success: false,
      message: exception.message,
    };

    if (
        status === HttpStatus.BAD_REQUEST &&
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'errors' in exceptionResponse
    ) {
        // This comes from our custom ValidationPipe exceptionFactory
        responseBody.message = (exceptionResponse as any).message || 'Validation failed';
        responseBody.errors = (exceptionResponse as any).errors;
    } else if (
        exception instanceof BadRequestException &&
        typeof exceptionResponse === 'object' &&
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
