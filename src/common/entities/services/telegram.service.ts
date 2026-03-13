import { Injectable } from "@nestjs/common";
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {

    private bot: TelegramBot;

    constructor() {
        const token = process.env.TeLEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error('TeLEGRAM_BOT_TOKEN environment variable is not defined');
        }
        this.bot = new TelegramBot(token, { polling: true });
    }

    async sendMessage(chatId: string, message: string) {
        await this.bot.sendMessage(chatId, message);
    }
}