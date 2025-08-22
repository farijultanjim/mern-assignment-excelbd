import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return new Response(
        JSON.stringify({ message: "All fields are required." }),
        { status: 400 }
      );
    }

    if (role !== "CUSTOMER" && role !== "AGENT") {
      return new Response(
        JSON.stringify({ message: "Invalid role selected." }),
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return new Response(
        JSON.stringify({ message: "Email already registered." }),
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err: any) {
    if (err?.code === "P2002") {
      return new Response(
        JSON.stringify({ message: "Email already registered." }),
        { status: 409 }
      );
    }
    return new Response(JSON.stringify({ message: "Something went wrong." }), {
      status: 500,
    });
  }
}
