import type { ContextGenerator } from 'vintasend/dist/services/notification-context-registry';

export class WelcomeProspectContextGenerator implements ContextGenerator {
  async generate(params: {
    companyName: string;
    productName?: string;
  }): Promise<{
    companyName: string;
    productName: string;
    contactEmail: string;
    currentYear: number;
  }> {
    return {
      companyName: params.companyName,
      productName: params.productName || 'VintaSend',
      contactEmail: process.env.CONTACT_EMAIL || 'hello@example.com',
      currentYear: new Date().getFullYear(),
    };
  }
}
