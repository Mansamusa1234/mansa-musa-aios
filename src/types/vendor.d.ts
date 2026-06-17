declare module "@mistralai/mistralai" {
  export interface ChatMessage { role: string; content: string }
  export interface DeltaMessage { role?: string | null; content?: string | null }
  export interface StreamChoice { delta: DeltaMessage; index: number; finish_reason?: string | null }
  export interface UsageInfo { promptTokens?: number; completionTokens?: number; totalTokens?: number }
  export interface CompletionChunk { id?: string; model?: string; choices: StreamChoice[]; usage?: UsageInfo }
  export interface CompletionEvent { data: CompletionChunk }

  export class Mistral {
    constructor(opts: { apiKey: string });
    chat: {
      stream(req: { model: string; messages: ChatMessage[] }): Promise<AsyncIterable<CompletionEvent>>;
      complete(req: { model: string; messages: ChatMessage[] }): Promise<{ choices: Array<{ message: { content: string } }> }>;
    };
  }
}
