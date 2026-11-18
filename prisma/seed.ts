import "dotenv/config"
import argon2 from "argon2"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, ProjectKind, PublicationState, RevisionState } from "../src/generated/prisma/client.js"

const permissionKeys = [
  "sections",
  "portfolio",
  "software",
  "services",
  "team",
  "testimonials",
  "media",
  "navigation",
  "publishing",
  "settings",
  "users",
  "backups",
] as const

async function main() {
  const connectionString = process.env.DATABASE_URL
  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD
  if (!connectionString || !bootstrapEmail || !bootstrapPassword) {
    throw new Error("DATABASE_URL, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD are required for seed.")
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  const administrator = await prisma.role.upsert({
    where: { name: "Administrator" },
    update: { description: "Full workspace access", isSystem: true },
    create: { name: "Administrator", description: "Full workspace access", isSystem: true },
  })

  await prisma.rolePermission.deleteMany({ where: { roleId: administrator.id } })
  await prisma.rolePermission.createMany({
    data: permissionKeys.map((permissionKey) => ({ roleId: administrator.id, permissionKey })),
  })

  await prisma.user.upsert({
    where: { email: bootstrapEmail.toLowerCase() },
    update: { name: "Administrator", roleId: administrator.id, isActive: true },
    create: {
      name: "Administrator",
      email: bootstrapEmail.toLowerCase(),
      passwordHash: await argon2.hash(bootstrapPassword, { type: argon2.argon2id }),
      roleId: administrator.id,
    },
  })

  const seedProjects = [
    {
      kind: ProjectKind.GENERAL,
      slug: "clutch-by-cliste",
      title: "Clutch by Cliste",
      label: "Customer engagement",
      description: "A smarter showroom experience that helps dealership teams respond with clarity from the first enquiry to the next conversation.",
      imageAlt: "Modern vehicle showroom",
      tags: ["Strategy", "Automation", "Experience"],
      featured: true,
      visible: true,
      sortOrder: 1,
    },
    {
      kind: ProjectKind.SOFTWARE,
      slug: "operations-command-centre",
      title: "Operations command centre",
      label: "Web platform",
      description: "A focused workspace that brings the signals, workflows, and decisions behind a busy operation into one calm interface.",
      imageAlt: "Developer working on a digital product",
      tags: ["Web app", "Systems", "Automation"],
      featured: true,
      visible: true,
      sortOrder: 1,
    },
  ]

  for (const input of seedProjects) {
    const project = await prisma.project.upsert({
      where: { kind_slug: { kind: input.kind, slug: input.slug } },
      update: { ...input, publicationState: PublicationState.PUBLISHED },
      create: { ...input, publicationState: PublicationState.PUBLISHED },
    })
    const publishedRevision = await prisma.contentRevision.findFirst({
      where: { entityType: "project", entityId: project.id, state: RevisionState.PUBLISHED },
    })
    if (!publishedRevision) {
      await prisma.contentRevision.create({
        data: {
          entityType: "project",
          entityId: project.id,
          version: 1,
          state: RevisionState.PUBLISHED,
          payload: JSON.parse(JSON.stringify(project)),
          publishedAt: new Date(),
        },
      })
    }
  }

  await prisma.$disconnect()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
