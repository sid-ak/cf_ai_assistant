import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AiService, ChatMessage } from './services/ai';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
  imports: [FormsModule]
})
export class App implements OnInit, AfterViewChecked {

  private aiService = inject(AiService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  textPrompt = signal('');
  aiResponse = signal('');
  transcript = signal('');
  status = signal('');

  isRecording = signal(false);
  isProcessing = signal(false);

  chatHistory = signal<ChatMessage[]>([]);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  ngOnInit(): void {
    this.status.set('Loading history...');
    this.isProcessing.set(true);

    this.aiService.getHistory().subscribe({
      next: (res) => {
        this.chatHistory.set(res.history || []);
        this.status.set('Ready');
        this.isProcessing.set(false);
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Failed to load history:', err);
        this.status.set('Ready (Failed to load history)');
        this.isProcessing.set(false);
      }
    });
  }

  // Auto-scroll hook
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  submitText() {
    const promptText = this.textPrompt().trim();
    if (!promptText) return;

    this.isProcessing.set(true);
    this.status.set("Processing...");
    this.transcript.set('');
    this.aiResponse.set('');
    this.textPrompt.set('');

    this.aiService.ask(promptText).subscribe({
      next: (res) => this.handleSuccess(res.history, promptText),
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
      this.status.set('Processing...');
    }
  }

  private processAudio(audioBlob: Blob) {
    this.isProcessing.set(true);
    this.aiService.askAudio(audioBlob).subscribe({
      next: (res) => this.handleSuccess(res.history, res.transcript || '', true),
      error: (err) => this.handleError(err)
    });
  }

  clearHistory() {
    this.status.set('Clearing history...');
    this.aiService.clearHistory().subscribe(() => {
      this.chatHistory.set([]);
      this.transcript.set('');
    });
  }

  private handleSuccess(history: ChatMessage[], transcriptText: string, isVoice = false) {
    this.chatHistory.set(history);
    if (isVoice) {
      this.transcript.set(transcriptText);
    } else {
      // For text requests, we can just echo what they typed as the "transcript"
      this.transcript.set(transcriptText);
    }
    this.status.set('Ready');
    this.isProcessing.set(false);
  }

  private handleError(err: any) {
    console.error('API Error:', err);
    this.aiResponse.set('Request failed. Check console for details.');
    this.status.set('Failed');
    this.isProcessing.set(false);
  }
}
