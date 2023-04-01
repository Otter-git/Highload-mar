import { Body, Controller, Get, Header, Post } from '@nestjs/common';

import { IsNotEmpty } from 'class-validator';

const db = new Map();
let resCash = [];

export class CreateNewsDto {
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;
}

@Controller('news')
export class NewsController {
  @Get()
  async getNews() {
    return new Promise(resolve => {
      if (!db.has('genNews')) {
      const news = Object.keys([...Array(10)])
        .map(key => Number(key) + 1)
        .map(n => ({
          id: n,
          title: `Важная новость ${n}`,
          description: `Описание новости ${n}`,
          createdAt: Date.now()
        }))
        db.set('genNews', news);
        resCash = Array.from(db.values()).flat();
      }

      setTimeout(() => {
        resolve(resCash);
      }, 100)
    });
  }

  @Post()
  @Header('Cache-Control', 'none')
  create(@Body() peaceOfNews: CreateNewsDto) {
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Новость успешно создана', peaceOfNews);
        const item = { id: Math.ceil(Math.random() * 1000), ...peaceOfNews };
        db.set(item.id, item);
        resCash = Array.from(db.values()).flat();
        resolve(item);
      }, 100)
    });
  }
}
