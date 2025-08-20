import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ message: "All fields are required." }),
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
        role: "CUSTOMER",
      },
    });

    return new Response(JSON.stringify({ success: true }), { status: 201 });
  } catch (err: any) {
    // Handle Prisma unique error fallback
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
