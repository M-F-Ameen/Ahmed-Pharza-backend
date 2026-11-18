import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { randomUUID } from "node:crypto"
import { MediaStatus } from "../../generated/prisma/client.js"
import { AppConfigService } from "../../config/config.service.js"
import { PrismaService } from "../../database/prisma.service.js"
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js"
import type { CompleteUploadDto, CreateUploadUrlDto } from "./dto/media.dto.js"

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"])

@Injectable()
export class MediaService {
  private readonly client: S3Client

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {
    const storage = config.storage
    this.client = new S3Client({
      endpoint: storage.endpoint,
      region: storage.region,
      forcePathStyle: true,
      credentials: { accessKeyId: storage.accessKeyId, secretAccessKey: storage.secretAccessKey },
    })
  }

  async createUploadUrl(input: CreateUploadUrlDto, actor: AuthenticatedUser) {
    if (!allowedMimeTypes.has(input.mimeType)) throw new BadRequestException("This file type is not supported.")
    const storage = this.config.storage
    const extension = input.originalFilename.toLowerCase().split(".").pop()?.replace(/[^a-z0-9]/g, "") || "bin"
    const storageKey = `pending/${randomUUID()}.${extension}`
    const asset = await this.prisma.mediaAsset.create({
      data: {
        storageKey,
        mimeType: input.mimeType,
        byteSize: input.byteSize,
        altText: input.altText,
        originalFilename: input.originalFilename,
        uploadedById: actor.id,
      },
    })
    const uploadUrl = await getSignedUrl(this.client, new PutObjectCommand({
      Bucket: storage.bucket,
      Key: storageKey,
      ContentType: input.mimeType,
      ContentLength: input.byteSize,
    }), { expiresIn: 10 * 60 })
    return { assetId: asset.id, storageKey, uploadUrl, expiresIn: 600 }
  }

  async complete(id: string, input: CompleteUploadDto, actor: AuthenticatedUser) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } })
    if (!asset || asset.status !== MediaStatus.PENDING) throw new NotFoundException("Pending media upload not found.")
    if (asset.uploadedById && asset.uploadedById !== actor.id && !actor.permissions.includes("users")) {
      throw new NotFoundException("Pending media upload not found.")
    }
    try {
      const object = await this.client.send(new HeadObjectCommand({ Bucket: this.config.storage.bucket, Key: asset.storageKey }))
      if (object.ContentLength !== asset.byteSize || object.ContentType !== asset.mimeType) {
        throw new BadRequestException("Uploaded file metadata does not match the requested upload.")
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException("The uploaded file could not be verified.")
    }
    return this.prisma.mediaAsset.update({
      where: { id },
      data: {
        status: MediaStatus.READY,
        width: input.width,
        height: input.height,
        publicUrl: `${this.config.storage.publicBaseUrl}/${asset.storageKey}`,
      },
    })
  }

  async list() {
    return this.prisma.mediaAsset.findMany({ where: { status: { not: MediaStatus.DELETED } }, orderBy: { createdAt: "desc" } })
  }

  async remove(id: string, actor: AuthenticatedUser) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id } })
    if (!asset) throw new NotFoundException("Media asset not found.")
    return this.prisma.$transaction(async (transaction) => {
      await transaction.projectMedia.deleteMany({ where: { mediaAssetId: id } })
      await transaction.mediaAsset.update({ where: { id }, data: { status: MediaStatus.DELETED, publicUrl: null } })
      return transaction.auditEvent.create({ data: { actorId: actor.id, action: "media.deleted", entityType: "media", entityId: id } })
    })
  }
}
