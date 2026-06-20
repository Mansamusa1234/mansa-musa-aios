import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const memberships = await db.teamMember.findMany({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          owner: { select: { name: true, email: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
          invites: { where: { acceptedAt: null } },
        },
      },
    },
  });

  const ownedTeams = await db.team.findMany({
    where: { ownerId: session.user.id },
    include: {
      owner: { select: { name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      invites: { where: { acceptedAt: null } },
    },
  });

  const teams = [...ownedTeams, ...memberships.map((m) => m.team)]
    .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i);

  return NextResponse.json({ teams });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json() as { name?: string };
  if (!name?.trim()) return NextResponse.json({ error: "Team name required" }, { status: 400 });

  let slug = slugify(name);
  let attempt = 0;
  while (await db.team.findUnique({ where: { slug } })) {
    slug = slugify(name) + "-" + (++attempt);
  }

  const team = await db.team.create({
    data: {
      name: name.trim(),
      slug,
      ownerId: session.user.id,
      members: {
        create: { userId: session.user.id, role: "OWNER" },
      },
    },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });

  return NextResponse.json({ team });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { teamId } = await req.json() as { teamId?: string };
  if (!teamId) return NextResponse.json({ error: "Missing teamId" }, { status: 400 });

  const team = await db.team.findUnique({ where: { id: teamId } });
  if (!team || team.ownerId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.team.delete({ where: { id: teamId } });
  return NextResponse.json({ success: true });
}
