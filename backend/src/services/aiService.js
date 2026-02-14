const axios = require('axios');
const { SYSTEM_PROMPT, ANALYSIS_PROMPT_TEMPLATE } = require('../../../agents/smc-prompts');

class AIService {
    constructor() {
        this.provider = process.env.AI_PROVIDER || 'gemini'; // Default to Gemini
        this.apiKey = process.env.AI_API_KEY || process.env.GEMINI_AI_API_KEY;
        this.apiUrl = {
            openai: 'https://api.openai.com/v1/chat/completions',
            anthropic: 'https://api.anthropic.com/v1/messages',
            gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'
        };
    }

    async getAnalysis(symbol, timeframe, ohlcv) {
        if (!this.apiKey) {
            console.warn('AI_API_KEY not set. Returning mock signal.');
            return this.getMockSignal(symbol);
        }

        try {
            if (this.provider === 'openai') {
                return await this.callOpenAI(symbol, timeframe, ohlcv);
            } else if (this.provider === 'gemini') {
                return await this.callGemini(symbol, timeframe, ohlcv);
            } else {
                return await this.callClaude(symbol, timeframe, ohlcv);
            }
        } catch (error) {
            console.error('AI Service Error:', error.message);
            return null;
        }
    }

    async callGemini(symbol, timeframe, ohlcv) {
        const prompt = ANALYSIS_PROMPT_TEMPLATE(symbol, timeframe, ohlcv);

        try {
            const response = await axios.post(`${this.apiUrl.gemini}?key=${this.apiKey}`, {
                contents: [{
                    parts: [{
                        text: `SYSTEM: ${SYSTEM_PROMPT}\nUSER: ${prompt}\nPlease return ONLY valid JSON.`
                    }]
                }]
            });

            // Extract text and parse JSON
            const textResponse = response.data.candidates[0].content.parts[0].text;
            // Cleanup markdown code blocks if present
            const jsonString = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(jsonString);

        } catch (error) {
            console.error('Gemini API Error:', error.response?.data || error.message);
            return null;
        }
    }

    async callOpenAI(symbol, timeframe, ohlcv) {
        const prompt = ANALYSIS_PROMPT_TEMPLATE(symbol, timeframe, ohlcv);

        const response = await axios.post(this.apiUrl.openai, {
            model: "gpt-4-turbo-preview",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        }, {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
        });

        return JSON.parse(response.data.choices[0].message.content);
    }

    async callClaude(symbol, timeframe, ohlcv) {
        // Placeholder for future Claude migration
        console.log('Claude integration pending...');
        return this.getMockSignal(symbol);
    }

    getMockSignal(symbol) {
        // Fallback for development/testing without costs
        // Only 10% chance to signal to avoid spamming
        if (Math.random() > 0.9) {
            const price = 50000; // Mock
            return {
                signal: true,
                direction: Math.random() > 0.5 ? "LONG" : "SHORT",
                entry: price,
                sl: price * 0.99,
                tp1: price * 1.02,
                tp2: price * 1.05,
                confidence: 0.88,
                reasoning: "Mock SMC BOS detected"
            };
        }
        return { signal: false };
    }
}

module.exports = new AIService();
