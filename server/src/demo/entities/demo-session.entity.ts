import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('demo_sessions')
export class DemoSession {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @Column({ type: 'varchar', unique: true })
  @Index()
  @ApiProperty({ description: 'Browser fingerprint for session tracking' })
  fingerprint: string;

  @Column({ type: 'varchar', nullable: true })
  @ApiPropertyOptional({ description: 'Email captured after first demo run' })
  email: string | null;

  @Column({ type: 'int', default: 0 })
  @ApiProperty({ description: 'Number of demo runs used' })
  runsUsed: number;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;
}
