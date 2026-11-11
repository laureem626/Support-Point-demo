import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NextsmsService {
  private readonly logger = new Logger(NextsmsService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async sendSms(
    phoneNumber: string,
    message: string,
    reference?: string,
  ): Promise<any> {
    const apiToken =
      this.configService.get<string>('NEXTSMS_API_TOKEN');

    const senderId =
      this.configService.get<string>('NEXTSMS_SENDER_ID');

    const apiUrl =
      this.configService.get<string>('NEXTSMS_API_URL');

    if (!apiToken || !senderId || !apiUrl) {
      throw new InternalServerErrorException(
        'NextSMS configuration is incomplete',
      );
    }

    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          apiUrl,
          {
            from: senderId,
            to: [normalizedPhone],
            text: message,
            ...(reference ? { reference } : {}),
          },
          {
            headers: {
              Authorization: `Bearer ${apiToken}`,
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: 15000,
          },
        ),
      );

      this.logger.log(
        `NextSMS request completed for reference: ${
          reference ?? 'not provided'
        }`,
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `NextSMS request failed: ${
          error.response?.data
            ? JSON.stringify(error.response.data)
            : error.message
        }`,
      );

      throw new InternalServerErrorException(
        'Unable to send SMS notification',
      );
    }
  }

  private normalizePhoneNumber(phoneNumber: string): string {
    const phone = phoneNumber.replace(/[\s-]/g, '');

    if (/^255\d{9}$/.test(phone)) {
      return phone;
    }

    if (/^0\d{9}$/.test(phone)) {
      return `255${phone.substring(1)}`;
    }

    if (/^\+255\d{9}$/.test(phone)) {
      return phone.substring(1);
    }

    throw new Error('Invalid Tanzanian phone number');
  }
}