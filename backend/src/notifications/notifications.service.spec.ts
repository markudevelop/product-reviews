import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, defaultValue: string) => defaultValue,
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should store notification on new review', async () => {
    await service.onNewReview({
      productId: 'p1',
      productName: 'Test Product',
      reviewId: 'r1',
      reviewerUsername: 'alice',
      rating: 5,
      title: 'Great!',
    });

    const notifications = service.getRecentNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].productName).toBe('Test Product');
  });
});
