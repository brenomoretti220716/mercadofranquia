import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../scraping/llm-models/groq.service';
import {
  QUIZ_SEGMENTS,
  QUIZ_SUBSEGMENTS,
  QuizSegmentKey,
} from './quiz-segments.constants';

interface SegmentClassificationInput {
  rawSegment?: string | null;
  rawSubsegment?: string | null;
  description?: string | null;
}

interface SegmentClassificationResponse {
  segment: string | null;
  subsegment: string | null;
}

@Injectable()
export class SegmentAiClassifierService {
  private readonly logger = new Logger(SegmentAiClassifierService.name);

  constructor(private readonly llmService: LlmService) {}

  async classify(
    input: SegmentClassificationInput,
  ): Promise<SegmentClassificationResponse> {
    if (
      !input.rawSegment?.trim() &&
      !input.rawSubsegment?.trim() &&
      !input.description?.trim()
    ) {
      return { segment: null, subsegment: null };
    }

    try {
      const response = await this.llmService.ask(this.buildPrompt(input), {
        temperature: 0.1,
        maxTokens: 600,
      });

      const parsed = this.parseResponse(response);
      return this.validateResponse(parsed);
    } catch (error) {
      this.logger.error('Erro ao classificar segmento/subsegmento com IA', error);
      return { segment: null, subsegment: null };
    }
  }

  private buildPrompt(input: SegmentClassificationInput): string {
    const groupedSubsegments = QUIZ_SEGMENTS.map((segment) => {
      const subsegments = QUIZ_SUBSEGMENTS.filter((item) => item.segment === segment)
        .map((item) => item.value);

      return `${segment}: ${subsegments.join(', ')}`;
    }).join('\n');

    return `Você é responsável apenas por classificar segmento e subsegmento de uma franquia.

Regras obrigatórias:
- Responda APENAS com JSON válido.
- Você só pode alterar os campos "segment" e "subsegment".
- Use principalmente a description para decidir.
- O valor de "segment" deve ser um dos segmentos permitidos abaixo ou null.
- O valor de "subsegment" deve ser um dos subsegmentos permitidos para o segmento escolhido ou null.
- Se não houver confiança suficiente, retorne null no campo correspondente.
- Nunca invente segmentos ou subsegmentos fora da lista.

Segmentos permitidos:
${QUIZ_SEGMENTS.join(', ')}

Subsegmentos permitidos por segmento:
${groupedSubsegments}

Dados capturados no scraping:
- rawSegment: ${JSON.stringify(input.rawSegment ?? null)}
- rawSubsegment: ${JSON.stringify(input.rawSubsegment ?? null)}
- description: ${JSON.stringify(input.description ?? null)}

Exemplo de resposta:
{"segment":"Alimentação","subsegment":"Mercados e Distribuição"}

Agora classifique e retorne APENAS o JSON final.`;
  }

  private parseResponse(text: string): SegmentClassificationResponse {
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleaned;

    return JSON.parse(jsonString) as SegmentClassificationResponse;
  }

  private validateResponse(
    response: SegmentClassificationResponse,
  ): SegmentClassificationResponse {
    const segment = this.isAllowedSegment(response.segment)
      ? response.segment
      : null;

    if (!segment) {
      return { segment: null, subsegment: null };
    }

    const subsegment = this.isAllowedSubsegment(segment, response.subsegment)
      ? response.subsegment
      : null;

    return {
      segment,
      subsegment,
    };
  }

  private isAllowedSegment(value: string | null): value is QuizSegmentKey {
    if (!value) return false;

    return QUIZ_SEGMENTS.includes(value as QuizSegmentKey);
  }

  private isAllowedSubsegment(
    segment: QuizSegmentKey,
    value: string | null,
  ): value is string {
    if (!value) return false;

    return QUIZ_SUBSEGMENTS.some(
      (item) => item.segment === segment && item.value === value,
    );
  }
}
