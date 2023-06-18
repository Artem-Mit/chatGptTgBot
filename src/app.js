import dotenv from 'dotenv';
dotenv.config();
import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import { mp3 } from './utils/Mp3Converter.js';
import { openAi } from './utils/OpenAi.js';
import {unlink} from 'fs';

const bot = new Telegraf(process.env.TG_API_KEY);

const newSession = {
  messages: [],
}

bot.use(session());

bot.command('new', async (ctx) => {
  ctx.session = newSession;
  await ctx.reply('Жду вашего голосового сообщения')
})

bot.command('start', async (ctx) => {
  const messageId = ctx.message.message_id;
  ctx.session = newSession;
  await ctx.reply(`Привет, ${ctx.from.first_name}. Задай свой вопрос (запиши голосовое) :)`, { reply_to_message_id: messageId })
})

bot.on(message('text'), async (ctx) => {
  try {
    const messageId = ctx.message.message_id;
    await ctx.reply(`Привет, ${ctx.from.first_name}. Задай свой вопрос (запиши голосовое) :)`, { reply_to_message_id: messageId })
  } catch (e) {
    console.log(`Ошибка текстового сообщения: ${e}`)
  }
});

bot.on(message('voice'), async (ctx) => {
  ctx.session ??= newSession;
  try {
    await ctx.reply(code('Обрабатываю информацию и жду ответ от сервера'));
    const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
    const userId = String(ctx.message.from.id);
    const ogaVoice = await mp3.saveVoiceMessage(link.href, userId);
    const mp3Voice = await mp3.toMp3(ogaVoice, userId);
    const text = await openAi.convertToText(mp3Voice);
    await ctx.reply(code(`Ваш запрос чату: ${text}`))
    ctx.session.messages.push({role: openAi.roles.USER, content: text});
    const gptAnswer = await openAi.sendReqToGpt(ctx.session.messages);
    ctx.session.messages.push({role: openAi.roles.ASSISTANT, content: gptAnswer.content});
    await ctx.reply(gptAnswer.content)
    unlink(mp3Voice, (err) => err && console.log(`Ошибка удаления файла mp3 после ответа: ${err}`))
  } catch (e) {
    console.log(`Ошибка голосового сообщения: ${e}`)
  }
});

bot.on(message('text'), async (ctx) => {
  ctx.session ??= newSession;
  try {
    await ctx.reply(code('Обрабатываю информацию и жду ответ от сервера'));
    await ctx.reply(code(`Ваш запрос чату: ${ctx.message.text}`))
    ctx.session.messages.push({role: openAi.roles.USER, content: ctx.message.text});
    const gptAnswer = await openAi.sendReqToGpt(ctx.session.messages);
    ctx.session.messages.push({role: openAi.roles.ASSISTANT, content: gptAnswer.content});
    await ctx.reply(gptAnswer.content)
  } catch (e) {
    console.log(`Ошибка голосового сообщения: ${e}`)
  }
});

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));