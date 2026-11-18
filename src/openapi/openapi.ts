import type { INestApplication } from "@nestjs/common"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

export function configureOpenApi(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle("Cliste API")
    .setDescription("Separate content, media, publishing, and administration API for Cliste.")
    .setVersion("1.0.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "access-token")
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("docs", app, documentFactory, {
    jsonDocumentUrl: "docs-json",
    customSiteTitle: "Cliste API documentation",
  })
}
