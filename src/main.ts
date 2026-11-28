import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { PinoLoggerService } from "./logger/logger.service";
import { join } from "path";

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        package: "ocr",
        protoPath: join(__dirname, "../src/proto/ocr.proto"),
        url: "0.0.0.0:50051",
      },
    }
  );

  const logger = app.get(PinoLoggerService);
  app.useLogger(logger);

  await app.listen();
  logger.log("OCR gRPC microservice running on port 50051", "Bootstrap");
}
bootstrap();