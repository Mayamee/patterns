/**
 * CQS - рекомендательный принцип к проектированию системы, который предлагает разделение
 * методов объекта на 2 группы
 * 1. Queries - запросы за данными, данные методы не должны изменять состояние системы (ключевых структур данных).
 * 2. Mutations (Commands/Mutators) - изменение состояния системы но не возвращение данных.
 * Ключевая цель CQS - сделать код более понятным и поддерживаемым, за счет явного разделения ответственности между операциями.
 *  */

type Status = "sold" | "on-sale";

interface ICartItem {
  id: string;
  name: string;
  price: number;
  status: Status;
}

interface ICartItemFactory {
  make(name: string, price: number, status: Status): ICartItem;
}

class CartItem implements ICartItem {
  constructor(
    public readonly id: string,
    public name: string,
    public price: number,
    public status: Status
  ) {}
}

class CartItemFactory {
  make(name: string, price: number, status: Status = "on-sale") {
    const id = String(~~Math.random() * 10);

    return new CartItem(id, name, price, status);
  }
}

class Cart {
  private cartState: ICartItem[];

  constructor(
    private readonly _cartItemFactory: ICartItemFactory,
    initialState: ICartItem[] = []
  ) {
    this.cartState = initialState;
  }

  public createCartItem(
    name: string,
    price: number,
    status: Status = "on-sale"
  ) {
    const cartItem = this._cartItemFactory.make(name, price, status);
    // Нарушение принципа CQS, метод не только запрашивает данные от несозданной фабрики
    this.cartState.push(cartItem);

    return cartItem;
  }

  public updateCartItemStatus(
    id: ICartItem["id"],
    newStatus: ICartItem["status"]
  ) {
    const currentCartItem = this.cartState.find((element) => element.id === id);

    if (!currentCartItem) {
      throw new Error("Элемент корзины с id " + id + " не найден");
    }

    currentCartItem.status = newStatus;

    // Нарушение CQS, возвращаем непонятные данные из мутатора
    return currentCartItem;
  }
}

class CQSCart {
  constructor(
    private readonly _cartItemFactory: ICartItemFactory,
    private cartState: ICartItem[] = []
  ) {}

  public createCartItem(
    name: string,
    price: number,
    status: Status = "on-sale"
  ) {
    // Валидно по CQS, нет избыточной мутации состояния корзины
    return this._cartItemFactory.make(name, price, status);
  }

  // Валидно по CQS, мутация без возврата данных
  public appendCartItem(cartItem: ICartItem) {
    this.cartState.push(cartItem);
  }

  // Валидно по CQS, нет возврата данных из команды
  public updateCartItemStatus(id: ICartItem["id"], newStatus: Status) {
    const currentCartItem = this.cartState.find((element) => element.id === id);

    if (!currentCartItem) {
      throw new Error("Элемент корзины с id " + id + " не найден");
    }

    currentCartItem.status = newStatus;
  }

  // Валидно по CQS, мутация без возврата данных
  public updateCartItemById(
    id: ICartItem["id"],
    mutate: (cartItem: ICartItem) => ICartItem
  ) {
    const currentCartItemIdx = this.cartState.findIndex(
      (element) => element.id === id
    );

    if (!currentCartItemIdx) {
      throw new Error("Элемент корзины с id " + id + " не найден");
    }

    this.cartState[currentCartItemIdx] = mutate(
      this.cartState[currentCartItemIdx]
    );
  }
}

/**
 * CQS можно нарушать, но когда это дает явное преимущество и удобство перевешивает
 * Например возврат статус кодов у мутаций
 */
