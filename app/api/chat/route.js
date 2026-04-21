import { generateText, streamText } from 'ai';
import { createMistral } from '@ai-sdk/mistral';
import { stockAgent } from "@/components/Agent/StockAgent";

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

    const result = await stockAgent.stream({ messages });
  
    let finalText = '';

    for await (const chunk of result?.textStream) {
      if (chunk) {
        finalText += chunk;
      }
    }

    return Response.json({
      role: 'assistant',
      content: finalText
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
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
