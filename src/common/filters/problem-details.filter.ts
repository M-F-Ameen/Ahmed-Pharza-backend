import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common"

type HttpResponse = {
  status(code: number): HttpResponse
  json(payload: unknown): void
}

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp()
    const response = context.getResponse<HttpResponse>()
    const request = context.getRequest<{ url?: string; headers?: Record<string, string | string[] | undefined> }>()
    const httpException = exception instanceof HttpException ? exception : null
    const status = httpException?.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR
    const exceptionResponse = httpException?.getResponse()
    const detail = typeof exceptionResponse === "object" && exceptionResponse !== null && "message" in exceptionResponse
      ? Array.isArray(exceptionResponse.message)
        ? exceptionResponse.message.join("; ")
        : String(exceptionResponse.message)
      : status === HttpStatus.INTERNAL_SERVER_ERROR
        ? "An unexpected error occurred."
        : String(exceptionResponse ?? "Request failed.")

    response.status(status).json({
      type: `https://api.cliste.local/problems/${status}`,
      title: HttpStatus[status] ?? "Request failed",
      status,
      detail,
      instance: request.url ?? undefined,
      correlationId: request.headers?.["x-request-id"] ?? undefined,
    })
  }
}
