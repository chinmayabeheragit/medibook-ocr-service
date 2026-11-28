import { Injectable } from "@nestjs/common";
import * as vision from "@google-cloud/vision";
import { PinoLoggerService } from "../logger/logger.service";

@Injectable()
export class OcrService {
  private client: vision.ImageAnnotatorClient;

  constructor(private readonly logger: PinoLoggerService) {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  async extractText(imageBuffer: Buffer, mimeType: string): Promise<{
    rawText: string;
    medicines: string[];
    success: boolean;
    error: string;
  }> {
    try {
      const [result] = await this.client.textDetection({
        image: { content: imageBuffer },
      });

      const detections = result.textAnnotations;
      if (!detections || detections.length === 0) {
        return { rawText: "", medicines: [], success: true, error: "" };
      }

      const rawText = detections[0].description || "";
      const medicines = this.extractMedicineNames(rawText);

      this.logger.log(
        `Extracted ${medicines.length} medicine names from image`,
        'OcrService'
      );
      return { rawText, medicines, success: true, error: "" };
    } catch (err: any) {
      this.logger.error(`OCR failed: ${err.message}`, err.stack, 'OcrService');
      return { rawText: "", medicines: [], success: false, error: err.message };
    }
  }

  private extractMedicineNames(text: string): string[] {
    const lines = text.split(/[\n,;]+/);
    const medicines: string[] = [];

    const skipPatterns = /^(uses|mechanism|action|side effects|dose|adult|relief|reduces|fever|pain|common|do not|maximum|every|hours|nausea|rash|liver|used in|colds|flu|febrile|reducing|regulating|inhibits|synthesis|central|nervous|system|perception|body|temperature|hypothalamus|prostaglandin|analgesic|antipyretic|headache|toothache|muscle|backache|menstrual|osteoarthritis|overdose|recommended|needed|mg|ml|tab|cap|times|day|days|morning|night|afternoon|date|dr|name|age|rx|sig|to\s+\d|as\s+needed|in\s+the)/i;

    for (const line of lines) {
      const cleaned = line.trim().replace(/^[•\-\*\[\(]+|[\]\)]+$/g, '').trim();
      if (
        cleaned.length > 2 &&
        cleaned.split(' ').length <= 3 &&
        !/^\d+$/.test(cleaned) &&
        !/^\d+[\s\-to]+\d+/.test(cleaned) &&
        !skipPatterns.test(cleaned)
      ) {
        medicines.push(cleaned.toLowerCase());
      }
    }
    return [...new Set(medicines)];
  }
}