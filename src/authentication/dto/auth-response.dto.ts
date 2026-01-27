import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@ejemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan Pérez',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'URL de la foto de perfil',
    example: 'https://lh3.googleusercontent.com/...',
    required: false,
  })
  picture?: string;

  @ApiProperty({
    description: 'ID de Google del usuario',
    example: '123456789012345678901',
  })
  googleId: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticación',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Tipo de token',
    example: 'Bearer',
  })
  token_type: string;

  @ApiProperty({
    description: 'Tiempo de expiración en segundos',
    example: 3600,
  })
  expires_in: number;

  @ApiProperty({
    description: 'Datos del usuario autenticado',
    type: UserDto,
  })
  user: UserDto;
}

