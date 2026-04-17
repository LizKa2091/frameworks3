const fs = require('fs');
const dotenv = require('dotenv');

function loadConfig() {
   // 1. Чтение из файла .env
   if (fs.existsSync('.env')) {
      dotenv.config();
   }

   // 2. Сбор данных с учетом приоритетов:
   // Приоритет: Аргументы командной строки > Переменные окружения > Файл .env
   const args = require('minimist')(process.argv.slice(2));

   const config = {
      port: args.port || process.env.PORT || 3000,
      mode: args.mode || process.env.APP_MODE || 'learning', // learning или production
      trustedOrigins: (args.origins || process.env.TRUSTED_ORIGINS || '').split(','),
   };

   // 3. Проверка корректности настроек
   validateConfig(config);

   return config;
}

function validateConfig(config) {
   const errors = [];

   if (isNaN(config.port) || config.port <= 0) {
      errors.push("Ошибка: Порт должен быть числом больше 0.");
   }

   if (!['learning', 'production'].includes(config.mode)) {
      errors.push("Ошибка: APP_MODE должен быть либо 'learning', либо 'production'.");
   }

   if (config.trustedOrigins.length === 0 || config.trustedOrigins[0] === '') {
      errors.push("Ошибка: TRUSTED_ORIGINS не заданы. Безопасность под угрозой.");
   }

   if (errors.length > 0) {
      console.error("=== ОСТАНОВКА ЗАПУСКА: НЕКОРРЕКТНЫЕ НАСТРОЙКИ ===");
      errors.forEach(err => console.error(`- ${err}`));
      process.exit(1); // Остановка запуска и понятная причина
   }
}

// Простая реализация minimist для обработки аргументов без лишних зависимостей
function minimist(args) {
   const res = {};
   args.forEach(arg => {
      if (arg.startsWith('--')) {
         const [key, value] = arg.slice(2).split('=');
         res[key] = value;
      }
   });
   return res;
}

module.exports = loadConfig();