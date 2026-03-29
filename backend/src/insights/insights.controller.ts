import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InsightsService } from './insights.service';

@ApiTags('insights')
@Controller('products/:productId/insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get AI-powered review insights for a product',
    description:
      'Generates a summary of all reviews including pros, cons, and sentiment analysis. ' +
      'Uses LLM when API key is configured, otherwise falls back to heuristic analysis. ' +
      'Results are cached for 5 minutes.',
  })
  getInsights(@Param('productId') productId: string) {
    return this.insightsService.getInsights(productId);
  }
}
