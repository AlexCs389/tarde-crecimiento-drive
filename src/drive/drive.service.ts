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

  async listFiles(userId: string, categoryKey?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.accessToken) {
      throw new UnauthorizedException(
        'No se encontró el token de acceso de Google para el usuario',
      );
    }

    const allFiles = await this.googleDriveService.listFiles(user.accessToken, {
      q: 'mimeType = "video/mp4"',
      fields:
        'files(id, name, mimeType, size, createdTime, webViewLink, webContentLink)',
    });

    const categories = this.extractCategories(allFiles);
    const filteredFiles =
      categoryKey && categoryKey !== 'all'
        ? this.filterFilesByCategory(allFiles, categoryKey)
        : allFiles;

    return {
      files: filteredFiles,
      categories,
    };
  }

  private extractCategories(files: drive_v3.Schema$File[]): Category[] {
    const foundCategories = new Set<string>();

    files.forEach((file) => {
      const fileName = file.name || '';
      const matchedCategory = this.categoryPatterns.find((pattern) =>
        this.matchesCategory(fileName, pattern.value),
      );

      if (matchedCategory) {
        foundCategories.add(matchedCategory.key);
      }
    });

    const categoriesArray: Category[] = [{ key: 'all', value: 'Todos' }];

    const sortedFoundCategories = Array.from(foundCategories)
      .map((key) => this.categoryPatterns.find((p) => p.key === key))
      .filter((cat): cat is Category => cat !== undefined)
      .sort((a, b) => a.value.localeCompare(b.value));

    categoriesArray.push(...sortedFoundCategories);
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
}
