
import { Body, Controller, Post } from "@nestjs/common";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post("login")
  async login(@Body() dados: LoginDto) {
    return this.authService.login(dados);
  }
}
