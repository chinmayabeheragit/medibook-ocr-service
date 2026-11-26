import { Controller, Logger } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";
import { OcrService } from "./ocr.service";

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
  private readonly logger = new Logger(OcrController.name);

  constructor(private readonly ocrService: OcrService) {}

  @GrpcMethod("OcrService", "ExtractText")
  async extractText(data: ExtractTextRequest): Promise<ExtractTextResponse> {
    this.logger.log("Received gRPC ExtractText request");

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