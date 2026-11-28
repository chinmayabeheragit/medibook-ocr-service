import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OcrModule } from "./ocr/ocr.module";
import { LoggerModule } from "./logger/logger.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    OcrModule,
  ],
})
export class AppModule {}