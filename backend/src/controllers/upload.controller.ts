import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { UserRole } from '../models/user.entity';
import { UploadService } from '../services/upload.service';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload an image for Tenant or Event' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('image')
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  }))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
    @Query('entity') entity: 'tenant' | 'event'
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const validEntities = ['tenant', 'event'];
    const targetEntity = validEntities.includes(entity) ? entity : 'event';

    const url = await this.uploadService.uploadImage(file, targetEntity, req.user.tenantId);

    return { url };
  }
}
