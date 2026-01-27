import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { AuthResponseDto, UserDto } from './dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verifica el access_token de Google y obtiene la información del usuario
   */
  async verifyGoogleToken(accessToken: string): Promise<{
    email: string;
    name: string;
    picture: string;
    googleId: string;
  }> {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: 'v2',
      });

      const { data } = await oauth2.userinfo.get();

      if (!data.email || !data.id) {
        throw new UnauthorizedException(
          'No se pudo obtener la información del usuario de Google',
        );
      }

      return {
        email: data.email,
        name: data.name || '',
        picture: data.picture || '',
        googleId: data.id,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        'Token de Google inválido o expirado: ' + error.message,
      );
    }
  }

  /**
   * Autentica o registra un usuario usando el access_token de Google
   */
  async loginWithGoogle(accessToken: string): Promise<AuthResponseDto> {
    // Verificar el token de Google
    const googleUser = await this.verifyGoogleToken(accessToken);

    // Buscar o crear el usuario en la base de datos
    let user = await this.prisma.user.findUnique({
      where: { googleId: googleUser.googleId },
    });

    if (!user) {
      // Crear nuevo usuario
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          googleId: googleUser.googleId,
          accessToken: accessToken,
        },
      });
    } else {
      // Actualizar el access_token
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: accessToken,
          name: googleUser.name,
          picture: googleUser.picture,
        },
      });
    }

    // Generar JWT propio
    const jwtToken = await this.generateJwtToken(user.id, user.email);

    const userDto: UserDto = {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      picture: user.picture || undefined,
      googleId: user.googleId,
    };

    return {
      access_token: jwtToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hora
      user: userDto,
    };
  }

  /**
   * Genera un JWT token propio para el usuario
   */
  async generateJwtToken(userId: string, email: string): Promise<string> {
    const payload = {
      sub: userId,
      email: email,
    };

    return this.jwtService.sign(payload);
  }

  /**
   * Valida un JWT token y retorna los datos del usuario
   */
  async validateUser(userId: string): Promise<UserDto | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        picture: user.picture || undefined,
        googleId: user.googleId,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al validar el usuario: ' + error.message,
      );
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.validateUser(userId);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return user;
  }
}
