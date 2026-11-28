import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { OcrService } from "./ocr.service";
import { PinoLoggerService } from "../logger/logger.service";

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
  ) {}

  @GrpcMethod("OcrService", "ExtractText")
  async extractText(data: ExtractTextRequest): Promise<ExtractTextResponse> {
    this.logger.log("Received gRPC ExtractText request", "OcrController");

    const imageBuffer = Buffer.isBuffer(data.image)
      ? data.image
      : Buffer.from(data.image);

    const result = await this.ocrService.extractText(imageBuffer, data.mime_type);

    return {
      raw_text: result.rawText,
      medicines: result.medicines,
      success: result.success,
      error: result.error,
    };
  }
}