import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class FileNameEncodingInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const file = req.file as Express.Multer.File | undefined;

    if (file?.originalname) {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString(
        'utf-8',
      );
    }

    return next.handle();
  }
}
