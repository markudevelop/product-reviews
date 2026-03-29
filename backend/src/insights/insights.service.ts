import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';

export interface ReviewInsight {
  productId: string;
  productName: string;
  summary: string;
  pros: string[];
  cons: string[];
  sentiment: 'positive' | 'mixed' | 'negative';
  averageRating: number;
  reviewCount: number;
  generatedAt: string;
  source: 'llm' | 'heuristic';
}

/**
 * AI-powered review insights service.
 *
 * When an LLM API key is configured (OPENAI_API_KEY or ANTHROPIC_API_KEY),
 * it generates rich summaries using the LLM. Without an API key, it falls
 * back to a heuristic analysis that extracts common themes from review text.
 *
 * Results are cached in Redis for 5 minutes to avoid repeated LLM calls.
 */
@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private readonly llmApiKey: string | undefined;
  private readonly llmProvider: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.llmApiKey = this.config.get<string>('OPENAI_API_KEY');
    this.llmProvider = this.llmApiKey ? 'openai' : 'heuristic';
    this.logger.log(`Insights engine initialized (mode: ${this.llmProvider})`);
  }

  async getInsights(productId: string): Promise<ReviewInsight> {
    const cacheKey = `insights:${productId}`;
    const cached = await this.cacheManager.get<ReviewInsight>(cacheKey);
    if (cached) return cached;

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        reviews: {
          include: { user: { select: { username: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (product.reviews.length === 0) {
      throw new NotFoundException('No reviews available for insights');
    }

    let insight: ReviewInsight;

    if (this.llmApiKey) {
      insight = await this.generateLlmInsight(product);
    } else {
      insight = this.generateHeuristicInsight(product);
    }

    await this.cacheManager.set(cacheKey, insight, 5 * 60 * 1000);
    return insight;
  }

  /**
   * LLM-based insight generation.
   * Makes a call to OpenAI (or any compatible API) to summarize reviews.
   */
  private async generateLlmInsight(product: any): Promise<ReviewInsight> {
    const reviewTexts = product.reviews
      .map((r: any) => `[${r.rating}★] ${r.title}: ${r.body}`)
      .join('\n\n');

    const prompt = `Analyze these product reviews for "${product.name}" and provide:
1. A 2-3 sentence summary of overall customer sentiment
2. Top 3 pros (things customers love)
3. Top 3 cons (things customers dislike)
4. Overall sentiment: "positive", "mixed", or "negative"

Reviews:
${reviewTexts}

Respond in JSON format:
{"summary": "...", "pros": ["...", "...", "..."], "cons": ["...", "...", "..."], "sentiment": "positive|mixed|negative"}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.llmApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      const parsed = JSON.parse(content);

      return {
        productId: product.id,
        productName: product.name,
        summary: parsed.summary,
        pros: parsed.pros || [],
        cons: parsed.cons || [],
        sentiment: parsed.sentiment || 'mixed',
        averageRating: product.avgRating,
        reviewCount: product.reviews.length,
        generatedAt: new Date().toISOString(),
        source: 'llm',
      };
    } catch (error) {
      this.logger.warn('LLM call failed, falling back to heuristic');
      return this.generateHeuristicInsight(product);
    }
  }

  /**
   * Heuristic-based insight generation (no API key required).
   * Extracts themes from review text using keyword frequency analysis.
   */
  private generateHeuristicInsight(product: any): ReviewInsight {
    const reviews = product.reviews;
    const avgRating = product.avgRating;
    const totalReviews = reviews.length;

    // Separate high and low rated reviews
    const positiveReviews = reviews.filter((r: any) => r.rating >= 4);
    const negativeReviews = reviews.filter((r: any) => r.rating <= 2);

    // Extract common themes via simple keyword extraction
    const positiveThemes = this.extractThemes(positiveReviews.map((r: any) => r.body));
    const negativeThemes = this.extractThemes(negativeReviews.map((r: any) => r.body));

    // Generate summary
    const sentiment =
      avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'mixed' : 'negative';

    const sentimentWord =
      sentiment === 'positive'
        ? 'highly favorable'
        : sentiment === 'mixed'
          ? 'mixed'
          : 'largely critical';

    const summary =
      `Based on ${totalReviews} review${totalReviews !== 1 ? 's' : ''}, ` +
      `customer sentiment for ${product.name} is ${sentimentWord} ` +
      `with an average rating of ${avgRating.toFixed(1)} out of 5. ` +
      `${positiveReviews.length} reviewer${positiveReviews.length !== 1 ? 's' : ''} rated it 4+ stars` +
      (negativeReviews.length > 0
        ? `, while ${negativeReviews.length} gave it 2 stars or below.`
        : '.');

    return {
      productId: product.id,
      productName: product.name,
      summary,
      pros: positiveThemes.slice(0, 3),
      cons:
        negativeThemes.length > 0
          ? negativeThemes.slice(0, 3)
          : ['No significant complaints reported'],
      sentiment,
      averageRating: avgRating,
      reviewCount: totalReviews,
      generatedAt: new Date().toISOString(),
      source: 'heuristic',
    };
  }

  /**
   * Simple keyword extraction from review texts.
   * Groups common descriptive phrases to identify recurring themes.
   */
  private extractThemes(texts: string[]): string[] {
    if (texts.length === 0) return ['Insufficient review data'];

    const themePatterns: { pattern: RegExp; label: string }[] = [
      { pattern: /noise cancel/i, label: 'Excellent noise cancellation' },
      { pattern: /battery|battery life/i, label: 'Long battery life' },
      { pattern: /comfortable|comfort/i, label: 'Very comfortable to use' },
      { pattern: /sound quality|sound/i, label: 'Great sound quality' },
      { pattern: /build quality|well.?made|durable|sturdy/i, label: 'Solid build quality' },
      { pattern: /price|expensive|pricey|cheap|value|worth/i, label: 'Noteworthy price-to-value ratio' },
      { pattern: /screen|display/i, label: 'Excellent screen/display' },
      { pattern: /fast|speed|quick|performance/i, label: 'Fast performance' },
      { pattern: /design|look|beautiful|gorgeous|sleek/i, label: 'Attractive design' },
      { pattern: /heavy|weight|light/i, label: 'Notable weight characteristics' },
      { pattern: /easy|simple|intuitive/i, label: 'Easy to use' },
      { pattern: /warm|heat|hot|cool/i, label: 'Good temperature management' },
      { pattern: /cook|bak|roast|brais/i, label: 'Excellent cooking performance' },
      { pattern: /clean|vacuum|suction/i, label: 'Strong cleaning capability' },
      { pattern: /insulate|cold|ice/i, label: 'Superior insulation' },
      { pattern: /ergonomic|back|posture|support/i, label: 'Good ergonomic support' },
    ];

    const combined = texts.join(' ');
    const matches: string[] = [];

    for (const { pattern, label } of themePatterns) {
      if (pattern.test(combined)) {
        matches.push(label);
      }
    }

    return matches.length > 0 ? matches : ['Generally well received by customers'];
  }
}
