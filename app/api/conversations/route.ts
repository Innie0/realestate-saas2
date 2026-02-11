// @ts-nocheck
// Conversations API route - Handle conversation creation, listing, and message management
// GET: List all conversations for the current user
// POST: Create a new conversation or add a message to existing conversation
// DELETE: Delete a conversation

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { openai } from '@/lib/openai';

/**
 * GET handler - Retrieve all conversations for the current user
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

    // Get conversation_id from query params (if provided)
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');

    // If conversation_id is provided, get that conversation with messages
    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError) {
        return NextResponse.json(
          { success: false, error: 'Conversation not found' },
          { status: 404 }
        );
      }

      // Get messages for this conversation
      const { data: messages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch messages' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { ...conversation, messages: messages || [] },
      });
    }

    // Otherwise, fetch all conversations for the user (pinned first, then by updated_at)
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversations || [],
    });
  } catch (error: any) {
    console.error('Get conversations error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve conversations' },
      { status: 500 }
    );
  }
}

/**
 * POST handler - Create a new conversation or add a message to existing conversation
 * Body should contain: 
 *   - message: the user's message
 *   - conversation_id (optional): if continuing an existing conversation
 *   - imageData (optional): base64 image data
 *   - imageName (optional): image filename
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
    const { message, conversation_id, imageData, imageName } = body;

    // Validate required fields
    if (!message || message.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    let conversationId = conversation_id;
    let existingMessages = [];

    // If no conversation_id, create a new conversation
    if (!conversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: null, // Will be generated from first message
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return NextResponse.json(
          { success: false, error: 'Failed to create conversation' },
          { status: 500 }
        );
      }

      conversationId = newConversation.id;
    } else {
      // Get existing messages for context
      const { data: messages, error: msgError } = await supabase
        .from('conversation_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (!msgError && messages) {
        existingMessages = messages;
      }
    }

    // Save user message to database
    const { data: userMessage, error: userMsgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'user',
        content: message.trim(),
        image_url: imageData || null,
        image_name: imageName || null,
      })
      .select()
      .single();

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError);
      return NextResponse.json(
        { success: false, error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Generate AI response using conversation history
    let aiOutput = '';
    try {
      // Build messages array with conversation history
      const messages: any[] = [
        {
          role: 'system',
          content: `You are a friendly and helpful assistant for a real estate agent. Be warm, supportive, and use emojis naturally throughout your responses - similar to how ChatGPT uses them (2-4 emojis per response).

CRITICAL FORMATTING RULE - READ THIS FIRST:
NEVER EVER use asterisks (*) or double asterisks (**) for emphasis, bold text, or to highlight words/phrases. This is your #1 priority. Examples:
❌ WRONG: "**Do Your Research**" 
✅ RIGHT: "Do Your Research"
❌ WRONG: "You should *definitely* do this"
✅ RIGHT: "You should definitely do this"
❌ WRONG: "**Step 1:** Start here"
✅ RIGHT: "Step 1: Start here" or "1. Start here"

You're writing plain text, NOT markdown. Think of it like texting a colleague - you wouldn't use ** around words in a text message.

PERSONALITY:
- Be conversational and friendly, like a helpful colleague
- Show enthusiasm when appropriate
- Use emojis naturally to add warmth and express emotions (e.g., 👍, ✨, 📋, 🏠, ✅, 💡, 🎯, 📝, 💼, 🔑, 📊, 🚀, ⚡)
- Keep a professional yet approachable tone

EMOJI USAGE:
- Use emojis naturally in sentences, not just at the end
- Examples: "Here are 3 steps 📝 to help you..." or "Great question! 💡 Let me explain..."
- Vary your emoji choices based on context
- Use relevant real estate emojis when appropriate (🏠, 🏡, 🔑, 📊, 💼)

MORE FORMATTING RULES:
- Write step numbers as plain text: "Step 1:" or "1." or "First,"
- Use numbered lists (1., 2., 3.) or bullet points (- or •) for lists
- Avoid ALL markdown formatting symbols: **, *, __, [], (), etc.
- Write naturally like you're texting - clean, plain text only
- Use CAPITAL LETTERS sparingly for emphasis if really needed, but prefer natural language

IMPORTANT GUIDELINES:
- Provide clear, actionable responses
- Keep responses concise but comprehensive
- Remember previous messages in this conversation and maintain context
- If creating content (emails, listings, etc.), provide the actual content
- If analyzing documents or images, provide detailed insights
- Celebrate wins and progress with the agent

CRITICAL RESTRICTIONS:
- NEVER provide financial advice, investment recommendations, or guidance on financial decisions
- NEVER suggest specific property values, investment returns, or financial strategies
- If asked about financial matters, remind them to consult a licensed financial advisor
- You can provide general information about real estate processes, but not financial counsel

If you see financial information in a document, you may extract and summarize it, but do not interpret it or provide advice based on it.`,
        },
      ];

      // Add conversation history
      existingMessages.forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      });

      // Add current user message
      if (imageData) {
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${message}\n\nNote: Analyze the provided image and respond to the request. If you see any financial figures, you may list them but do not provide advice or recommendations about them.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageData,
              },
            },
          ],
        });
      } else {
        messages.push({
          role: 'user',
          content: message,
        });
      }

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      aiOutput = completion.choices[0]?.message?.content || 'Unable to generate response.';
      
      // Strip markdown formatting that OpenAI loves to add
      // Remove **bold** → bold
      aiOutput = aiOutput.replace(/\*\*(.*?)\*\*/g, '$1');
      // Remove *italic* → italic
      aiOutput = aiOutput.replace(/\*(.*?)\*/g, '$1');
      // Remove __bold__ → bold
      aiOutput = aiOutput.replace(/__(.*?)__/g, '$1');
      // Remove _italic_ → italic  
      aiOutput = aiOutput.replace(/_(.*?)_/g, '$1');
      // Remove ### headings → just the text
      aiOutput = aiOutput.replace(/^#{1,6}\s+/gm, '');
    } catch (aiError: any) {
      console.error('OpenAI error:', aiError);
      aiOutput = 'Error: Unable to generate AI response. Please try again.';
    }

    // Save assistant message to database
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        user_id: user.id,
        role: 'assistant',
        content: aiOutput,
      })
      .select()
      .single();

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError);
    }

    // Generate title for new conversations using AI (like ChatGPT does)
    if (!conversation_id) {
      try {
        const titleCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Generate a short, concise title (3-5 words max) for this conversation based on the user\'s first message. The title should be descriptive and capture the main topic. Do not use quotes or punctuation at the end. Examples: "Listing Description Help", "Commercial Property Offer", "Client Follow-up Strategy"'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 50,
        });

        const generatedTitle = titleCompletion.choices[0]?.message?.content?.trim() || message.slice(0, 60);
        
        await supabase
          .from('conversations')
          .update({ title: generatedTitle })
          .eq('id', conversationId);
      } catch (titleError) {
        // Fallback to simple truncation if AI title generation fails
        console.error('Error generating title:', titleError);
        const fallbackTitle = message.slice(0, 60) + (message.length > 60 ? '...' : '');
        await supabase
          .from('conversations')
          .update({ title: fallbackTitle })
          .eq('id', conversationId);
      }
    }

    // Get updated conversation with all messages
    const { data: messages, error: fetchError } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      success: true,
      data: {
        conversation_id: conversationId,
        messages: messages || [],
      },
      message: 'Message sent successfully',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler - Delete a conversation
 * Body should contain: conversation_id
 */
export async function DELETE(request: NextRequest) {
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
    const { conversation_id } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    // Delete conversation (messages will be cascaded)
    const { error: deleteError } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversation_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting conversation:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler - Update conversation (e.g., toggle pinned status)
 * Body should contain: conversation_id, pinned
 */
export async function PATCH(request: NextRequest) {
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
    const { conversation_id, pinned } = body;

    if (!conversation_id || pinned === undefined) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID and pinned status are required' },
        { status: 400 }
      );
    }

    // Update conversation
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({ pinned })
      .eq('id', conversation_id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating conversation:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedConversation,
      message: 'Conversation updated successfully',
    });
  } catch (error: any) {
    console.error('Update conversation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

