import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("admin123", 10);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      name: "Admin",
      role: Role.ADMIN,
    },
  });

  const staffPassword = await hash("staff123", 10);
  await prisma.user.upsert({
    where: { username: "hassan" },
    update: {},
    create: {
      username: "hassan",
      passwordHash: staffPassword,
      name: "Hassan",
      role: Role.STAFF,
      staffProfile: {
        create: {
          employeeId: "EMP001",
          phone: "+91 90000 00000",
          department: "Operations",
          isActive: true,
        },
      },
    },
  });

  console.log("Seeded admin (admin/admin123) and staff (hassan/staff123)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
