import { NextRequest, NextResponse } from "next/server";
import { deleteElevenLabsAgent, getConversationTranscript } from "@/lib/server/services/elevenlabs/agentService";
import { syncTranscriptToDatabase } from "@/lib/server/services/elevenlabs/transcriptService";
import { supabaseService as supabase } from "../../service-init";

export async function POST(req: NextRequest) {
  try {
    const { conversationId, elevenLabsConversationId } = await req.json();

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const { data: conversation } = await supabase
      .from("conversations")
      .select("elevenlabs_agent_id")
      .eq("conversation_id", conversationId)
      .single();
    const agentId = conversation?.elevenlabs_agent_id;

    let messageCount = 0;
    let transcriptError: string | undefined;

    if (elevenLabsConversationId) {
      try {
        const transcriptData = await getConversationTranscript(elevenLabsConversationId);
        // Only trust a transcript that belongs to this conversation's agent.
        if (agentId && transcriptData.agent_id !== agentId) {
          return NextResponse.json({ error: "Transcript does not belong to this conversation" }, { status: 403 });
        }
        messageCount = await syncTranscriptToDatabase(conversationId, transcriptData);
      } catch (error) {
        // Transcript may not be ready yet; let the UI carry on to feedback.
        console.error("Error fetching/syncing transcript:", error);
        transcriptError = error instanceof Error ? error.message : "Unknown error";
      }
    }

    // Per-conversation agents are disposable; remove them once the transcript is saved.
    if (agentId && agentId !== "CREATING" && !transcriptError) {
      try {
        await deleteElevenLabsAgent(agentId);
      } catch (error) {
        console.error("Error deleting ElevenLabs agent:", agentId, error);
      }
    }

    return NextResponse.json(
      transcriptError
        ? { success: false, error: "Failed to fetch transcript", details: transcriptError }
        : { success: true, messageCount },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error ending voice session:", error);
    return NextResponse.json({ error: "Failed to end voice session" }, { status: 500 });
  }
}
