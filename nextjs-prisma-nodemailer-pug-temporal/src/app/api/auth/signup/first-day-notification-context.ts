import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { ContextGenerator } from 'vintasend';

export class FirstDayotificationContextGenerator implements ContextGenerator {
  async generate(params: { userId: number }): Promise<{ firstName: string | null }> {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });
    const prisma = new PrismaClient({ adapter });

    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      firstName: user.firstName,
    };
  }
}
