-- Add INSERT policy for feedback table
CREATE POLICY "Users can insert feedback for their conversations" ON public.feedback
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT conversation_id FROM public.conversations 
      WHERE user_id = auth.uid()::text
    )
  );

-- Add UPDATE policy for feedback table  
CREATE POLICY "Users can update feedback for their conversations" ON public.feedback
  FOR UPDATE USING (
    conversation_id IN (
      SELECT conversation_id FROM public.conversations 
      WHERE user_id = auth.uid()::text
    )
  );
