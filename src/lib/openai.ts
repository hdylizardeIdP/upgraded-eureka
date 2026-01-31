import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile as any, // Type assertion needed for Next.js File type
      model: 'whisper-1',
      language: 'en', // Can be auto-detected or specified
      response_format: 'text',
    });

    return transcription;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}

export { openai };
