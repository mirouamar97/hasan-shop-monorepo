import { Module } from '@nestjs/common';
import { NewsletterController } from './newsletter.controller';
import { NewsletterModule as NewsletterAppModule } from '../../../application/newsletter/newsletter.module';

@Module({
  imports: [NewsletterAppModule],
  controllers: [NewsletterController],
})
export class NewsletterModule {}
