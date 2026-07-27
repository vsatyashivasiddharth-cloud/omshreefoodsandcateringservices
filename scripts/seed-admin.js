const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Saichotu123", 10);
  const admin = await prisma.admin.create({
    data: {
      name: "Siddharth",
      email: "omshreefoodsandcaterers@gmail.com",
      password: hashedPassword,
    },
  });

  console.log(admin);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });