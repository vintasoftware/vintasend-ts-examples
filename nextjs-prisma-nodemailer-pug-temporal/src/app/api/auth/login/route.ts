import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { NextResponse } from 'next/server';
import * as z from 'zod';
import type { WriteApiResponse } from '../../../../lib/api-clients/core';
import { type LoginValues, loginSchema } from '../../../../lib/schemas/auth';
import { generateToken, verifyPassword } from '../../../../lib/services/auth';
import { PrismaPg } from '@prisma/adapter-pg';

type LoginSuccess = { token: string };
type LoginValidationError = z.ZodFlattenedError<LoginValues>;
export type LoginApiResponse = WriteApiResponse<LoginSuccess, LoginValidationError>;
type LoginNextResponse = NextResponse<LoginApiResponse>;

export async function POST(req: Request): Promise<LoginNextResponse> {
  try {
    const body = await req.json();
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    const prisma = new PrismaClient({ adapter });

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(body.password, user.password);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email first' },
        { status: 403 },
      );
    }

    const token = generateToken({ userId: user.id });

    return NextResponse.json({ success: true, data: { token } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = error as z.ZodError<LoginValues>;
      return NextResponse.json(
        { success: false, error: 'Validation error', details: validationError.flatten() },
        { status: 400 },
      );
    }

    if (error instanceof PrismaClientKnownRequestError) {
      return NextResponse.json(
        { success: false, error: 'Database error occurred' },
        { status: 500 },
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
