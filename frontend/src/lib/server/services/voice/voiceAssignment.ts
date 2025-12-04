import { BRITISH_VOICES, BritishVoice } from "@/const/voices";

/**
 * Auto-assign appropriate voice to persona based on gender
 * Uses rotation to ensure variety across personas
 */
export function autoAssignVoice(personaId: string, gender: string): {
  voice_id: string;
  voice_name: string;
  voice_accent: string;
} {
  const maleVoices = BRITISH_VOICES.filter(voice => 
    ['Tony', 'Christopher', 'Jav', 'Archie', 'Matthew', 'Gerry'].includes(voice.name)
  );
  
  const femaleVoices = BRITISH_VOICES.filter(voice => 
    ['Ana-Rita', 'Laura'].includes(voice.name)
  );
  
  // Determine voice array based on gender
  let voiceArray: BritishVoice[];
  const normalizedGender = gender.toLowerCase();
  
  if (normalizedGender.includes('male') && !normalizedGender.includes('female')) {
    voiceArray = maleVoices;
  } else if (normalizedGender.includes('female')) {
    voiceArray = femaleVoices;
  } else {
    // Default to male voices for non-binary/other/unclear
    voiceArray = maleVoices;
  }
  
  // Use persona ID to create consistent but distributed assignment
  const voiceIndex = hashString(personaId) % voiceArray.length;
  const selectedVoice = voiceArray[voiceIndex];
  
  return {
    voice_id: selectedVoice.id,
    voice_name: selectedVoice.name,
    voice_accent: selectedVoice.accent,
  };
}

/**
 * Simple hash function to convert string to number for voice rotation
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if organization has voice feature enabled
 */
export async function isVoiceEnabledForOrganization(organizationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/organizations/${organizationId}/branding`);
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.voice_enabled || false;
  } catch (error) {
    console.error('Error checking voice enabled status:', error);
    return false;
  }
}

/**
 * Get voice assignment summary for admin display
 */
export function getVoiceAssignmentSummary(voice_id?: string): {
  isAutoAssigned: boolean;
  displayText: string;
} {
  if (!voice_id) {
    return {
      isAutoAssigned: false,
      displayText: 'No voice assigned'
    };
  }
  
  const voice = BRITISH_VOICES.find(v => v.id === voice_id);
  if (!voice) {
    return {
      isAutoAssigned: false,
      displayText: 'Unknown voice'
    };
  }
  
  // For now, we'll consider all voices as potentially auto-assigned
  // In the future, we could track this in the database
  return {
    isAutoAssigned: true,
    displayText: `${voice.description} (Auto)`
  };
}



