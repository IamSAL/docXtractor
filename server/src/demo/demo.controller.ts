import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorators';
import { DemoService } from './demo.service';
import { DemoRunDto, DemoCaptureEmailDto, DemoClassifyDto } from './dto/demo.dto';

const ALLOWED_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

@ApiTags('Demo')
@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Public()
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file for demo extraction' })
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: PDF, PNG, JPEG, DOCX',
      );
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('File too large. Max 20MB');
    }

    const result = await this.demoService.uploadDemoFile(file);

    // Auto-classify
    const classification = await this.demoService.classifyDocument(
      file.originalname,
    );
    const suggestedExtractor =
      await this.demoService.findPublicExtractorByType(
        classification.suggestedType,
      );

    return {
      ...result,
      originalName: file.originalname,
      classification,
      suggestedExtractorId: suggestedExtractor?.id || null,
    };
  }

  @Public()
  @Post('run')
  @ApiOperation({ summary: 'Create a demo extraction run' })
  async createRun(@Body() body: DemoRunDto) {
    const { run, demoToken } = await this.demoService.createDemoRun(
      body.fingerprint,
      body.extractorId,
      body.sources,
    );

    return {
      runId: run.id,
      status: run.status,
      demoToken,
    };
  }

  @Public()
  @Post('classify')
  @ApiOperation({ summary: 'Auto-classify document type' })
  async classify(@Body() body: DemoClassifyDto) {
    const classification = await this.demoService.classifyDocument(
      body.filename,
    );
    const suggestedExtractor =
      await this.demoService.findPublicExtractorByType(
        classification.suggestedType,
      );
    const publicExtractors = await this.demoService.getPublicExtractors();

    return {
      ...classification,
      suggestedExtractorId: suggestedExtractor?.id || null,
      availableExtractors: publicExtractors,
    };
  }

  @Public()
  @Post('capture-email')
  @ApiOperation({ summary: 'Attach email to demo session' })
  async captureEmail(@Body() body: DemoCaptureEmailDto) {
    const session = await this.demoService.captureEmail(
      body.fingerprint,
      body.email,
    );
    return { runsUsed: session.runsUsed, email: session.email };
  }

  @Public()
  @Get('result/:runId')
  @ApiOperation({ summary: 'Get demo run result (public, isDemo only)' })
  async getResult(@Param('runId') runId: string) {
    const run = await this.demoService.getDemoResult(runId);
    return {
      id: run.id,
      status: run.status,
      results: run.results,
      sources: run.sources,
      confidence: run.confidence,
      metrics: run.metrics,
      createdAt: run.createdAt,
    };
  }

  @Public()
  @Get('session')
  @ApiOperation({ summary: 'Get demo session info by fingerprint' })
  async getSession(@Query('fingerprint') fingerprint: string) {
    if (!fingerprint) {
      throw new BadRequestException('fingerprint query param is required');
    }

    const session = await this.demoService.getSession(fingerprint);
    if (!session) {
      return { runsUsed: 0, email: null };
    }
    return { runsUsed: session.runsUsed, email: session.email };
  }
}
