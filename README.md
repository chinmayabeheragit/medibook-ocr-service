# Medibook OCR Service

A NestJS gRPC microservice that extracts text from prescription or medicine images using Google Cloud Vision OCR. The service is part of the Medibook backend and exposes one OCR RPC that returns the complete detected text and a deduplicated list of possible medicine names.

## Current Status

The project currently provides:

- A NestJS microservice using the gRPC transport.
- A `ocr.OcrService` gRPC API on port `50051`.
- Google Cloud Vision text detection.
- A `ExtractText` RPC for image OCR.
- Basic medicine-name extraction from the detected text.
- Environment-based Google credentials loading.
- Unit-test and end-to-end-test setup.
- TypeScript strict mode, build, formatting, linting, and Jest scripts.

This is an OCR/heuristic service, not a clinical prescription validation service. The returned medicine list is generated from text lines and delimiter-based filtering; it is not a verified drug database lookup.

## Technology Stack

- Node.js
- TypeScript
- NestJS 12
- NestJS microservices
- gRPC and Protocol Buffers
- Google Cloud Vision (`@google-cloud/vision`)
- Jest and Supertest
- Oxlint
- Prettier

## Architecture

```text
gRPC client
    |
    | ExtractText(image bytes, MIME type)
    v
OcrController
    |
    v
OcrService
    |
    v
Google Cloud Vision textDetection
    |
    v
raw text + heuristic medicine candidates
```

The application starts as a gRPC microservice rather than a normal HTTP server. HTTP controller and app service files from the NestJS starter remain in the repository for unit/e2e testing, but the application bootstrap exposes no HTTP endpoint.

## API

The protobuf contract is defined in [`src/proto/ocr.proto`](/C:/Users/Dcuser/Desktop/devlope/MEDIBOOK_BACKEND/medibook-ocr-service/src/proto/ocr.proto).

### Package

```text
ocr
```

### Service

```protobuf
service OcrService {
  rpc ExtractText (ExtractTextRequest) returns (ExtractTextResponse);
}
```

### ExtractText Request

| Field | Protobuf type | Description |
|---|---|---|
| `image` | `bytes` | Raw image file content. |
| `mime_type` | `string` | MIME type supplied by the caller, for example `image/jpeg` or `image/png`. |

```protobuf
message ExtractTextRequest {
  bytes image = 1;
  string mime_type = 2;
}
```

### ExtractText Response

| Field | Protobuf type | Description |
|---|---|---|
| `raw_text` | `string` | Text returned from Google Cloud Vision. |
| `medicines` | `string[]` | Deduplicated lowercase medicine candidates. |
| `success` | `bool` | `true` when OCR completed; `false` when Vision API processing failed. |
| `error` | `string` | Vision API error message, or an empty string on success. |

```protobuf
message ExtractTextResponse {
  string raw_text = 1;
  repeated string medicines = 2;
  bool success = 3;
  string error = 4;
}
```

Example response:

```json
{
  "raw_text": "Dr. Smith\nCrocin 500 mg\nTwice daily",
  "medicines": [
    "dr. smith",
    "crocin 500 mg",
    "twice"
  ],
  "success": true,
  "error": ""
}
```

The exact output depends on Google Vision detections and the current text heuristics.

## Processing Flow

1. A gRPC client calls `ocr.OcrService/ExtractText`.
2. [`OcrController`](/C:/Users/Dcuser/Desktop/devlope/MEDIBOOK_BACKEND/medibook-ocr-service/src/ocr/ocr.controller.ts) receives the request.
3. The image bytes are converted to a Node.js `Buffer` if necessary.
4. [`OcrService`](/C:/Users/Dcuser/Desktop/devlope/MEDIBOOK_BACKEND/medibook-ocr-service/src/ocr/ocr.service.ts) sends the image content to Google Cloud Vision `textDetection`.
5. If no text annotations are found, the service returns an empty text and medicine list with `success: true`.
6. If text is found, the first annotation description is used as the full detected text.
7. Text is split by newline, comma, and semicolon delimiters.
8. Short values, numeric-only values, and a fixed set of prescription words are filtered out.
9. Remaining values are converted to lowercase and deduplicated.
10. The result is mapped back to the protobuf response fields.

### Current Medicine Extraction Behavior

The medicine extraction is deliberately simple:

- Values longer than two characters are retained.
- Numeric-only values are removed.
- The following words are ignored case-insensitively: `date`, `dr`, `name`, `age`, `rx`, `sig`, `tab`, `cap`, `mg`, `ml`, `times`, `day`, `days`, `morning`, `night`, and `afternoon`.
- Output is lowercase.
- Duplicate values are removed.

The service currently does not use `mime_type` when calling Google Vision, does not verify recognized text against a medicine database, and does not classify dosage instructions into structured fields.

## Prerequisites

- Node.js 20.19+ or 22.12+
- npm
- A Google Cloud project
- Google Cloud Vision API enabled
- A Google service account credential with permission to use Vision

Using NestJS packages in this project requires a compatible Node.js version.

## Installation

```bash
npm install
```

## Google Cloud Credentials

Create or download a Google Cloud service-account JSON key and set `GOOGLE_APPLICATION_CREDENTIALS` to its path.

For the current local setup, the path in [`.env`](/C:/Users/Dcuser/Desktop/devlope/MEDIBOOK_BACKEND/medibook-ocr-service/.env) is:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
PORT=50051
NODE_ENV=development
```

The credential file [`google-credentials.json`](/C:/Users/Dcuser/Desktop/devlope/MEDIBOOK_BACKEND/medibook-ocr-service/google-credentials.json) and `.env` are ignored by Git. Do not commit either file or expose it in logs or screenshots.

If the key is exposed or checked into version control, revoke or rotate it in Google Cloud immediately and create a new service account key.

### Environment Variables

| Variable | Required | Current use | Default |
|---|---:|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | Yes | Google Cloud service-account credential path | None |
| `PORT` | No | Documented intended gRPC port | `50051` |
| `NODE_ENV` | No | Runtime environment label | Not set |

The current gRPC bootstrap hardcodes `0.0.0.0:50051`; changing `PORT` in `.env` alone does not change the listening address.

## Running the Service

### Development

```bash
npm run start:dev
```

### Standard start

```bash
npm run start
```

### Debug mode

```bash
npm run start:debug
```

### Production build and start

```bash
npm run build
npm run start:prod
```

When started successfully, the microservice listens on:

```text
0.0.0.0:50051
```

It logs:

```text
OCR gRPC microservice running on port 50051
```

## Connecting with a gRPC Client

Load [`ocr.proto`](/C:/Users/Dcuser/Desktop/devlope/MEDIBOOK_BACKEND/medibook-ocr-service/src/proto/ocr.proto), connect to `127.0.0.1:50051`, and call:

```text
ocr.OcrService.ExtractText
```

With the image file `prescription.jpg`, the request conceptually contains:

```json
{
  "image": "<binary image content>",
  "mime_type": "image/jpeg"
}
```

No HTTP REST route is currently registered.

## Project Structure

```text
medibook-ocr-service/
├── src/
│   ├── app.module.ts              # Loads global configuration and OCR module
│   ├── app.controller.ts          # Nest starter HTTP controller
│   ├── app.controller.spec.ts     # Starter unit test
│   ├── app.service.ts             # Starter service
│   ├── main.ts                    # gRPC microservice bootstrap
│   ├── ocr/
│   │   ├── ocr.controller.ts      # gRPC ExtractText method
│   │   ├── ocr.module.ts          # OCR module wiring
│   │   └── ocr.service.ts         # Google Vision and text heuristics
│   └── proto/
│       └── ocr.proto              # gRPC package and message contract
├── test/
│   ├── app.e2e-spec.ts            # Starter end-to-end HTTP test
│   └── jest-e2e.json              # End-to-end Jest configuration
├── .env                            # Local environment configuration
├── google-credentials.json         # Local Google credential file
├── jest.config.ts                  # Unit-test configuration
├── nest-cli.json                   # Nest CLI configuration
├── package.json                    # Scripts and dependencies
├── tsconfig.json                   # TypeScript compiler settings
└── tsconfig.build.json             # Production build settings
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run build` | Compile the project into `dist`. |
| `npm run start` | Start the NestJS application once. |
| `npm run start:dev` | Start in watch mode. |
| `npm run start:debug` | Start with Node debugging and watch mode. |
| `npm run start:prod` | Run the compiled `dist/main` entry point. |
| `npm run format` | Format source and test TypeScript files with Prettier. |
| `npm run lint` | Run Oxlint with type-aware checks. |
| `npm test` | Run unit tests. |
| `npm run test:watch` | Run unit tests in watch mode. |
| `npm run test:cov` | Run unit tests and collect coverage. |
| `npm run test:debug` | Run tests in Node inspector mode. |
| `npm run test:e2e` | Run end-to-end tests. |
| `npm run deploy` | Run the Nest deployment script. |

## Testing

Run unit tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:cov
```

Run end-to-end tests:

```bash
npm run test:e2e
```

The current test suite includes:

- `src/app.controller.spec.ts`, verifying the starter `AppController` behavior.
- `test/app.e2e-spec.ts`, verifying the starter `/` HTTP response.

These tests do not currently exercise the gRPC `ExtractText` RPC or Google Vision integration directly.

## Build and TypeScript Configuration

- TypeScript target: `ES2023`
- Module system: `nodenext`
- Strict type checking is enabled.
- Decorator metadata is enabled.
- Production builds include `src`, excluding tests and test specifications.
- The build output is written to `dist`.
- Nest CLI removes the existing `dist` directory before rebuilding.

## Error Handling

Google Vision failures are caught inside `OcrService`.

The service returns:

```json
{
  "raw_text": "",
  "medicines": [],
  "success": false,
  "error": "<error message>"
}
```

Unexpected exceptions thrown before `OcrService` processing or by the gRPC framework may still be handled by NestJS/gRPC rather than by the response fields above.

## Security and Secrets

- `.env` is ignored by Git.
- `google-credentials.json` is ignored by Git.
- The credential JSON should have only the permissions required for Google Cloud Vision.
- Do not add credentials or private keys to source, logs, test fixtures, or README examples.
- Restrict network exposure of port `50051` according to deployment requirements.
- The service currently has no authentication or authorization on the gRPC endpoint.
- The service currently has no request-size limit or explicit image validation beyond gRPC bytes.

## Troubleshooting

### Credentials not found

Verify that `GOOGLE_APPLICATION_CREDENTIALS` is set and that the path is valid. The repository `.env` uses a relative path, so run the service from the repository root.

### Vision API authentication or permission errors

Confirm that:

- The service-account credential belongs to the correct project.
- Cloud Vision API is enabled.
- The service account has permission to invoke Vision.
- The credential has not been revoked or expired.

### Port already in use

Stop the process currently using port `50051`, or change the listening URL in [`src/main.ts`](/C:/Users/Dcuser/Desktop/devlope/MEDIBOOK_BACKEND/medibook-ocr-service/src/main.ts). Changing only `PORT` in `.env` does not affect the current bootstrap.

### No text detected

The response is successful but contains:

```json
{
  "raw_text": "",
  "medicines": [],
  "success": true,
  "error": ""
}
```

Try a sharper image with better lighting and a readable prescription or medicine label.

## Current Limitations and Recommended Next Work

- Add a real gRPC test client or integration test for `ExtractText`.
- Mock Google Vision for deterministic unit tests.
- Use `PORT` from configuration instead of hardcoding `50051`.
- Validate `mime_type`, image size, and supported formats.
- Pass the MIME type to an appropriate Vision image method or validate it before processing.
- Replace generic word filtering with structured OCR post-processing.
- Add known medicine recognition from a curated database or pharmacy reference API.
- Separate dosage, frequency, quantity, and medicine name fields.
- Add gRPC authentication and TLS.
- Add request timeouts, size limits, and rate limiting.
- Remove or repurpose the starter HTTP controller and app service once no longer needed.
- Add health checks and production observability.
- Add Docker configuration if container deployment is required.
