import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { saveUpload } from "@/lib/uploads";

export async function POST(req: NextRequest) {
  const { error, status, session } = await requireSession(["STAFF"]);
  if (error || !session) {
    return NextResponse.json({ error }, { status });
  }

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose a profile photo to upload" },
      { status: 400 }
    );
  }

  try {
    const saved = await saveUpload(file, `avatars/${session.user.id}`, {
      imagesOnly: true,
    });

    const profile = await prisma.staffProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        avatarPath: saved.filePath,
      },
      update: {
        avatarPath: saved.filePath,
      },
    });

    return NextResponse.json({
      avatarPath: profile.avatarPath,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 }
    );
  }
}
