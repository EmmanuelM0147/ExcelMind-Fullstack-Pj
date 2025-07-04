import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { RecommendationRequestDto } from './dto/recommendation-request.dto';
import { SyllabusRequestDto } from './dto/syllabus-request.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/recommend
   * Generates course recommendations based on user preferences and academic history
   */
  @Post('recommend')
  @HttpCode(HttpStatus.OK)
  async getRecommendations(@Body() requestDto: RecommendationRequestDto) {
    try {
      return await this.aiService.generateRecommendations(requestDto);
    } catch (error) {
      throw new BadRequestException('Failed to generate recommendations');
    }
  }

  /**
   * POST /ai/syllabus
   * Generates a detailed syllabus for a course based on requirements and preferences
   */
  @Post('syllabus')
  @HttpCode(HttpStatus.OK)
  async generateSyllabus(@Body() requestDto: SyllabusRequestDto) {
    try {
      return await this.aiService.generateSyllabus(requestDto);
    } catch (error) {
      throw new BadRequestException('Failed to generate syllabus');
    }
  }
}