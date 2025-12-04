/**
 * Curated list of British voices from ElevenLabs
 * Covering various UK accents for realistic persona representation
 */

export interface BritishVoice {
  id: string;
  name: string;
  accent: string;
  description: string;
}

export const BRITISH_VOICES: BritishVoice[] = [
  {
    id: 'v9I7auPeR1xGKYRPwQGG',
    name: 'Tony',
    accent: 'Liverpool',
    description: 'Tony - Liverpool accent'
  },
  {
    id: 'G17SuINrv2H9FC6nvetn',
    name: 'Christopher',
    accent: 'Southern English',
    description: 'Christopher - Southern English'
  },
  {
    id: 'wJqPPQ618aTW29mptyoc',
    name: 'Ana-Rita',
    accent: 'Southern English',
    description: 'Ana-Rita - Southern English'
  },
  {
    id: 'jXL9qhD2NCIaHLhia8ex',
    name: 'Laura',
    accent: 'Northern Irish',
    description: 'Laura - Northern Irish'
  },
  {
    id: 's8AECd9nnogIc2M6gtnS',
    name: 'Jav',
    accent: 'British',
    description: 'Jav - British accent'
  },
  {
    id: 'aMdQCEO9kwP77QH1DiFy',
    name: 'Archie',
    accent: 'Scottish',
    description: 'Archie - Scottish'
  },
  {
    id: 'wUkGqD7qevNIshEdEC5s',
    name: 'Matthew',
    accent: 'Welsh',
    description: 'Matthew - Welsh'
  },
  {
    id: 'eyuCA3LWMylRajljTeOo',
    name: 'Gerry',
    accent: 'British',
    description: 'Gerry - British accent'
  }
];

export const DEFAULT_VOICE_ID = 'v9I7auPeR1xGKYRPwQGG'; // Tony - Liverpool accent

/**
 * Get voice by ID
 */
export function getVoiceById(voiceId: string): BritishVoice | undefined {
  return BRITISH_VOICES.find(v => v.id === voiceId);
}

/**
 * Get default voice or fallback
 */
export function getVoiceOrDefault(voiceId?: string): BritishVoice {
  if (voiceId) {
    const voice = getVoiceById(voiceId);
    if (voice) return voice;
  }
  return getVoiceById(DEFAULT_VOICE_ID)!;
}




