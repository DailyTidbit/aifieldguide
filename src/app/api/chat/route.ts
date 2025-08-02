import { NextRequest, NextResponse } from 'next/server';

// Message type definition
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// API key environment variable names
const API_KEY_ENV_VARS = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_API_KEY',
  perplexity: 'PERPLEXITY_API_KEY',
  mistral: 'MISTRAL_API_KEY',
  cohere: 'COHERE_API_KEY',
  together: 'TOGETHER_API_KEY',
} as const;

// Provider functions - each handles its own formatting
async function callOpenAI(messages: ChatMessage[], apiKey: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from OpenAI');
  }
  
  return content;
}

async function callAnthropic(messages: ChatMessage[], apiKey: string): Promise<string> {
  try {
    // Remove system messages and clean extra fields
    const filteredMessages = messages
      .filter(m => m.role !== 'system')
      .map(msg => ({
        role: msg.role,
        content: msg.content
        // Remove timestamp, provider, and any other extra fields
      }));
    
    // If we had a system message, prepend it to the first user message
    const systemMessage = messages.find(m => m.role === 'system');
    if (systemMessage && filteredMessages.length > 0 && filteredMessages[0].role === 'user') {
      filteredMessages[0] = {
        role: 'user',
        content: `${systemMessage.content}\n\nUser: ${filteredMessages[0].content}`
      };
    }

    // Ensure we have at least one message and it starts with user
    if (filteredMessages.length === 0) {
      throw new Error('No valid messages for Anthropic API');
    }

    // Ensure first message is from user (Anthropic requirement)
    if (filteredMessages[0].role !== 'user') {
      filteredMessages.unshift({
        role: 'user',
        content: 'Please help me with the following:'
      });
    }

    const requestBody = {
      model: 'claude-sonnet-4-20250514', // Latest Claude Sonnet 4
      max_tokens: 1000,
      messages: filteredMessages,
    };

    console.log('Anthropic request body:', JSON.stringify(requestBody, null, 2));
    console.log('API key format check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length,
      keyPrefix: apiKey?.substring(0, 8) + '...',
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Anthropic response status:', response.status);
    console.log('Anthropic response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Get the error details from the response
      const errorText = await response.text();
      console.error('Anthropic API error details:', errorText);
      
      let errorMessage = `Anthropic API error: ${response.status}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error?.message) {
          errorMessage += ` - ${errorData.error.message}`;
        }
      } catch (parseError) {
        errorMessage += ` - ${errorText}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Anthropic response data:', data);
    
    const content = data.content?.[0]?.text;
    
    if (!content) {
      console.error('No content in Anthropic response:', data);
      throw new Error('No response content from Anthropic');
    }
    
    return content;

  } catch (error) {
    console.error('Anthropic function error:', error);
    throw error;
  }
}

async function callGoogle(messages: ChatMessage[], apiKey: string): Promise<string> {
  // Format messages for Google
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates[0]?.content?.parts[0]?.text;
  
  if (!content) {
    throw new Error('No response from Google');
  }
  
  return content;
}

async function callPerplexity(messages: ChatMessage[], apiKey: string): Promise<string> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar', // Core Perplexity model with real-time search
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from Perplexity');
  }
  
  return content;
}

async function callMistral(messages: ChatMessage[], apiKey: string): Promise<string> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from Mistral');
  }
  
  return content;
}

async function callCohere(messages: ChatMessage[], apiKey: string): Promise<string> {
  // Format messages for Cohere
  const lastMessage = messages[messages.length - 1];
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'assistant' ? 'CHATBOT' : 'USER',
    message: msg.content,
  }));

  const response = await fetch('https://api.cohere.ai/v1/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'command-r-plus',
      message: lastMessage.content,
      chat_history: history,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cohere API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.text;
  
  if (!content) {
    throw new Error('No response from Cohere');
  }
  
  return content;
}

async function callTogether(messages: ChatMessage[], apiKey: string): Promise<string> {
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Together.ai API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from Together.ai');
  }
  
  return content;
}

// Provider function map
const PROVIDER_FUNCTIONS = {
  openai: callOpenAI,
  anthropic: callAnthropic,
  google: callGoogle,
  perplexity: callPerplexity,
  mistral: callMistral,
  cohere: callCohere,
  together: callTogether,
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider = 'openai' }: { messages: ChatMessage[]; provider?: string } = body;

    console.log('=== API Request Debug ===');
    console.log('Provider:', provider);
    console.log('Messages count:', messages?.length);
    console.log('Messages:', JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!(provider in PROVIDER_FUNCTIONS)) {
      return NextResponse.json(
        { error: `Unsupported provider: ${provider}` },
        { status: 400 }
      );
    }

    // Get API key for the provider
    const apiKeyEnvVar = API_KEY_ENV_VARS[provider as keyof typeof API_KEY_ENV_VARS];
    const apiKey = process.env[apiKeyEnvVar];
    
    console.log('API Key check:', {
      envVar: apiKeyEnvVar,
      hasKey: !!apiKey,
      keyLength: apiKey?.length,
      keyStart: apiKey?.substring(0, 8) + '...'
    });
    
    if (!apiKey) {
      console.error(`Missing API key for ${provider}: ${apiKeyEnvVar}`);
      return NextResponse.json(
        { error: `API key not configured for ${provider}` },
        { status: 500 }
      );
    }

    // Enhanced system message for writing improvement with formatting guidance
    const systemMessage: ChatMessage = {
      role: 'system',
      content: `You are a helpful AI writing assistant specializing in improving text. Your job is to help users rewrite, enhance, and polish their writing.

FORMATTING GUIDELINES:
- Use numbered lists (1. 2. 3.) for step-by-step instructions or ordered processes
- Use bullet points (-) for feature lists, options, or unordered items
- Use **bold text** to emphasize key points, important terms, or main ideas
- Use *italic text* for subtle emphasis or introducing new concepts
- Use \`code formatting\` for technical terms, specific tools, or exact phrases to copy
- Use "quoted text" for examples of what to say or write
- End section headers with a colon (:) when introducing new topics
- Use clear paragraph breaks between different ideas or concepts

WRITING IMPROVEMENT FOCUS:
- Be concise, helpful, and focus on making the text clearer, more engaging, and more effective
- Always maintain the original intent while improving clarity, flow, and impact
- Provide specific, actionable suggestions
- Break down complex improvements into clear steps when helpful

Format your response in a way that's easy to scan and follow.`
    };

    const allMessages: ChatMessage[] = [systemMessage, ...messages];

    // Call the appropriate provider function
    const providerFunction = PROVIDER_FUNCTIONS[provider as keyof typeof PROVIDER_FUNCTIONS];
    
    console.log(`Making request to ${provider}:`, {
      provider,
      messageCount: messages.length,
      totalMessageCount: allMessages.length
    });

    try {
      const assistantResponse = await providerFunction(allMessages, apiKey);
      
      console.log(`${provider} response received successfully`);

      return NextResponse.json({
        assistant: assistantResponse,
        provider: provider,
      });

    } catch (providerError) {
      console.error(`${provider} API error:`, providerError);
      
      // Provide user-friendly error messages
      let userErrorMessage = `${provider} is currently unavailable`;
      
      if (providerError instanceof Error) {
        console.error('Full error details:', {
          message: providerError.message,
          stack: providerError.stack,
          name: providerError.name
        });
        
        if (providerError.message.includes('401')) {
          userErrorMessage = `Authentication failed with ${provider}. Check API key.`;
        } else if (providerError.message.includes('400')) {
          userErrorMessage = `Invalid request to ${provider}. ${providerError.message}`;
        } else if (providerError.message.includes('429')) {
          userErrorMessage = `Rate limit exceeded for ${provider}. Please try again later`;
        } else if (providerError.message.includes('500')) {
          userErrorMessage = `${provider} server error. Please try again`;
        } else {
          userErrorMessage = providerError.message;
        }
      }
      
      return NextResponse.json(
        { error: userErrorMessage },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle different types of errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request' },
        { status: 400 }
      );
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Network error. Please check your connection' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}