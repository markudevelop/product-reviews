import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ReviewNotificationPayload {
  productId: string;
  productName: string;
  reviewId: string;
  reviewerUsername: string;
  rating: number;
  title: string;
}

/**
 * Notification service for admin alerts when new reviews are submitted.
 *
 * Currently uses console logging as the transport. In production, swap
 * the `send` method for a real email provider (SendGrid, AWS SES, etc.)
 * or push to a message queue (RabbitMQ, Redis Pub/Sub) for async delivery.
 *
 * The service is injectable and decoupled from the review creation logic,
 * making it easy to extend with:
 *   - Webhook notifications (Slack, Discord)
 *   - In-app admin notification panel
 *   - SMS alerts via Twilio
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly adminEmail: string;
  private readonly enabled: boolean;

  // In-memory store for demo/testing purposes
  private readonly sentNotifications: ReviewNotificationPayload[] = [];

  constructor(private config: ConfigService) {
    this.adminEmail = this.config.get<string>('ADMIN_EMAIL', 'admin@example.com');
    this.enabled = this.config.get<string>('NOTIFICATIONS_ENABLED', 'true') === 'true';
  }

  async onNewReview(payload: ReviewNotificationPayload): Promise<void> {
    if (!this.enabled) return;

    this.sentNotifications.push(payload);

    // In production: replace with actual email/webhook delivery
    this.logger.log(
      `📧 ADMIN NOTIFICATION → New ${payload.rating}★ review on "${payload.productName}" ` +
        `by ${payload.reviewerUsername}: "${payload.title}" → ${this.adminEmail}`,
    );

    // Example of what the real implementation would look like:
    // await this.emailService.send({
    //   to: this.adminEmail,
    //   subject: `New Review: ${payload.productName} (${payload.rating}★)`,
    //   template: 'new-review',
    //   context: payload,
    // });
  }

  getRecentNotifications(): ReviewNotificationPayload[] {
    return [...this.sentNotifications].reverse().slice(0, 50);
  }
}
