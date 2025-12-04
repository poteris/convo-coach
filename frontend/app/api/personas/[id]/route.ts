import { NextRequest, NextResponse } from "next/server";
import { supabaseService as supabase } from "../../service-init";
import { personaSchema } from "@/types/persona";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Validate the persona data
    const validatedData = personaSchema.parse(body);

    // Update the persona in the database
    const { data, error } = await supabase
      .from('personas')
      .update({
        voice_id: validatedData.voice_id,
        voice_name: validatedData.voice_name,
        voice_accent: validatedData.voice_accent,
        // Include other fields that might be updated
        name: validatedData.name,
        segment: validatedData.segment,
        age: validatedData.age,
        gender: validatedData.gender,
        family_status: validatedData.family_status,
        uk_party_affiliation: validatedData.uk_party_affiliation,
        workplace: validatedData.workplace,
        job: validatedData.job,
        busyness_level: validatedData.busyness_level,
        major_issues_in_workplace: validatedData.major_issues_in_workplace,
        personality_traits: validatedData.personality_traits,
        emotional_conditions: validatedData.emotional_conditions,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating persona:', error);
      return NextResponse.json({ error: 'Failed to update persona' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in persona PATCH:', error);
    return NextResponse.json(
      { error: 'Invalid request data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}




