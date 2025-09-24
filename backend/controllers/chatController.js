const asyncHandler = require('express-async-handler');
const axios = require('axios');

// Hugging Face Inference API config
const HF_MODEL = process.env.HF_MODEL || 'tiiuae/falcon-7b-instruct';
const HF_API_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;

// @desc    Chat with the bot
// @route   POST /api/chat
// @access  Private
const chatWithBot = asyncHandler(async (req, res) => {
  const { message, history } = req.body;

  if (!message) {
    res.status(400);
    throw new Error('Message is required');
  }

  if (!HF_API_KEY) {
    res.status(500);
    throw new Error('HUGGINGFACE_API_KEY is not configured on the server');
  }

  try {
    // Build a simple prompt from history + user message
    const systemPrompt = 'You are a helpful assistant for the Namma City (Urban Aid) app, designed to help users in Coimbatore with services like food, shelter, restrooms, study spaces, navigation, and city information. Be concise, accurate, and friendly.';

    let prompt = `${systemPrompt}\n\n`;
    if (Array.isArray(history)) {
      for (const msg of history) {
        if (!msg || !msg.role || !msg.content) continue;
        const roleLabel = msg.role === 'user' ? 'User' : (msg.role === 'assistant' ? 'Assistant' : 'System');
        prompt += `${roleLabel}: ${msg.content}\n`;
      }
    }
    prompt += `User: ${message}\nAssistant:`;

    // Helper to call a specific model with small retry/backoff
    const callModel = async (modelName) => {
      const url = `https://api-inference.huggingface.co/models/${modelName}`;
      const maxAttempts = 3;
      let response;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          response = await axios.post(
            url,
            {
              inputs: prompt,
              parameters: {
                max_new_tokens: 256,
                temperature: 0.7,
                top_p: 0.9,
                repetition_penalty: 1.1,
                return_full_text: false
              },
              options: {
                wait_for_model: true
              }
            },
            {
              headers: {
                Authorization: `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
              },
              timeout: 45000
            }
          );
          return response;
        } catch (err) {
          const status = err?.response?.status;
          if (attempt < maxAttempts && (status === 429 || status === 503)) {
            const delayMs = 500 * Math.pow(2, attempt - 1);
            await new Promise((r) => setTimeout(r, delayMs));
            continue;
          }
          throw err;
        }
      }
    };

    let response;
    try {
      response = await callModel(HF_MODEL);
      console.log(`[Chat] Used HF model: ${HF_MODEL}`);
    } catch (primaryErr) {
      const status = primaryErr?.response?.status;
      // Fallback to a commonly accessible model on 404
      if (status === 404) {
        const fallbackModel = 'google/gemma-2b-it';
        try {
          response = await callModel(fallbackModel);
          console.warn(`[Chat] Primary model '${HF_MODEL}' returned 404. Fell back to '${fallbackModel}'.`);
        } catch (fallbackErr) {
          // Throw original 404 to preserve accurate diagnostics
          throw primaryErr;
        }
      } else {
        throw primaryErr;
      }
    }

    // Hugging Face responses can be an array with { generated_text }
    let botText = '';
    const data = response.data;
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      // generated_text may include the prompt + completion; try to extract the assistant part after the last 'Assistant:'
      const full = String(data[0].generated_text);
      const split = full.split('Assistant:');
      botText = split.length > 1 ? split[split.length - 1].trim() : full.trim();
    } else if (data && data.generated_text) {
      botText = String(data.generated_text).trim();
    } else {
      botText = 'Sorry, I could not generate a response right now.';
    }

    // Return a shape similar to OpenAI's chat message
    res.json({ role: 'assistant', content: botText });
  } catch (error) {
    // Enhanced diagnostics (do not leak secrets)
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error('Error with Hugging Face API:', {
      status,
      data,
      message: error?.message
    });
    // Bubble up a concise message to client
    const friendly = status === 404
      ? 'Model not found or inaccessible. Check HF_MODEL or token permissions.'
      : status === 401
      ? 'Unauthorized with Hugging Face. Check HUGGINGFACE_API_KEY.'
      : status === 503
      ? 'Model is loading. Please retry in a moment.'
      : 'Failed to get response from chatbot.';
    res.status(500).json({ message: friendly });
  }
});

module.exports = { chatWithBot };
