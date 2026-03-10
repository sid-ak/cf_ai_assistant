import { Component, OnInit, inject, signal } from '@angular/core';
import { AiService } from './services/ai'; // Adjust path if necessary

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss' 
})
export class App implements OnInit {
  private aiService = inject(AiService);

  // 1. Initialize your state as Signals
  testPrompt = signal('Tell me a very short joke about a software engineer.');
  aiResponse = signal('');
  status = signal('Sending request to Cloudflare Worker...');

  ngOnInit() {
    // 2. Read the prompt signal using () when sending the request
    this.aiService.ask(this.testPrompt()).subscribe({
      next: (res) => {
        // 3. Update the signals using .set()
        this.aiResponse.set(res.response); 
        this.status.set('Success');
      },
      error: (err) => {
        console.error('API Error:', err);
        this.aiResponse.set('Request failed. Check the browser console and terminal for details.');
        this.status.set('Failed');
      }
    });
  }
}