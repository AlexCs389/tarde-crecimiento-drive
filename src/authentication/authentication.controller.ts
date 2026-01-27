import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthenticationService } from './authentication.service';
import { GoogleLoginDto, AuthResponseDto, UserDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('authentication')
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticación con Google',
    description:
      'Recibe un access_token de Google OAuth y retorna un JWT propio para autenticación en el API',
  })
  @ApiResponse({
    status: 200,
    description: 'Autenticación exitosa',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de Google inválido o expirado',
  })
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.loginWithGoogle(googleLoginDto.access_token);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener perfil del usuario autenticado',
    description:
      'Retorna la información del usuario actualmente autenticado usando el JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente',
    type: UserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  async getProfile(@CurrentUser() user: UserDto): Promise<UserDto> {
    return user;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refrescar token JWT',
    description:
      'Genera un nuevo JWT token usando el token actual (debe estar aún válido)',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refrescado exitosamente',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  async refreshToken(@CurrentUser() user: UserDto): Promise<AuthResponseDto> {
    const jwtToken = await this.authService.generateJwtToken(
      user.id,
      user.email,
    );

    return {
      access_token: jwtToken,
      token_type: 'Bearer',
      expires_in: 3600,
      user: user,
    };
  }
}
