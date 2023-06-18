import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import installer from '@ffmpeg-installer/ffmpeg';
import { createWriteStream, unlink } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

class Mp3Converter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path);
  }

  toMp3(input, output) {
    try {
      const outputPath = resolve(dirname(input), `${output}.mp3`);
      const inputPath = resolve(dirname(input), `${input}`)
      return new Promise((res, rej) => {
        ffmpeg(input)
          .inputOption('-t 30')
          .output(outputPath)
          .on('end', () => {
            unlink(input, (err) => {
              if (err) {
                console.log(`Ошибка ${err}`)
              }
            });
            res(outputPath);
          })
          .on('error', () => rej(err.message))
          .run()
      });
    } catch (e) {
      console.log('Ошибка во время конвертации oga в mp3')
    }
  }

  async saveVoiceMessage(url, filename) {
    try {
      const ogaPath = resolve(__dirname, '../../voices/', `${filename}.oga`);
      const ogaVoice = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
      });

      return new Promise((res) => {
        const stream = createWriteStream(ogaPath);
        ogaVoice.data.pipe(stream);
        stream.on('finish', () => res(ogaPath));
      })
    } catch (e) {
      console.log(`Ошибка во время сохранения mp3`)
    }

  }
};

export const mp3 = new Mp3Converter()