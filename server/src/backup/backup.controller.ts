import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../auth/enums/role.enum';
import { BackupService } from './backup.service';

@ApiTags('Backup')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin/backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('list')
  @ApiOperation({ summary: 'List stored backups' })
  list() {
    return this.backupService.listBackups();
  }

  @Get('export')
  @ApiOperation({ summary: 'Create and download a new backup' })
  async export(@Res({ passthrough: true }) res: Response) {
    const { filename, buffer } = await this.backupService.createBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download a specific stored backup' })
  async download(@Param('filename') filename: string, @Res({ passthrough: true }) res: Response) {
    const buffer = await this.backupService.downloadBackup(filename);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }

  @Delete(':filename')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a specific backup' })
  async remove(@Param('filename') filename: string) {
    await this.backupService.deleteBackup(filename);
  }

  @Post('import')
  @ApiOperation({ summary: 'Restore from a backup JSON file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (
          file.mimetype === 'application/json' ||
          file.originalname.endsWith('.json')
        ) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException('Only .json backup files are accepted'),
            false,
          );
        }
      },
    }),
  )
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.backupService.importBackup(file.buffer);
  }
}
