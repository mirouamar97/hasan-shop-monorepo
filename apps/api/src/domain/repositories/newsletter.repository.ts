export interface NewsletterSubscriberRecord {
  id: string;
  email: string;
  locale: string;
  source: string;
  isActive: boolean;
  subscribedAt: Date;
  updatedAt: Date;
}

export interface INewsletterRepository {
  subscribe(input: {
    email: string;
    locale: string;
    source: string;
  }): Promise<{ alreadySubscribed: boolean }>;
}
