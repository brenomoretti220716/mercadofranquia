import { Test, TestingModule } from '@nestjs/testing';
import { LlmService } from '../scraping/llm-models/groq.service';
import { SegmentAiClassifierService } from './segment-ai-classifier.service';

describe('SegmentAiClassifierService', () => {
  let service: SegmentAiClassifierService;
  let askMock: jest.Mock;

  beforeEach(async () => {
    askMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SegmentAiClassifierService,
        {
          provide: LlmService,
          useValue: {
            ask: askMock,
          },
        },
      ],
    }).compile();

    service = module.get<SegmentAiClassifierService>(SegmentAiClassifierService);
  });

  it('should keep a valid canonical segment and subsegment', async () => {
    askMock.mockResolvedValueOnce(
      '{"segment":"Alimentação","subsegment":"Mercados e Distribuição"}',
    );

    const result = await service.classify({
      rawSegment: 'Alimentação',
      rawSubsegment: 'Comércio',
      description: 'Supermercado de bairro com foco em conveniência.',
    });

    expect(result).toEqual({
      segment: 'Alimentação',
      subsegment: 'Mercados e Distribuição',
    });
  });

  it('should null both fields when the model returns an invalid segment', async () => {
    askMock.mockResolvedValueOnce(
      '{"segment":"Comércio","subsegment":"Mercados e Distribuição"}',
    );

    const result = await service.classify({
      rawSegment: 'Alimentação',
      rawSubsegment: 'Comércio',
      description: 'Supermercado de bairro.',
    });

    expect(result).toEqual({
      segment: null,
      subsegment: null,
    });
  });

  it('should null only the subsegment when it does not belong to the chosen segment', async () => {
    askMock.mockResolvedValueOnce(
      '{"segment":"Alimentação","subsegment":"Odontologia"}',
    );

    const result = await service.classify({
      rawSegment: 'Alimentação',
      rawSubsegment: 'Clínica',
      description: 'Restaurante self-service.',
    });

    expect(result).toEqual({
      segment: 'Alimentação',
      subsegment: null,
    });
  });

  it('should parse json wrapped in markdown fences', async () => {
    askMock.mockResolvedValueOnce(
      '```json\n{"segment":"Educação","subsegment":"Idiomas"}\n```',
    );

    const result = await service.classify({
      rawSegment: 'Educação',
      rawSubsegment: 'Cursos',
      description: 'Escola de idiomas para adultos e crianças.',
    });

    expect(result).toEqual({
      segment: 'Educação',
      subsegment: 'Idiomas',
    });
  });

  it('should return nulls when the model response is invalid', async () => {
    askMock.mockResolvedValueOnce('resposta inválida');

    const result = await service.classify({
      rawSegment: 'Alimentação',
      rawSubsegment: 'Comércio',
      description: 'Supermercado de bairro.',
    });

    expect(result).toEqual({
      segment: null,
      subsegment: null,
    });
  });
});
