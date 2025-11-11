import { Controller, Post, Body } from '@nestjs/common';
import { QuoteLockService } from './quote-lock.service';

@Controller('quote-locks')
export class QuoteLockController {
  constructor(private readonly quoteLockService: QuoteLockService) {}

  @Post()
  async lockQuote(@Body() lockQuoteDto: any) {
    // Placeholder for quote locking
    return {
      message: 'Quote lock endpoint',
      note: 'To be implemented in Phase 2',
    };
  }
}
