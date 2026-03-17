import { Injectable, UnauthorizedException } from '@nestjs/common';
import { drive_v3 } from 'googleapis';

import { GoogleDriveService } from '../common/services/google-drive.service';
import { PrismaService } from '../prisma/prisma.service';

interface Category {
  key: string;
  value: string;
}

@Injectable()
export class DriveService {
  private readonly categoryPatterns = [
    {
      key: 'growth_afternoon_talk',
      value: 'Plática de Tarde de crecimiento',
    },
    { key: 'tech_monthly_status', value: 'Tech Monthly Status' },
    { key: 'town_hall', value: 'Town Hall' },
    { key: 'product_results_roadmap', value: 'Product Results & Roadmap' },
  ];

  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly prisma: PrismaService,
  ) {}

  async listFiles(
    userId: string,
    categoryKey?: string,
    date?: string,
    search?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.accessToken) {
      throw new UnauthorizedException(
        'No se encontró el token de acceso de Google para el usuario',
      );
    }

    const categories = this.getAllCategories();

    const needsAllFiles =
      !categoryKey || categoryKey === 'all' || categoryKey === 'others';
    const query = this.buildGoogleDriveQuery(
      needsAllFiles ? undefined : categoryKey,
      date,
      search,
    );

    const filteredFiles = await this.googleDriveService.listFiles(
      user.accessToken,
      {
        q: query,
        fields:
          'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
      },
    );

    let finalFiles = filteredFiles;

    if (categoryKey === 'others') {
      finalFiles = this.filterFilesByCategory(filteredFiles, categoryKey);
    }

    return {
      files: finalFiles,
      categories,
    };
  }

  private buildGoogleDriveQuery(
    categoryKey?: string,
    date?: string,
    search?: string,
  ): string {
    const conditions: string[] = ['mimeType = "video/mp4"'];

    if (date) {
      const targetDate = new Date(date + 'T00:00:00.000Z');
      const nextDay = new Date(date + 'T00:00:00.000Z');
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);

      const startISO = targetDate.toISOString();
      const endISO = nextDay.toISOString();

      conditions.push(`createdTime >= '${startISO}'`);
      conditions.push(`createdTime < '${endISO}'`);
    }

    if (categoryKey && categoryKey !== 'all' && categoryKey !== 'others') {
      const category = this.categoryPatterns.find((p) => p.key === categoryKey);
      if (category) {
        if (category.key === 'town_hall') {
          conditions.push(`name contains 'town hall'`);
        } else {
          conditions.push(`name contains '${category.value}'`);
        }
      }
    }

    if (search) {
      conditions.push(`name contains '${search}'`);
    }

    return conditions.join(' and ');
  }

  private getAllCategories(): Category[] {
    const categoriesArray: Category[] = [{ key: 'all', value: 'Todos' }];

    const sortedCategories = [...this.categoryPatterns].sort((a, b) =>
      a.value.localeCompare(b.value),
    );

    categoriesArray.push(...sortedCategories);
    categoriesArray.push({ key: 'others', value: 'Otros' });

    return categoriesArray;
  }

  private matchesCategory(fileName: string, categoryValue: string): boolean {
    if (categoryValue === 'Town Hall') {
      return fileName.toLowerCase().includes('town hall');
    }
    return fileName.includes(categoryValue);
  }

  private filterFilesByCategory(
    files: drive_v3.Schema$File[],
    categoryKey: string,
  ): drive_v3.Schema$File[] {
    if (categoryKey === 'others') {
      return files.filter((file) => {
        const fileName = file.name || '';
        return !this.categoryPatterns.some((pattern) =>
          this.matchesCategory(fileName, pattern.value),
        );
      });
    }

    const category = this.categoryPatterns.find((p) => p.key === categoryKey);
    if (!category) {
      return files;
    }

    return files.filter((file) => {
      const fileName = file.name || '';
      return this.matchesCategory(fileName, category.value);
    });
  }

  private filterFilesByDate(
    files: drive_v3.Schema$File[],
    date: string,
  ): drive_v3.Schema$File[] {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    return files.filter((file) => {
      if (!file.createdTime) {
        return false;
      }

      const fileDate = new Date(file.createdTime);
      return fileDate >= targetDate && fileDate < nextDay;
    });
  }
}
