// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

  generator client {
  provider   = "prisma-client-js"
  engineType = "library" 
  runtime    = "bun"
}

// command to run : as bun have some problem
// bunx --bun prisma generate --schema=./prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id         String  @id @default(uuid())
  name       String
  adminRooms Room[]  @relation("RoomAdmin")     // rooms this user admins
  rooms      Room[]  @relation("RoomMembers")   // rooms this user is member of (M:N)
  createdAt  DateTime @default(now())
}

model Room {
  id        Int     @id @default(autoincrement())
  slug      String  @unique
  password  String
  adminId   String
  admin     User    @relation("RoomAdmin", fields: [adminId], references: [id])
  users     User[]  @relation("RoomMembers")    // members (M:N)
  createdAt DateTime @default(now())
}





