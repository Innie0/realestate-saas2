// Tasks API route - Handle task creation, listing, and updates
// GET: List all tasks for the current user
// POST: Create a new task and generate AI output
// PUT: Update a task (for manual edits)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';

/**
 * GET handler - Retrieve all tasks for the current user
 */
export async function GET(request: NextRequest) {
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

    // Fetch tasks for the user, ordered by most recent first
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, prompt, output, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tasks || [],
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Create a new task and generate AI output
 * Body should contain: prompt (the task text)
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
    const { prompt } = body;

    // Validate required fields
    if (!prompt || prompt.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Task prompt is required' },
        { status: 400 }
      );
    }

    // First, save the task to the database (without output)
    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        prompt: prompt.trim(),
        output: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating task:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create task' },
        { status: 500 }
      );
    }

    // Generate AI output using OpenAI
    let aiOutput = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for a real estate agent. The agent has a task they want to accomplish. 
Provide a clear, actionable response that helps them complete their task. 
Keep your response concise but comprehensive.
If the task is about creating content (emails, listings, etc.), provide the actual content.
If it's about a process or action, provide step-by-step guidance.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      aiOutput = completion.choices[0]?.message?.content || 'Unable to generate response.';
    } catch (aiError: any) {
      console.error('OpenAI error:', aiError);
      aiOutput = 'Error: Unable to generate AI response. Please try again.';
    }

    // Update the task with the AI output
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ output: aiOutput })
      .eq('id', newTask.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task with output:', updateError);
      // Return the task even if update fails (prompt was saved)
      return NextResponse.json({
        success: true,
        data: { ...newTask, output: aiOutput },
        message: 'Task created with AI output',
      }, { status: 201 });
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task created successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create task' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler - Update a task (for manual edits)
 * Body should contain: id, output
 */
export async function PUT(request: NextRequest) {
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
    const { id, output } = body;

    // Validate required fields
    if (!id || !output) {
      return NextResponse.json(
        { success: false, error: 'Task ID and output are required' },
        { status: 400 }
      );
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update({ output })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns this task
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully',
    });
  } catch (error: any) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update task' },
      { status: 500 }
    );
  }
}

