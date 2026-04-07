import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ModelRotator } from './rotator.service';

interface ChatCompletionResponse {
  choices: { message?: { content?: string } }[];
}

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly http: AxiosInstance;
  private readonly rotator = new ModelRotator();

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Environment variable GROQ_API_KEY is not set.');
    }

    this.http = axios.create({
      baseURL: 'https://api.groq.com/openai/v1',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 30_000,
    });
  }

  async ask(
    question: string,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<string> {
    const modelInfo = this.rotator.getAvailableModel();

    if (!modelInfo) {
      throw new Error(
        'All Groq models are currently rate-limited. Please retry shortly.',
      );
    }

    const temperature = options?.temperature ?? 0.1;
    const max_tokens = options?.maxTokens ?? 1024;

    try {
      const response = await this.http.post<ChatCompletionResponse>(
        '/chat/completions',
        {
          model: modelInfo.name,
          messages: [{ role: 'user', content: question }],
          temperature,
          max_tokens,
        },
      );

      this.rotator.recordRequest(modelInfo.name);

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('Groq response missing message content.');
      }

      return content.trim();
    } catch (err: unknown) {
      this.logger.error(`Groq request failed: ${JSON.stringify(err)}`);
      throw err;
    }
  }

  getStats() {
    return this.rotator.getStats();
  }
}
