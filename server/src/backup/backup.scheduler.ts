import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BackupService } from './backup.service';

@Injectable()
export class BackupScheduler {
  private readonly logger = new Logger(BackupScheduler.name);

  constructor(private readonly backupService: BackupService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleNightlyBackup() {
    this.logger.log('Nightly backup starting...');
    try {
      const { filename } = await this.backupService.createBackup();
      this.logger.log(`Nightly backup complete: ${filename}`);

      await this.backupService.syncToGoogleDrive();
      await this.backupService.applyRetention();
    } catch (err: any) {
      this.logger.error(`Nightly backup failed: ${err.message}`);
    }
  }
}
