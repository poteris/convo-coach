import { NextRequest, NextResponse } from "next/server";
import { supabaseService as supabase } from "../../service-init";

interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, transcriptData } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Missing conversationId' },
        { status: 400 }
      );
    }

    console.log('🔚 Ending voice session:', conversationId);

    // If transcriptData provided (from LiveKit client), save it
    if (transcriptData && Array.isArray(transcriptData) && transcriptData.length > 0) {
      try {
        console.log('📝 Saving transcript with', transcriptData.length, 'messages');
        
        const messagesToInsert = transcriptData.map((msg: TranscriptMessage) => ({
          conversation_id: conversationId,
          role: msg.role,
          content: msg.content,
          created_at: new Date(msg.timestamp).toISOString()
        }));

        const { error } = await supabase
          .from('messages')
          .insert(messagesToInsert);

        if (error) {
          console.error('❌ Error saving transcript:', error);
          throw new Error('Failed to save transcript');
        }

        console.log('✅ Transcript saved successfully');

        return NextResponse.json({
          success: true,
          messageCount: transcriptData.length
        }, { status: 200 });
      } catch (transcriptError) {
        console.error('Error saving transcript:', transcriptError);
        // Don't fail the whole request
        return NextResponse.json({
          success: false,
          error: 'Failed to save transcript',
          details: transcriptError instanceof Error ? transcriptError.message : 'Unknown error'
        }, { status: 200 }); // Still return 200 so UI can proceed
      }
    }

    // No transcript to save
    return NextResponse.json({
      success: true,
      message: 'Session ended (no transcript to save)'
    }, { status: 200 });

  } catch (error) {
    console.error('Error ending voice session:', error);
    return NextResponse.json(
      { error: 'Failed to end voice session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}




