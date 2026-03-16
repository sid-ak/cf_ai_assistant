import { Component, inject, signal } from '@angular/core';
import { AiService } from './services/ai';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [FormsModule]
})
export class App {
  private aiService = inject(AiService);

  textPrompt = signal('');
  aiResponse = signal('');
  transcript = signal('');
  status = signal('Ready');
  
  isRecording = signal(false);
  isProcessing = signal(false);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  submitText() {
    const promptText = this.textPrompt().trim();
    if (!promptText) return;

    this.isProcessing.set(true);
    this.status.set("Processing...");
    this.transcript.set('');
    this.aiResponse.set('');
    this.textPrompt.set('');

    this.aiService.ask(promptText).subscribe({
      next: (res) => this.handleSuccess(res.response, promptText),
      error: (err) => this.handleError(err)
    });
  }
  
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
      next: (res) => this.handleSuccess(res.response, res.transcript || '', true),
      error: (err) => this.handleError(err)
    });
  }

  private handleSuccess(response: string, transcriptText: string, isVoice = false) {
    this.aiResponse.set(response);
    if (isVoice) {
      this.transcript.set(transcriptText);
    } else {
      // For text requests, we can just echo what they typed as the "transcript"
      this.transcript.set(transcriptText);
    }
    this.status.set('Success!');
    this.isProcessing.set(false);
  }

  private handleError(err: any) {
    console.error('API Error:', err);
    this.aiResponse.set('Request failed. Check console for details.');
    this.status.set('Failed');
    this.isProcessing.set(false);
  }
}
