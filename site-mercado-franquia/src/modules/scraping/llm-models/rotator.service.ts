interface ModelInfo {
  name: string;
  rpmLimit: number;
  requestsMade: number;
  lastReset: number;
}

export class ModelRotator {
  private readonly models: ModelInfo[] = [
    // Modelos gratuitos disponíveis (Free Plan)
    // Fonte: https://console.groq.com/docs/rate-limits
    {
      name: 'llama-3.1-8b-instant',
      rpmLimit: 30, // 30 RPM, 14.4K RPD, 6K TPM, 500K TPD
      requestsMade: 0,
      lastReset: Date.now(),
    },
    {
      name: 'llama-3.3-70b-versatile',
      rpmLimit: 30, // 30 RPM, 1K RPD, 12K TPM, 100K TPD
      requestsMade: 0,
      lastReset: Date.now(),
    },
    {
      name: 'qwen/qwen3-32b',
      rpmLimit: 60, // 60 RPM, 1K RPD, 6K TPM, 500K TPD (maior capacidade)
      requestsMade: 0,
      lastReset: Date.now(),
    },
    {
      name: 'allam-2-7b',
      rpmLimit: 30, // 30 RPM, 7K RPD, 6K TPM, 500K TPD
      requestsMade: 0,
      lastReset: Date.now(),
    },
  ];
  private totalRequests = 0;

  private resetCountersIfNeeded(): void {
    const now = Date.now();
    for (const model of this.models) {
      if (now - model.lastReset >= 60_000) {
        model.requestsMade = 0;
        model.lastReset = now;
      }
    }
  }

  getAvailableModel(): ModelInfo | null {
    this.resetCountersIfNeeded();

    const available = this.models.filter(
      (model) => model.requestsMade < model.rpmLimit,
    );

    if (!available.length) return null;

    available.sort((a, b) => a.requestsMade - b.requestsMade);

    return available[0];
  }

  recordRequest(modelName: string): void {
    this.totalRequests += 1;

    const model = this.models.find((m) => m.name === modelName);

    if (model) {
      model.requestsMade += 1;
    }
  }

  getStats() {
    const capacity = this.models.reduce((sum, m) => sum + m.rpmLimit, 0);

    return {
      totalRequests: this.totalRequests,
      capacity,

      efficiency: capacity
        ? `${((this.totalRequests / capacity) * 100).toFixed(1)}%`
        : '0%',

      models: this.models.reduce<Record<string, string>>((acc, m) => {
        acc[m.name] = `${m.requestsMade}/${m.rpmLimit}`;
        return acc;
      }, {}),
    };
  }
}
