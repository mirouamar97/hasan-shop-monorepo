import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../../../application/auth/auth.service';
import { SecurityModule } from '../../../infrastructure/security/security.module';
import { AuditModule } from '../../../application/audit/audit.module';
import { AuthGuard } from '../../guards/auth.guard';

@Module({
  imports: [SecurityModule, AuditModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
