-- CreateTable
CREATE TABLE "Users" (
    "user_id" TEXT NOT NULL,
    "plan" TEXT DEFAULT 'None',
    "plan_expires_at" INTEGER DEFAULT 0,
    "guild_id" TEXT,
    "channel_id" TEXT,
    "token" TEXT,
    "is_owner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Keys" (
    "user_id" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT DEFAULT 'Unknown',
    "expires_at" INTEGER DEFAULT 0,

    CONSTRAINT "Keys_pkey" PRIMARY KEY ("user_id")
);
