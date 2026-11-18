import { Injectable, NotFoundException } from "@nestjs/common"
import { Prisma, ProjectKind, PublicationState, RevisionState } from "../../generated/prisma/client.js"
import { PrismaService } from "../../database/prisma.service.js"
import type { AuthenticatedUser } from "../../common/auth/authenticated-user.js"
import type { CreateProjectDto, ProjectKindValue, ProjectListQueryDto, UpdateProjectDto } from "./dto/project.dto.js"

const entityType = "project"

function toProjectKind(kind: ProjectKindValue) {
  return kind === "software" ? ProjectKind.SOFTWARE : ProjectKind.GENERAL
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ProjectListQueryDto) {
    const where: Prisma.ProjectWhereInput = {
      ...(query.kind ? { kind: toProjectKind(query.kind) } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: "insensitive" } },
              { slug: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    }
    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.project.count({ where }),
    ])
    return {
      data,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    }
  }

  async get(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } })
    if (!project) throw new NotFoundException("Project not found.")
    return project
  }

  async create(input: CreateProjectDto, actor: AuthenticatedUser) {
    const project = await this.prisma.project.create({
      data: {
        kind: toProjectKind(input.kind),
        slug: input.slug,
        title: input.title,
        description: input.description,
        imageAlt: input.imageAlt,
        tags: input.tags,
        label: input.label,
        lead: input.lead,
        overview: input.overview,
        challenge: input.challenge,
        approach: input.approach,
        outcome: input.outcome,
        previewUrl: input.previewUrl,
        githubUrl: input.githubUrl,
        featured: input.featured ?? false,
        visible: input.visible ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    })
    await this.createDraftRevision(project, actor.id)
    await this.recordAudit(actor.id, "project.created", project.id, { kind: input.kind })
    return project
  }

  async update(id: string, input: UpdateProjectDto, actor: AuthenticatedUser) {
    await this.get(id)
    const project = await this.prisma.project.update({ where: { id }, data: input })
    await this.createDraftRevision(project, actor.id)
    await this.recordAudit(actor.id, "project.updated", project.id)
    return project
  }

  async publish(id: string, actor: AuthenticatedUser) {
    const project = await this.get(id)
    const result = await this.prisma.$transaction(async (transaction) => {
      const draft = await transaction.contentRevision.findFirst({
        where: { entityType, entityId: id, state: RevisionState.DRAFT },
        orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      })
      const revision = draft ?? await this.createDraftRevision(project, actor.id, transaction)
      await transaction.contentRevision.updateMany({
        where: { entityType, entityId: id, state: RevisionState.PUBLISHED },
        data: { state: RevisionState.SUPERSEDED },
      })
      await transaction.contentRevision.update({
        where: { id: revision.id },
        data: { state: RevisionState.PUBLISHED, publishedAt: new Date() },
      })
      return transaction.project.update({
        where: { id },
        data: { publicationState: PublicationState.PUBLISHED },
      })
    })
    await this.recordAudit(actor.id, "project.published", id)
    return result
  }

  async unpublish(id: string, actor: AuthenticatedUser) {
    await this.get(id)
    const project = await this.prisma.$transaction(async (transaction) => {
      await transaction.contentRevision.updateMany({
        where: { entityType, entityId: id, state: RevisionState.PUBLISHED },
        data: { state: RevisionState.SUPERSEDED },
      })
      return transaction.project.update({ where: { id }, data: { publicationState: PublicationState.DRAFT } })
    })
    await this.recordAudit(actor.id, "project.unpublished", id)
    return project
  }

  private async createDraftRevision(
    project: Prisma.ProjectModel,
    actorId: string,
    transaction: Prisma.TransactionClient = this.prisma,
  ) {
    const latest = await transaction.contentRevision.findFirst({
      where: { entityType, entityId: project.id },
      orderBy: { version: "desc" },
    })
    return transaction.contentRevision.create({
      data: {
        entityType,
        entityId: project.id,
        version: (latest?.version ?? 0) + 1,
        state: RevisionState.DRAFT,
        payload: this.snapshot(project),
        createdBy: actorId,
      },
    })
  }

  private snapshot(project: Prisma.ProjectModel): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(project)) as Prisma.InputJsonValue
  }

  private async recordAudit(actorId: string, action: string, entityId: string, metadata?: Prisma.InputJsonValue) {
    await this.prisma.auditEvent.create({
      data: { actorId, action, entityType, entityId, metadata },
    })
  }
}
