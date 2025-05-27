function createDeferred(): {
  promise: Promise<unknown>;
  resolve: (value: unknown | PromiseLike<unknown>) => void;
  reject: (error?: unknown) => void;
} {
  let resolve: (value: unknown | PromiseLike<unknown>) => void;
  let reject: (error?: unknown) => void;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve: resolve!, reject: reject! };
}