import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';

import { IsNotEmpty } from 'class-validator';
import Redis from 'ioredis';

const redis = new Redis({ host: 'gb-demo-redis-instance', port: 6379 });

export class CreateNewsDto {
  @IsNotEmpty()
  author: string;

  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  description: string;

  @IsNotEmpty()
  createdAt: number;
}

@Controller('news')
export class NewsController {
  @Get()
  async getNews() {
    return redis
    .hlen('news')
    .then((len) => {
      if (len === 0) {
        console.log('gen news');
        for (let i = 0; i < 5; i++) {
          const n: CreateNewsDto = {
            author: i.toString(),
            title: `Важная новость ${i}`,
            description: ((rand) =>
              [...Array(rand(1000))]
                .map(() =>
                  rand(10 ** 16)
                    .toString(36)
                    .substring(rand(10))
                )
                .join(' '))((max) => Math.ceil(Math.random() * max)),
            createdAt: Date.now(),
          };
          redis.hset('news', n.createdAt.toString(), JSON.stringify(n));
        }
      }
    })
    .then(() =>
      redis.hvals('news').then((data) => data.map((el) => JSON.parse(el)))
    );
  }

  @Get('topAuthors')
  async getTopAuthors() {
    return await redis.zrevrangebyscore(
      'topAuthors',
      100,
      0,
      'WITHSCORES',
      'LIMIT',
      0,
      10
    );
  }

  @Post()
  @Header('Cache-Control', 'none')
  async create(@Body() peaceOfNews: CreateNewsDto) {
    const news = { createdAt: Date.now(), ...peaceOfNews };

    redis.zadd('topAuthors', 'GT', 'INCR', 1, news.author);

    redis.hset('news', news.createdAt.toString(), JSON.stringify(news));
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Новость успешно создана', news);
        resolve(news);
      }, 100);
    });
  }

  @Get('test-redis/:searchtext')
  async testRedis(@Param('searchtext') searchtext: string) {
    console.log('searchtext', searchtext);
    redis.set('foo', searchtext);
    return await redis.get('foo');
  }
}
