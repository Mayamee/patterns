export type Handler<TCtx> = (ctx: TCtx) => boolean;

export const makeChain = <TContext>(
  ...handlers: Handler<TContext>[]
): Handler<TContext> => {
  return (ctx) => {
    for (const handler of handlers) {
      if (handler(ctx)) {
        return true;
      }
    }
    return false;
  };
};