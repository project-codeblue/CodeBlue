import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  mode: process.env.MODE || 'development',
  kakaoApiKey: process.env.KAKAOMAP_REST_API_KEY,
  medicalOpenApiKey: process.env.MEDICAL_DATA_API_KEY,
  aiServerUrl: process.env.AI_SERVER_URL,
}));
