import type { ToolConfig } from '../config/tools.config';

export async function processText(
  inputText: string,
  tool: ToolConfig
): Promise<{ outputText: string; detectorProbability: number | null }> {
  // Simulates AI text processing API call
  return new Promise((resolve) => {
    setTimeout(() => {
      if (tool.slug === 'ai-detector') {
        resolve({
          outputText: '',
          detectorProbability: 0.78, // stub value
        });
      } else {
        resolve({
          outputText: inputText, // identity stub
          detectorProbability: null,
        });
      }
    }, 1200);
  });
}
