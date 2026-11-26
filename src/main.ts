import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
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

  await app.listen();
  console.log("OCR gRPC microservice running on port 50051");
}
bootstrap();