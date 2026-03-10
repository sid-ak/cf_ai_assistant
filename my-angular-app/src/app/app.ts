import { Component, inject, signal } from '@angular/core';
import { AiService } from './services/ai'; // Adjust path if necessary

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private aiService = inject(AiService);

  aiResponse = signal('');
  transcript = signal('');
  status = signal('Ready');
  isRecording = signal(false);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  async toggleRecording() {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.processAudio(audioBlob);

        stream.getTracks().forEach(track => track.stop());
      };

      // Start the recording engine
      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.status.set('Recording...');
      this.transcript.set('');
      this.aiResponse.set('');

    } catch (err) {
      console.error('Microphone access denied or failed:', err);
      this.status.set('Microphone access failed.');
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
      this.status.set('Processing audio via Whisper & Llama...');
    }
  }

  private processAudio(audioBlob: Blob) {
    this.aiService.askAudio(audioBlob).subscribe({
      next: (res) => {
        this.transcript.set(res.transcript || '');
        this.aiResponse.set(res.response);
        this.status.set('Success');
      },
      error: (err) => {
        console.error('API Error:', err);
        this.aiResponse.set('Request failed.');
        this.status.set('Failed');
      }
    });
  }
}
