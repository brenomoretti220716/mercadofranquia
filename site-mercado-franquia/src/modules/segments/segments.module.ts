import { Global, Module } from '@nestjs/common';
import { LlmService } from '../scraping/llm-models/groq.service';
import { SegmentAiClassifierService } from './segment-ai-classifier.service';

@Global()
@Module({
  providers: [LlmService, SegmentAiClassifierService],
  exports: [SegmentAiClassifierService],
})
export class SegmentsModule {}
