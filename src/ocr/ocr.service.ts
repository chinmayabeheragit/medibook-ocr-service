import { Injectable, Logger } from "@nestjs/common";
import * as vision from "@google-cloud/vision";

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);
  private client: vision.ImageAnnotatorClient;

  constructor() {
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

      this.logger.log(`Extracted ${medicines.length} medicine names from image`);
      return { rawText, medicines, success: true, error: "" };
    } catch (err: any) {
      this.logger.error(`OCR failed: ${err.message}`);
      return { rawText: "", medicines: [], success: false, error: err.message };
    }
  }

  private extractMedicineNames(text: string): string[] {
    // Split by newlines and common delimiters
    const lines = text.split(/[\n,;]+/);
    
    const medicines: string[] = [];
    
    for (const line of lines) {
      const cleaned = line.trim();
      // Filter out short words, numbers only, and common non-medicine words
      if (
        cleaned.length > 2 &&
        !/^\d+$/.test(cleaned) &&
        !/^(date|dr|name|age|rx|sig|tab|cap|mg|ml|times|day|days|morning|night|afternoon)$/i.test(cleaned)
      ) {
        medicines.push(cleaned.toLowerCase());
      }
    }

    return [...new Set(medicines)]; // deduplicate
  }
}