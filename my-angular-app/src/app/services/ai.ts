import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// The Llama 3 model returns a JSON object with a "response" string property
export interface AiResponse {
  response: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);

  ask(prompt: string): Observable<AiResponse> {
    return this.http.post<AiResponse>('/api/ai', { prompt });
  }
}