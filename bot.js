const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const CAT_CHANNEL_ID = process.env.CHANNEL_ID; // Replace with the desired channel ID
const TIMEZONE_OFFSET = 3; // Replace with your desired timezone offset in hours

const userTimes = new Map();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome to the Cute Cat Bot! Please enter your preferred time in 24-hour format (e.g., 19:30 for 7:30 PM):');
});

bot.onText(/(\d{1,2}):(\d{2})/, (msg, match) => {
  const chatId = msg.chat.id;
  const hours = +match[1];
  const minutes = +match[2];

  if (hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
    bot.sendMessage(chatId, 'Invalid time format. Please enter a valid time in 24-hour format (e.g., 19:30 for 7:30 PM).');
  } else {
    const userTime = { hours, minutes };
    userTimes.set(chatId, userTime);
    bot.sendMessage(chatId, `Your preferred time has been set to ${hours}:${minutes}. You will receive a cute cat picture every day at this time.`);
  }
});

async function sendCatPicture(chatId) {
  try {
    const response = await axios.get(`https://api.telegram.org/bot${token}/getChatHistory?chat_id=${CAT_CHANNEL_ID}&limit=1`);
    if (response.data.result.messages[0].photo) {
      const fileId = response.data.result.messages[0].photo[0].file_id;
      bot.sendPhoto(chatId, fileId);
    } else {
      bot.sendMessage(chatId, 'Sorry, no cat picture is available at the moment. Please try again later.');
    }
  } catch (error) {
    console.error('Error while fetching cat picture:', error);
  }
}

function checkAndSendCatPictures() {
  const currentTime = new Date();
  currentTime.setHours(currentTime.getHours() + TIMEZONE_OFFSET);

  for (const [chatId, userTime] of userTimes.entries()) {
    if (currentTime.getHours() === userTime.hours && currentTime.getMinutes() === userTime.minutes) {
      sendCatPicture(chatId);
    }
  }
}

setInterval(checkAndSendCatPictures, 60 * 1000); //