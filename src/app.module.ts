import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OcrModule } from "./ocr/ocr.module";
import { LoggerModule } from "./logger/logger.module";
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    OcrModule,
    MetricsModule
  ],
})
export class AppModule {}