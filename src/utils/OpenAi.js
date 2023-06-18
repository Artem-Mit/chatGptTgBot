import dotenv from 'dotenv';
dotenv.config();
import { Configuration, OpenAIApi } from 'openai';
import { createReadStream } from 'fs';

class OpenAi {
  roles = {
    USER: 'user',
    ASSISTANT: 'assistant',
  }
  constructor(key){
    const configuration = new Configuration({
      apiKey: key,
    });
     this.openai = new OpenAIApi(configuration);
  }

  async sendReqToGpt(messages) {
    try {
      const response = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages
      })
      return response.data.choices[0].message;
    } catch (error) {
      console.log(`Ошибка при обработке текста чатом: ${error.message}`)
    }
  }

  async convertToText(filepath) {
    try {
      const response = await this.openai.createTranscription(
        createReadStream(filepath),
        'whisper-1',
      )
      return response.data.text
    } catch (e) {
      console.log(`Ошибка во время конвертирования войса в текст: ${e.message}`)
    }
  }
}

export const openAi = new OpenAi(process.env.OPENAI_KEY)