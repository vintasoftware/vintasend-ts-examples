import { OneOffNotificationForm } from '../../../components/OneOffNotificationForm';

export default function OneOffNotificationDemo() {
  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">One-Off Notifications Demo</h1>
          <p className="text-lg text-muted-foreground">
            Send notifications directly to email addresses without requiring user accounts
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">What are One-Off Notifications?</h2>
            <div className="space-y-3 text-sm">
              <p>
                One-off notifications allow you to send emails to prospects, guests, or external
                contacts without requiring them to have an account in your system.
              </p>
              <p>
                <strong>Key Features:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Send directly to email addresses</li>
                <li>Include recipient's first and last name</li>
                <li>Use the same template system as regular notifications</li>
                <li>Support for context generation</li>
                <li>Track notification status</li>
                <li>Schedule for later delivery</li>
              </ul>
              <p>
                <strong>Use Cases:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Welcome emails for prospects</li>
                <li>Marketing campaign emails</li>
                <li>Event invitations</li>
                <li>Newsletter subscriptions</li>
                <li>Contact form responses</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Technical Details</h2>
            <div className="space-y-3 text-sm">
              <p>This demo uses the VintaSend notification service with:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Backend:</strong> Prisma with PostgreSQL (single table approach)
                </li>
                <li>
                  <strong>Adapter:</strong> Nodemailer for email delivery
                </li>
                <li>
                  <strong>Templates:</strong> Pug template engine
                </li>
                <li>
                  <strong>Queue:</strong> Temporal for reliable delivery
                </li>
              </ul>
              <p className="pt-2">
                The notification is stored in the same table as regular notifications, with{' '}
                <code className="bg-muted px-1 py-0.5 rounded">userId</code> set to null and{' '}
                <code className="bg-muted px-1 py-0.5 rounded">emailOrPhone</code>,{' '}
                <code className="bg-muted px-1 py-0.5 rounded">firstName</code>, and{' '}
                <code className="bg-muted px-1 py-0.5 rounded">lastName</code> populated instead.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <OneOffNotificationForm />
        </div>

        <div className="bg-muted p-6 rounded-lg space-y-3">
          <h3 className="text-xl font-semibold">API Endpoint</h3>
          <p className="text-sm">
            This form calls{' '}
            <code className="bg-background px-2 py-1 rounded">POST /api/notifications/one-off</code>
          </p>
          <pre className="bg-background p-4 rounded-lg overflow-x-auto text-xs">
            {`{
  "emailOrPhone": "prospect@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "VintaSend Demo",
  "productName": "VintaSend"
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
