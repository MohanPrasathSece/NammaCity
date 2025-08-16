const asyncHandler = require('express-async-handler');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Chat with the bot
// @route   POST /api/chat
// @access  Private
const chatWithBot = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant for the Urban Aid app, designed to help users in Coimbatore. Be concise and helpful.' },
        ...history,
        { role: 'user', content: message },
      ],
    });

    res.json(completion.choices[0].message);
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    res.status(500).json({ message: 'Failed to get response from chatbot.' });
  }
});

module.exports = { chatWithBot };
