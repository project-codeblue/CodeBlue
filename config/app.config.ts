import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mode: process.env.MODE || 'development',
  kakaoApiKey: process.env.KAKAOMAP_REST_API_KEY,
}));
