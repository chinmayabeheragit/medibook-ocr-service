import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { OcrService } from "./ocr.service";
import { PinoLoggerService } from "../logger/logger.service";
import { MetricsService } from "../metrics/metrics.service";

interface ExtractTextRequest {
  image: Buffer;
  mime_type: string;
}

interface ExtractTextResponse {
  raw_text: string;
  medicines: string[];
  success: boolean;
  error: string;
}

@Controller()
export class OcrController {
  constructor(
    private readonly ocrService: OcrService,
    private readonly logger: PinoLoggerService,
    private readonly metrics: MetricsService,
  ) {}

  @GrpcMethod("OcrService", "ExtractText")
  async extractText(data: ExtractTextRequest): Promise<ExtractTextResponse> {
    const start = Date.now();
    this.logger.log("Received gRPC ExtractText request", "OcrController");

    const imageBuffer = Buffer.isBuffer(data.image)
      ? data.image
      : Buffer.from(data.image);

    const result = await this.ocrService.extractText(imageBuffer, data.mime_type);

    const duration = Date.now() - start;

    if (result.success) {
      this.metrics.recordRequest('ExtractText', 'success', duration);
    } else {
      this.metrics.recordRequest('ExtractText', 'error', duration);
      this.metrics.recordError('ExtractText', 'ocr_failed');
    }

    return {
      raw_text: result.rawText,
      medicines: result.medicines,
      success: result.success,
      error: result.error,
    };
  }
}