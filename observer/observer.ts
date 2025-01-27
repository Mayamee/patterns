type Observer<T> = (data: T) => void;

type ObserverCollection<T> = Set<Observer<T>>;

interface IObservable<T> {
  subscribe: (cb: Observer<T>) => Subscription<T>;
  emit: (v: T) => void;
}

class Subscription<T> {
  constructor(
    private readonly observer: Observer<T>,
    private readonly collection: ObserverCollection<T>
  ) {}

  public unsubscribe = () => {
    this.collection.delete(this.observer);
  };
}

class Observable<T> implements IObservable<T> {
  private value: T;

  constructor(v: T) {
    this.value = v;
  }

  private observers: ObserverCollection<T> = new Set();

  public subscribe = (cb: Observer<T>): Subscription<T> => {
    this.observers.add(cb);

    return new Subscription(cb, this.observers);
  };

  public getValue = (): T => {
    return this.value;
  };

  public emit = (v: T): void => {
    this.value = v;
    this.observers.forEach((observer) => observer(v));
  };
}