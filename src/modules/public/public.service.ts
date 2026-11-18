import { Injectable, NotFoundException } from "@nestjs/common"
import { MediaStatus, ProjectKind, PublicationState } from "../../generated/prisma/client.js"
import { PrismaService } from "../../database/prisma.service.js"
import type { ContactSubmissionDto, PublicProjectQueryDto } from "./dto/public.dto.js"

@Injectable()
export class PublicService {
  constructor(private readonly prisma: PrismaService) {}

  async site() {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: "site" },
      include: {
        socialLinks: { where: { visible: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] },
        logoMedia: true,
        faviconMedia: true,
      },
    })
    return settings ?? null
  }

  async navigation() {
    return this.prisma.navigationItem.findMany({
      where: { visible: true },
      orderBy: [{ placement: "asc" }, { parentId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    })
  }

  async home() {
    const [site, navigation, sections, projects, services, team, testimonials] = await Promise.all([
      this.site(),
      this.navigation(),
      this.prisma.homepageSection.findMany({ where: { visible: true }, orderBy: { sectionKey: "asc" } }),
      this.prisma.project.findMany({
        where: { publicationState: PublicationState.PUBLISHED, visible: true, featured: true },
        include: { media: { where: { isCover: true }, include: { mediaAsset: true }, take: 1 } },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      this.prisma.service.findMany({
        where: { publicationState: PublicationState.PUBLISHED, visible: true },
        include: { coverMedia: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      this.prisma.teamMember.findMany({
        where: { visible: true }, include: { photoMedia: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
      this.prisma.testimonial.findMany({
        where: { visible: true }, include: { avatarMedia: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
    ])
    return {
      site,
      navigation,
      sections,
      featuredProjects: projects.map((project) => this.projectResponse(project)),
      services: services.map((service) => this.serviceResponse(service)),
      team: team.map((member) => this.teamResponse(member)),
      testimonials: testimonials.map((testimonial) => this.testimonialResponse(testimonial)),
    }
  }

  async listProjects(query: PublicProjectQueryDto) {
    const kind = query.kind === "software" ? ProjectKind.SOFTWARE : query.kind === "general" ? ProjectKind.GENERAL : undefined
    const projects = await this.prisma.project.findMany({
      where: {
        publicationState: PublicationState.PUBLISHED,
        visible: true,
        ...(kind ? { kind } : {}),
        ...(query.featured ? { featured: true } : {}),
      },
      include: { media: { where: { isCover: true }, include: { mediaAsset: true }, take: 1 } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    })
    return { data: projects.map((project) => this.projectResponse(project)) }
  }

  async project(kindInput: "general" | "software", slug: string) {
    const kind = kindInput === "software" ? ProjectKind.SOFTWARE : ProjectKind.GENERAL
    const project = await this.prisma.project.findFirst({
      where: { kind, slug, publicationState: PublicationState.PUBLISHED, visible: true },
      include: { media: { include: { mediaAsset: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] } },
    })
    if (!project) throw new NotFoundException("Project not found.")
    return this.projectResponse(project)
  }

  async services() {
    const services = await this.prisma.service.findMany({
      where: { publicationState: PublicationState.PUBLISHED, visible: true },
      include: { coverMedia: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    })
    return { data: services.map((service) => this.serviceResponse(service)) }
  }

  async service(slug: string) {
    const service = await this.prisma.service.findFirst({
      where: { slug, publicationState: PublicationState.PUBLISHED, visible: true },
      include: { coverMedia: true },
    })
    if (!service) throw new NotFoundException("Service not found.")
    return this.serviceResponse(service)
  }

  async submitContact(input: ContactSubmissionDto) {
    const submission = await this.prisma.contactSubmission.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        company: input.company?.trim() || null,
        message: input.message.trim(),
      },
    })
    return { id: submission.id, status: "received" }
  }

  private projectResponse(project: any) {
    const media = project.media?.map((item: any) => this.mediaUrl(item.mediaAsset)).filter(Boolean) ?? []
    return { ...project, kind: project.kind === ProjectKind.SOFTWARE ? "software" : "general", media }
  }

  private serviceResponse(service: any) {
    return { ...service, coverMedia: this.mediaUrl(service.coverMedia) }
  }

  private teamResponse(member: any) {
    return { ...member, photoMedia: this.mediaUrl(member.photoMedia) }
  }

  private testimonialResponse(testimonial: any) {
    return { ...testimonial, avatarMedia: this.mediaUrl(testimonial.avatarMedia) }
  }

  private mediaUrl(media: { status?: MediaStatus; publicUrl?: string | null } | null | undefined) {
    return media?.status === MediaStatus.READY ? media.publicUrl ?? null : null
  }
}
