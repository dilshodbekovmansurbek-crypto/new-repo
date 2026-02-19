
import telebot
from telebot import types

TOKEN = "8493236334:AAGTuYJG7uCK4hFl25mMP-_RsGCUXJsTlgo"

bot = telebot.TeleBot(TOKEN)

# START komandasi
@bot.message_handler(commands=['start'])
def start(message):
    markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
    
    web_app_button = types.KeyboardButton(
        text="🌐 Habit Web App",
        web_app=types.WebAppInfo("https://habit-webapp2.onrender.com")
    )
    
    markup.add(web_app_button)

    bot.send_message(
        message.chat.id,
        "👇 Habit Tracker Web App'ni ochish uchun tugmani bosing",
        reply_markup=markup
    )

# WebApp dan kelgan ma'lumotni qabul qilish
@bot.message_handler(content_types=['web_app_data'])
def web_app_data_handler(message):
    data = message.web_app_data.data
    
    bot.send_message(
        message.chat.id,
        f"Web App dan kelgan ma'lumot:\n{data}"
    )

bot.infinity_polling()
