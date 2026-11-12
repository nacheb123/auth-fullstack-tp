// Usage : node prisma/seed.js
// Crée 1 admin, 1 enseignant et plusieurs étudiants avec des dates différentes.
// Mot de passe de tous les comptes de test : Password123
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const users = [
  { name: "Admin", email: "admin@test.com", role: "ADMIN", groupe: null, createdAt: daysAgo(120) },
  { name: "Prof Sami", email: "prof@test.com", role: "ENSEIGNANT", groupe: null, createdAt: daysAgo(100) },
  { name: "Etudiant Ali", email: "etudiant@test.com", role: "ETUDIANT", groupe: "GL1", createdAt: daysAgo(1) },
  { name: "Sarra Ben Ali", email: "sarra@test.com", role: "ETUDIANT", groupe: "GL1", createdAt: daysAgo(3) },
  { name: "Mohamed Trabelsi", email: "mohamed@test.com", role: "ETUDIANT", groupe: "GL2", createdAt: daysAgo(8) },
  { name: "Yasmine Gharbi", email: "yasmine@test.com", role: "ETUDIANT", groupe: "GL2", createdAt: daysAgo(15) },
  { name: "Amine Jlassi", email: "amine@test.com", role: "ETUDIANT", groupe: "INFO3", createdAt: daysAgo(27) },
  { name: "Ines Mansour", email: "ines@test.com", role: "ETUDIANT", groupe: "INFO3", createdAt: daysAgo(45) },
  { name: "Karim Hammami", email: "karim@test.com", role: "ETUDIANT", groupe: "GL1", createdAt: daysAgo(70) },
  { name: "Nour Chaabane", email: "nour@test.com", role: "ETUDIANT", groupe: null, createdAt: daysAgo(95) },
];

async function main() {
  const password = await bcrypt.hash("Password123", 10);
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, groupe: u.groupe, createdAt: u.createdAt },
      create: { ...u, password },
    });
  }
  console.log(`${users.length} utilisateurs créés ou mis à jour.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
