import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Authorization = createParamDecorator(
  (data: any, context: ExecutionContext) => {
    const res = context.switchToHttp().getRequest();

    return res.headers['authorization'];
  },
);
