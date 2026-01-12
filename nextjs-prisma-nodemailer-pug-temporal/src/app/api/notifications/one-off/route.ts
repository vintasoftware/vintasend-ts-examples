import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getNotificationService } from '../../../../lib/services/notifications';

const oneOffNotificationSchema = z.object({
  emailOrPhone: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().default('VintaSend Demo'),
  productName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = oneOffNotificationSchema.parse(body);

    const notificationService = getNotificationService();

    // Note: This uses the createOneOffNotification method which is part of Phase 5
    // If you see a TypeScript error here, ensure you're using vintasend v0.1.22+
    // or link to the local development version
    const notification = await notificationService.createOneOffNotification({
      emailOrPhone: validatedData.emailOrPhone,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      notificationType: 'EMAIL',
      title: 'Welcome to VintaSend',
      bodyTemplate: '/src/email-templates/marketing/welcome-prospect-body.html.pug',
      subjectTemplate: '/src/email-templates/marketing/welcome-prospect-subject.txt.pug',
      contextName: 'welcomeProspect',
      contextParameters: {
        companyName: validatedData.companyName,
        productName: validatedData.productName,
      },
      sendAfter: null,
      extraParams: null,
    });

    return NextResponse.json({
      success: true,
      message: 'One-off notification created and sent successfully',
      notificationId: notification.id,
    });
  } catch (error) {
    console.error('Error creating one-off notification:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create one-off notification',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
