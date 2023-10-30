import { Controller } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * author : string;
 * title : string;
 * content : string;
 *
 */

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
}
