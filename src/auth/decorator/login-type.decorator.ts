import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const LoginType = createParamDecorator(
    (data: any, context: ExecutionContext): number | undefined => {
        const req = context.switchToHttp().getRequest();
        const value = req.headers['x-login-type'];

        if(!value) return undefined;

        const parsed = Number(value);

        return Number.isNaN(parsed) ? undefined : parsed;
    }
);