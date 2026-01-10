import './style.css';

// Import Piper TTS
import { PiperTTS } from '@mintplex-labs/piper-tts-web';

interface TTSState {
  isInitialized: boolean;
  isLoading: boolean;
  isSpeaking: boolean;
  error: string | null;
  message: string | null;
  modelUrl: string;
  modelPath: string;
}

class PiperTTSApp {
  private state: TTSState = {
    isInitialized: false,
    isLoading: false,
    isSpeaking: false,
    error: null,
    message: null,
    modelUrl: 'https://github.com/rhasspy/piper-voices/releases/download/v1.0.0/en_US-libritts-high.onnx',
    modelPath: 'en_US-libritts-high.onnx',
  };

  private piper: PiperTTS | null = null;
  private audioContext: AudioContext | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      this.updateMessage('جاري تهيئة التطبيق...', 'info');
      
      // Initialize AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Initialize Piper TTS
      this.piper = new PiperTTS();
      
      // Load the model
      await this.loadModel();
      
      this.state.isInitialized = true;
      this.updateMessage('تم تحميل النموذج بنجاح!', 'success');
      this.render();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.state.error = errorMsg;
      this.updateMessage(`خطأ: ${errorMsg}`, 'error');
      console.error('Initialization error:', error);
      this.render();
    }
  }

  private async loadModel() {
    try {
      this.state.isLoading = true;
      this.updateMessage('جاري تحميل نموذج الصوت...', 'info');
      
      // Load model from GitHub CDN
      if (this.piper) {
        await this.piper.loadModel(this.state.modelUrl);
      }
      
      this.state.isLoading = false;
    } catch (error) {
      this.state.isLoading = false;
      throw error;
    }
  }

  private async synthesize(text: string, speaker: number = 0, speed: number = 1.0) {
    if (!this.piper || !this.state.isInitialized) {
      this.updateMessage('التطبيق غير جاهز بعد', 'error');
      return;
    }

    if (!text.trim()) {
      this.updateMessage('الرجاء إدخال نص', 'warning');
      return;
    }

    try {
      this.state.isLoading = true;
      this.state.isSpeaking = true;
      this.updateMessage('جاري معالجة النص...', 'info');
      this.render();

      // Synthesize speech
      const audioBuffer = await this.piper.synthesize(text, {
        speaker: speaker,
        length_scale: 1 / speed,
      });

      // Create audio blob and play
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      this.playAudio(audioUrl);
      this.updateMessage('تم إنشاء الصوت بنجاح!', 'success');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.updateMessage(`خطأ: ${errorMsg}`, 'error');
      console.error('Synthesis error:', error);
    } finally {
      this.state.isLoading = false;
      this.render();
    }
  }

  private playAudio(url: string) {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.src = '';
    }

    this.currentAudio = new Audio(url);
    this.currentAudio.play().catch(error => {
      console.error('Playback error:', error);
      this.updateMessage('خطأ في تشغيل الصوت', 'error');
    });

    this.currentAudio.addEventListener('ended', () => {
      this.state.isSpeaking = false;
      this.render();
    });
  }

  private downloadAudio() {
    if (!this.currentAudio || !this.currentAudio.src) {
      this.updateMessage('لا يوجد صوت لتحميله', 'warning');
      return;
    }

    const link = document.createElement('a');
    link.href = this.currentAudio.src;
    link.download = `tts-output-${Date.now()}.wav`;
    link.click();
    this.updateMessage('جاري تحميل الملف...', 'success');
  }

  private updateMessage(msg: string, type: 'success' | 'error' | 'info' | 'warning') {
    this.state.message = msg;
    const messageEl = document.getElementById('message');
    if (messageEl) {
      messageEl.className = `message ${type}`;
      messageEl.textContent = msg;
      messageEl.style.display = 'flex';
    }
  }

  private render() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
      <div class="container">
        <div class="header">
          <h1>🎙️ Piper TTS</h1>
          <p>تحويل النص إلى صوت في المتصفح</p>
        </div>

        <div id="message" class="message" style="display: none;"></div>

        ${!this.state.isInitialized ? `
          <div class="loading">
            <div class="spinner"></div>
            جاري تحميل النموذج...
          </div>
        ` : `
          <div class="form-group">
            <label for="text">النص المراد تحويله:</label>
            <textarea id="text" placeholder="أدخل النص هنا...">مرحبا بك في منصة تحويل النص إلى صوت</textarea>
          </div>

          <div class="controls">
            <div class="control-item">
              <label for="speed">السرعة:</label>
              <input type="range" id="speed" min="0.5" max="2" step="0.1" value="1">
              <div class="value"><span id="speedValue">1.0</span>x</div>
            </div>
            <div class="control-item">
              <label for="speaker">المتحدث:</label>
              <select id="speaker">
                <option value="0">المتحدث الافتراضي</option>
              </select>
            </div>
          </div>

          <div class="button-group">
            <button class="btn-primary" id="synthesize" ${this.state.isLoading ? 'disabled' : ''}>
              ${this.state.isLoading ? '<div class="spinner"></div> جاري المعالجة...' : '🎵 تحويل إلى صوت'}
            </button>
            <button class="btn-secondary" id="stop" ${!this.state.isSpeaking ? 'disabled' : ''}>
              ⏹️ إيقاف
            </button>
          </div>

          ${this.currentAudio && this.currentAudio.src ? `
            <div class="audio-player">
              <audio id="player" controls>
                <source src="${this.currentAudio.src}" type="audio/wav">
              </audio>
              <div class="audio-controls">
                <button class="btn-secondary" id="download" style="flex: 1;">
                  ⬇️ تحميل الملف
                </button>
              </div>
            </div>
          ` : ''}

          <div class="stats">
            <div class="stat-item">
              <div class="label">الحالة</div>
              <div class="value">${this.state.isSpeaking ? '🔊 تشغيل' : '✓ جاهز'}</div>
            </div>
            <div class="stat-item">
              <div class="label">النموذج</div>
              <div class="value">LibriTTS</div>
            </div>
          </div>
        `}
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const synthesizeBtn = document.getElementById('synthesize');
    const stopBtn = document.getElementById('stop');
    const downloadBtn = document.getElementById('download');
    const speedInput = document.getElementById('speed') as HTMLInputElement;
    const textArea = document.getElementById('text') as HTMLTextAreaElement;

    if (synthesizeBtn) {
      synthesizeBtn.addEventListener('click', () => {
        const text = textArea?.value || '';
        const speed = parseFloat(speedInput?.value || '1');
        this.synthesize(text, 0, speed);
      });
    }

    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.state.isSpeaking = false;
          this.render();
        }
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => this.downloadAudio());
    }

    if (speedInput) {
      speedInput.addEventListener('change', (e) => {
        const speedValue = document.getElementById('speedValue');
        if (speedValue) {
          speedValue.textContent = (e.target as HTMLInputElement).value;
        }
      });
    }
  }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PiperTTSApp();
});
