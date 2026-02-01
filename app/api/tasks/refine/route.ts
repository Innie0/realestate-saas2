// @ts-nocheck
// API route for AI refinement of task outputs
// POST: Refine existing task output based on user instructions

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';

/**
 * POST handler - Refine task output with AI based on user instructions
 * Body should contain: taskId, currentOutput, instruction
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { taskId, currentOutput, instruction } = body;

    // Validate required fields
    if (!taskId || !currentOutput || !instruction) {
      return NextResponse.json(
        { success: false, error: 'Task ID, current output, and instruction are required' },
        { status: 400 }
      );
    }

    // Verify the task belongs to the user
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, prompt')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: 'Task not found or unauthorized' },
        { status: 404 }
      );
    }

    // Generate refined output using OpenAI
    let refinedOutput = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for a real estate agent. You are refining a previous response based on user feedback.
Maintain the helpful, professional tone while incorporating the user's requested changes.
Keep the response clear and actionable.`,
          },
          {
            role: 'user',
            content: `Original task: ${task.prompt}

Current output:
${currentOutput}

User's refinement request: ${instruction}

Please provide an improved version based on the user's request.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      refinedOutput = completion.choices[0]?.message?.content || 'Unable to generate refined response.';
    } catch (aiError: any) {
      console.error('OpenAI error:', aiError);
      return NextResponse.json(
        { success: false, error: 'Failed to generate AI refinement' },
        { status: 500 }
      );
    }

    // Update the task with the refined output
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ output: refinedOutput })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task with refined output:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task refined successfully',
    });
  } catch (error: any) {
    console.error('Refine task error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to refine task' },
      { status: 500 }
    );
  }
}


