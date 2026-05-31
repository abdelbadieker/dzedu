import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(
    @Body()
    dto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      language?: string;
    },
  ) {
    return this.authService.register(dto);
  }

  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(@Body() dto: { userId: string; otp: string }) {
    return this.authService.verifyOtp(dto.userId, dto.otp);
  }
}
