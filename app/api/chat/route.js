import { generateText, streamText } from 'ai';
import { createMistral } from '@ai-sdk/mistral';

const mistral = createMistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

// Fallback responses for when API is unavailable
const getFallbackResponse = (userMessage) => {
  const message = userMessage.toLowerCase();

  if (message.includes('hello') || message.includes('hi')) {
    return 'Hello! I\'m your AI assistant. How can I help you today?';
  } else if (message.includes('stock') || message.includes('market')) {
    return 'I can help you with stock market analysis! You can ask me about specific stocks, market trends, or investment strategies. What would you like to know?';
  } else if (message.includes('apple') || message.includes('aapl')) {
    return 'Apple (AAPL) is currently showing strong performance. The stock has been gaining momentum with positive technical indicators. Would you like more detailed analysis?';
  } else if (message.includes('tesla') || message.includes('tsla')) {
    return 'Tesla (TSLA) has been experiencing volatility recently. The electric vehicle sector is seeing mixed sentiment. What specific aspect interests you?';
  } else if (message.includes('help')) {
    return 'I\'m here to help! You can ask me about:\n• Stock analysis and prices\n• Market trends and news\n• Investment strategies\n• Portfolio recommendations\n• Financial concepts\n\nWhat would you like to explore?';
  } else {
    return `I understand you're asking about: "${userMessage}". As your AI assistant, I'm here to provide helpful information. Could you please clarify what specific aspect you'd like me to help you with?`;
  }
};

export async function POST(request) {
  try {
    const { messages } = await request.json();

    // Convert messages with parts array to standard format
    const formattedMessages = messages?.map(msg => {
      if (msg?.parts && Array.isArray(msg?.parts)) {
        const textPart = msg?.parts.find(part => part.type === 'text');
        return {
          id: msg?.id,
          role: msg?.role,
          content: textPart?.text || msg?.content || ''
        };
      }
      return {
        id: msg?.id,
        role: msg?.role,
        content: msg?.content || ''
      };
    });

    console.log("🚀 ~ formattedMessages:", formattedMessages);

    const result = streamText({
      model: mistral('mistral-large-latest'),
      messages: formattedMessages,
    });
    
    return result.toUIMessageStreamResponse();

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Use fallback response when API fails
    const lastMessage = messages[messages.length - 1];
    let userMessage = '';
    
    if (lastMessage) {
      if (lastMessage.parts && Array.isArray(lastMessage.parts)) {
        const textPart = lastMessage.parts.find(part => part.type === 'text');
        userMessage = textPart?.text || '';
      } else {
        userMessage = lastMessage.content || '';
      }
    }
    
    const fallbackResponse = getFallbackResponse(userMessage);
    
    return new Response(fallbackResponse, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// export async function POST(request) {
//   try {
//     const { messages } = await request.json();

//     // Get the last user message for fallback
//     const lastMessage = messages[messages.length - 1];
//     const userMessage = lastMessage?.content || '';
//     try {
//       // Ensure messages is in the correct format for Mistral
//       const formattedMessages = [{ role: 'user', content: messages }];


//       // Try to generate AI response using Mistral
//       const { text } = await generateText({
//         model: mistral('mistral-large-latest'),
//         messages: formattedMessages,
//         maxTokens: 1000,
//         temperature: 0.7,
//       });

//       // stream text , react markdown
//       console.log('AI Response:', text);

//       return NextResponse.json({
//         role: 'assistant',
//         content: text
//       });

//     } catch (apiError) {
//       console.error('Mistral API Error:', apiError);

//       // Use fallback response when API fails
//       console.log('Using fallback response due to API error');
//       const fallbackResponse = getFallbackResponse(userMessage);

//       return NextResponse.json({
//         role: 'assistant',
//         content: fallbackResponse
//       });
//     }

//   } catch (error) {
//     console.error('Chat API Error:', error);
//     return NextResponse.json(
//       { error: 'Failed to process message', details: error.message },
//       { status: 500 }
//     );
//   }
// }
