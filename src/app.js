const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('./config');

const app = express();

// 1. Защитные заголовки (Security Headers)
// Снижаем риски встраивания (XSS) и управляем кэшированием
app.use(helmet({
   contentSecurityPolicy: config.mode === 'production', // Строже в бою
   noSniff: true // Запрет MIME-sniffing
}));

// 2. Разрешение запросов только от доверенных источников (CORS)
const corsOptions = {
   origin: function (origin, callback) {
      // В учебном режиме разрешаем запросы без origin (например, через curl)
      if (!origin && config.mode === 'learning') return callback(null, true);
      
      if (config.trustedOrigins.indexOf(origin) !== -1) {
         callback(null, true);
      } else {
         callback(new Error(`Доступ запрещен для источника: ${origin}`));
      }
   }
};
app.use(cors(corsOptions));

// 3. Ограничение частоты запросов (Rate Limiting)
const generalLimiter = rateLimit({
   windowMs: 15 * 60 * 1000, // 15 минут
   limit: config.mode === 'production' ? 100 : 1000, // В бою строже
   message: { error: "Слишком много запросов. Попробуйте позже." }
});

const createLimiter = rateLimit({
   windowMs: 1 * 60 * 1000, // 1 минута
   limit: 5, // Только 5 созданий в минуту
   message: { error: "Вы создаете элементы слишком часто." }
});

// Применяем общий лимит
app.use(generalLimiter);

// 4. Маршруты чтения и создания
app.get('/data', (req, res) => {
   res.json({ message: "Данные успешно прочитаны", mode: config.mode });
});

app.post('/data', createLimiter, (req, res) => {
   res.status(201).json({ message: "Элемент создан" });
});

// Обработка ошибок для логов
app.use((err, req, res, next) => {
   if (config.mode === 'learning') {
      console.error(err.stack);
      res.status(500).send(`Ошибка сервера: ${err.message}`);
   } 
   else {
      res.status(500).send('Внутренняя ошибка сервера');
   }
});

app.listen(config.port, () => {
   console.log(`Служба запущена в режиме [${config.mode}] на порту ${config.port}`);
});