import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { contactSchema } from "@/lib/validations/contact";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          message: result.error.issues[0]?.message ?? "Invalid data.",
        },
        { status: 400 }
      );
    }

    const inquiry = await prisma.contactInquiry.create({
      data: result.data,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! We'll get back to you soon.",
        inquiry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Contact API Error:", error);

    return NextResponse.json(
      {
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}