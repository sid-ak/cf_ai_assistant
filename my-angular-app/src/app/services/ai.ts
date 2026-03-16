import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatMessage {
  role: string;
  content: string;
}

export interface AiResponse {
  history: ChatMessage[];
  transcript?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);

  ask(prompt: string): Observable<AiResponse> {
    return this.http.post<AiResponse>('/api/ai', { prompt });
  }

  askAudio(audioBlob: Blob): Observable<AiResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-memo.webm');
    return this.http.post<AiResponse>('/api/ai', formData);
  }

  clearHistory(): Observable<any> {
    return this.http.delete('/api/ai/history');
  }

  getHistory(): Observable<AiResponse> {
    return this.http.get<AiResponse>('/api/ai/history');
  }
}
