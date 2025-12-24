// Facebook-like message sounds using Web Audio API
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

// Facebook-like "pop" sound for sent messages
export const playMessageSentSound = () => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Higher pitch pop sound
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
    
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.log('[Sound] Could not play sent sound:', error);
  }
};

// Facebook-like "ding" notification sound for received messages
export const playMessageReceivedSound = () => {
  try {
    const ctx = getAudioContext();
    
    // Two-tone notification (like Facebook messenger)
    const playTone = (frequency: number, startTime: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // First tone - higher
    playTone(830, ctx.currentTime, 0.15);
    // Second tone - even higher (Facebook-like two-note ding)
    playTone(1046, ctx.currentTime + 0.12, 0.2);
    
  } catch (error) {
    console.log('[Sound] Could not play received sound:', error);
  }
};

// Initialize audio context on first user interaction
export const initializeAudio = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  } catch (error) {
    console.log('[Sound] Could not initialize audio:', error);
  }
};
