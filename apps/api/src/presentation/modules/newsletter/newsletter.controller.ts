import { Body, Controller, Inject, Post } from '@nestjs/common';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { NewsletterService } from '../../../application/newsletter/newsletter.service';
import { SkipCsrf } from '../../decorators/skip-csrf.decorator';

class SubscribeNewsletterDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsEnum(['ar', 'fr'])
  locale?: 'ar' | 'fr';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  source?: string;
}

@Controller('newsletter')
@SkipCsrf()
export class NewsletterController {
  constructor(@Inject(NewsletterService) private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  async subscribe(@Body() body: SubscribeNewsletterDto) {
    const data = await this.newsletter.subscribe(body);
    return { success: true, data };
  }
}
