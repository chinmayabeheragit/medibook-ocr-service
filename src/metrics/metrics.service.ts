import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: client.Registry;
  private readonly grpcRequestTotal: client.Counter;
  private readonly grpcRequestDuration: client.Histogram;
  private readonly grpcErrorsTotal: client.Counter;

  constructor() {
    this.register = new client.Registry();
    client.collectDefaultMetrics({ register: this.register });

    this.grpcRequestTotal = new client.Counter({
      name: 'grpc_requests_total',
      help: 'Total number of gRPC requests',
      labelNames: ['method', 'status'],
      registers: [this.register],
    });

    this.grpcRequestDuration = new client.Histogram({
      name: 'grpc_request_duration_seconds',
      help: 'Duration of gRPC requests in seconds',
      labelNames: ['method'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.register],
    });

    this.grpcErrorsTotal = new client.Counter({
      name: 'grpc_errors_total',
      help: 'Total number of gRPC errors',
      labelNames: ['method', 'error_type'],
      registers: [this.register],
    });
  }

  recordRequest(method: string, status: string, durationMs: number) {
    this.grpcRequestTotal.inc({ method, status });
    this.grpcRequestDuration.observe({ method }, durationMs / 1000);
  }

  recordError(method: string, errorType: string) {
    this.grpcErrorsTotal.inc({ method, error_type: errorType });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}