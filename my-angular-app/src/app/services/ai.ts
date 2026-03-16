import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // Helper to safely get or create a session ID
  private getHeaders(): { headers: HttpHeaders } {
    let sessionId = 'ssr-session'; // Default for Server-Side Rendering

    // Check if we are running in the browser (not the server)
    if (typeof window !== 'undefined' && window.localStorage) {
      sessionId = localStorage.getItem('ai_session_id') || '';

      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('ai_session_id', sessionId);
      }
    }

    return {
      headers: new HttpHeaders({
        'x-session-id': sessionId
      })
    };
  }

  ask(prompt: string): Observable<AiResponse> {
    return this.http.post<AiResponse>('/api/ai', { prompt }, this.getHeaders());
  }

  askAudio(audioBlob: Blob): Observable<AiResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice-memo.webm');
    return this.http.post<AiResponse>('/api/ai', formData, this.getHeaders());
  }

  clearHistory(): Observable<any> {
    return this.http.delete('/api/ai/history', this.getHeaders());
  }

  getHistory(): Observable<AiResponse> {
    return this.http.get<AiResponse>('/api/ai/history', this.getHeaders());
  }
}
