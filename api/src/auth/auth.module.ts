import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [JwtModule.registerAsync({
    imports: [ConfigModule], inject: [ConfigService],
    useFactory: (config: ConfigService) => {
      const secret = config.get<string>('JWT_SECRET');
      if (!secret || secret.length < 32) throw new Error('JWT_SECRET deve conter no mínimo 32 caracteres.');
      return { secret, signOptions: { expiresIn: 900 } };
    },
  })],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, AdminGuard],
  exports: [JwtModule, JwtAuthGuard, AdminGuard],
})
export class AuthModule {}
