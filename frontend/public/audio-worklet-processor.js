/**
 * AudioWorklet Processor for low-latency voice streaming
 * This runs in a separate audio rendering thread for optimal performance
 */

class VoiceStreamProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 128; // ~8ms at 16kHz (much lower latency than ScriptProcessor's 4096)
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    // If no input channel, return
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0];

    // Accumulate samples into our buffer
    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];

      // When buffer is full, send it to the main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Check if there's actual audio (not just silence)
        const hasAudio = this.buffer.some(sample => Math.abs(sample) > 0.001);
        
        if (hasAudio) {
          // Send buffer to main thread for WebSocket transmission
          this.port.postMessage({
            type: 'audio',
            buffer: this.buffer.slice(0) // Copy the buffer
          });
        }

        // Reset buffer
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('voice-stream-processor', VoiceStreamProcessor);



