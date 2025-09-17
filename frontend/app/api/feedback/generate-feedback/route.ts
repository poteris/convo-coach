import { NextRequest, NextResponse } from "next/server";
import { feedbackDataSchema } from "@/types/feedback";
import { generateFeedbackUsingLLM } from "@/lib/server/services/feedback/feedbackCompletion";
import { supabase } from "../../init";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const feedback = await generateFeedbackUsingLLM(body.conversationId);

    const parsedFeedback = feedbackDataSchema.parse(feedback);

    // Save feedback to database
    const { error } = await supabase
      .from("feedback")
      .upsert({
        conversation_id: body.conversationId,
        score: parsedFeedback.score,
        summary: parsedFeedback.summary,
        strengths: parsedFeedback.strengths,
        areas_for_improvement: parsedFeedback.areas_for_improvement,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'conversation_id'
      });

    if (error) {
      console.error("Error saving feedback:", error);
      // Still return the feedback even if saving fails
    }

    return NextResponse.json(parsedFeedback, { status: 200 });
  } catch (error) {
    console.error("Error generating feedback:", error);
    return NextResponse.json({ error: "Failed to generate feedback" }, { status: 500 });
  }
}
