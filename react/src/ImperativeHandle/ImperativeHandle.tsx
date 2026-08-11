import {
  forwardRef,
  ReactNode,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

type Handlers = {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
};

type HandlersGetter = () => Handlers;

type HandlersRef = {
  current: Handlers | undefined;
};

type ChildProps = {
  onRender: (handlersGetter: HandlersGetter) => void;
};

type ChildImperativeProps = {};

const Child = (props: ChildProps) => {
  const [state, setState] = useState(0);

  // Создаем контроллер замыкаем необходимые данные и отправляем через callback
  props.onRender(() => ({
    increment: () => setState((prev) => prev + 1),
    decrement: () => setState((prev) => prev - 1),
    reset: () => setState(0),
    set: (value: number) => setState(value),
  }));

  console.log("[Child] Rendered with state:", state);

  return <div>[Child] Current State: {state}</div>;
};

// Смысл в том что получаемые методы контроллера имеют постоянную ссылку
// Работает это потому что так работает деструктуризация
const ChildAutoMemo = (props: ChildProps) => {
  const [{ value, getController }, _setState] = useState(() => ({
    value: 0,
    getController: () => ({
      increment: () =>
        _setState((prev) => ({ ...prev, value: prev.value + 1 })),
      decrement: () =>
        _setState((prev) => ({ ...prev, value: prev.value - 1 })),
      reset: () => _setState((prev) => ({ ...prev, value: 0 })),
      set: (value: number) => _setState((prev) => ({ ...prev, value })),
    }),
  }));

  // @ts-ignore
  window.autoMemoController = getController();

  // Создаем контроллер замыкаем необходимые данные и отправляем через callback
  props.onRender(getController);

  console.log("[Child-Memo] Rendered with state:", value);

  return <div>[Child-Memo] Current State: {value}</div>;
};

const ChildImperative = forwardRef<Handlers | undefined, ChildImperativeProps>(
  (_props, ref) => {
    const [state, setState] = useState(0);

    useImperativeHandle(ref, () => ({
      increment: () => setState((prev) => prev + 1),
      decrement: () => setState((prev) => prev - 1),
      reset: () => setState(0),
      set: (value: number) => setState(value),
    }));

    console.log("[ChildImperative] Rendered with state:", state);

    return <div>[ChildImperative] Current State: {state}</div>;
  }
);

const ControlPanel = ({
  controllerRef,
  title,
  getAdditionalController,
}: {
  controllerRef: HandlersRef;
  title: string;
  getAdditionalController?: (controller: HandlersRef) => ReactNode;
}) => {
  //! Warn это не считает актуально, а зайдет в содержимое current и перепривяжет ссылку на значение в нём
  // const controller = controllerRef.current;
  //? Info Для актуального считывания нужно передать ссылку на объект который не будет перезатираться...
  // TODO разобраться тут почему так
  /*
   * Ответ тебе спустя 2 года, если я правильно понимаю тут ты сразу считал ссылку на контроллер, который тут появится только после инициализации Child, тк. ControlPanel инициализируется раньше то в current поле будет undefined, в свою очередь
   * если тут работать с исходным объектом не заходя в current то там появится попозже нужная ссылка на контроллер
   * Этот компонент тупо раньше рендерится чем Child
  */

  console.log(`[ControlPanel] ${title} controllerRef.current:`, controllerRef.current);


  return (
    <div>
      <div>{title}</div>
      <div>
        <button onClick={() => controllerRef.current?.increment()}>
          Increment
        </button>
        <button onClick={() => controllerRef.current?.decrement()}>
          Decrement
        </button>
        <button onClick={() => controllerRef.current?.reset()}>Reset</button>
        {getAdditionalController?.(controllerRef)}
      </div>
    </div>
  );
};

const ChildControlPanelAdditional = ({
  controllerRef,
  getController,
}: {
  controllerRef: HandlersRef;
  getController: () => Handlers | undefined;
}) => {
  const [val, setVal] = useState<number>(0);

  return (
    <div>
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(+e.target.value)}
      />
      {/* Важно обеспечить прямую доставку прямо в обработчик, это можно сделать двумя способами */}
      <button onClick={() => controllerRef.current?.set(val)}>
        Set By Remutable object
      </button>
      <button onClick={() => getController()?.set(val)}>
        Set By Fn closure
      </button>
    </div>
  );
};

const Parent = () => {
  // Реф-Мосты для связи компонентов с панелями управления
  const childRef = useRef<Handlers | undefined>(undefined);
  const childImperativeRef = useRef<Handlers | undefined>(undefined);
  const childAutoMemoRef = useRef<Handlers | undefined>(undefined);

  const renderAdditionalController = (controllerRef: HandlersRef) => {
    return (
      <ChildControlPanelAdditional
        // Вариант передачи через объект
        controllerRef={controllerRef}
        // Вариант передачи через замыкание
        getController={() => controllerRef.current}
      />
    );
  };

  return (
    <div>
      <ControlPanel
        title="Child Control Panel"
        controllerRef={childRef}
        getAdditionalController={renderAdditionalController}
      />
      <ControlPanel
        title="Child Imperative Control Panel"
        controllerRef={childImperativeRef}
      />
      <ControlPanel
        title="Child Auto Memo Control Panel"
        controllerRef={childAutoMemoRef}
      />
      <div>
        <ul>
          <li>
            {/* Несколько child это естественно не будет поддерживать, но можно сделать мультиконтроллер с авторегистрацией компонентов */}
            <Child
              onRender={(getHandlers: HandlersGetter) => {
                childRef.current = getHandlers();
              }}
            />
          </li>
          <li>
            <ChildImperative ref={childImperativeRef} />
          </li>
          <li>
            <ChildAutoMemo
              onRender={(getHandlers: HandlersGetter) => {
                childAutoMemoRef.current = getHandlers();
              }}
            />
          </li>
        </ul>
      </div>
    </div>
  );
};

export const ImperativeHandle = () => {
  return (
    <div>
      <div>Imperative Handlers</div>
      <Parent />
    </div>
  );
};
