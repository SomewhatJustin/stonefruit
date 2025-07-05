import { prisma } from "@/prisma/prisma"
import { generateAvatar } from "@/scripts/generateAvatar"

async function main() {
  const users = await prisma.user.findMany({})
  console.log(`Found ${users.length} users`)

  for (const user of users) {
    if (!user.id) continue
    const imageUrl = await generateAvatar(user.id)
    await prisma.user.update({
      where: { id: user.id },
      data: { image: imageUrl },
    })
    console.log("✅ avatar", user.email)
  }
  console.log("All avatars updated.")
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
