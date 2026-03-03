import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import type { ContextGenerator } from 'vintasend';

export class ForgotPasswordContextGenerator implements ContextGenerator {
  async generate(params: { token: string }): Promise<{
    firstName: string | null;
    resetPasswordLink: string;
  }> {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    const prisma = new PrismaClient({ adapter });

    const APP_DOMAIN = process.env.APP_DOMAIN;

    const token = await prisma.token.findUnique({
      where: { token: params.token },
      select: { user: true },
    });

    if (!token || !token.user) {
      throw new Error('Token not found');
    }

    return {
      firstName: token.user.firstName,
      resetPasswordLink: `${APP_DOMAIN}/auth/reset-password/${params.token}/`,
    };
  }
}
