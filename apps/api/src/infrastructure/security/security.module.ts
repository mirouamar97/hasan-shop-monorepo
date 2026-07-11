import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CsrfService } from './csrf.service';
import { CsrfGuard } from './csrf.guard';
import { LoginProtectionService } from './login-protection.service';
import { FileValidationService } from './file-validation.service';
import { WebhookSecurityService } from './webhook-security.service';
import { ClamAvVirusScanner, NoOpVirusScanner } from './clamav-virus-scanner';
import { VIRUS_SCANNER } from './virus-scanner.token';

@Module({
  imports: [ConfigModule],
  providers: [
    CsrfService,
    CsrfGuard,
    LoginProtectionService,
    FileValidationService,
    WebhookSecurityService,
    ClamAvVirusScanner,
    NoOpVirusScanner,
    {
      provide: VIRUS_SCANNER,
      useFactory: (config: ConfigService, clam: ClamAvVirusScanner, noop: NoOpVirusScanner) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        const hasClam = Boolean(config.get<string>('CLAMAV_HOST'));
        if (isProd || hasClam) {
          return clam;
        }
        return noop;
      },
      inject: [ConfigService, ClamAvVirusScanner, NoOpVirusScanner],
    },
  ],
  exports: [
    CsrfService,
    CsrfGuard,
    LoginProtectionService,
    FileValidationService,
    WebhookSecurityService,
    VIRUS_SCANNER,
  ],
})
export class SecurityModule {}
