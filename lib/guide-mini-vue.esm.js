const targetMap = new Map();
//* 触发依赖
function runEffect(dep) {
    dep.forEach(e => {
        if (e.scheduler) {
            e.scheduler();
        }
        else {
            e.run();
        }
    });
}
function trigger(target, key) {
    const dep = targetMap.get(target).get(key);
    runEffect(dep);
}

function isObject(target) {
    return typeof target === 'object' && target !== null;
}

function isEvent(s) {
    return /^on[A-Z]/.test(s);
}
function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
function toHandlerKey(s) {
    return s ? `on${capitalize(s)}` : '';
}
function camelize(s) {
    return s.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
}

const reactiveHandler = {
    get: createGetter(),
    set: createSetter(),
};
const readonlyHandler = {
    get: createGetter(true),
    set: createSetter(true),
};
const shallowReadonlyHandler = {
    get: createGetter(true, true),
    set: createSetter(true),
};
function createGetter(isReadonly = false, isShallowReadonly = false) {
    return function get(target, key) {
        // 用于判断是否为 Reactive
        if (key === "__v__IS_REACTIVE" /* IS_REACTIVE */)
            return !isReadonly;
        if (key === "__v__IS_READONLY" /* IS_READONLY */)
            return isReadonly;
        if (key === "__v__IS_SHALLOW_READONLY" /* IS_SHALLOW_READONLY */)
            return isShallowReadonly;
        // 正常 GET
        const res = Reflect.get(target, key);
        // 如果是 shallowReadonly，既不需要深层次递归使内部各对象响应式，也不需要收集依赖
        if (isShallowReadonly)
            return res;
        // 如果访问的属性是对象，则递归内部对象使其成为响应式
        if (isObject(res))
            return isReadonly ? readonly(res) : reactive(res);
        return res;
    };
}
function createSetter(isReadonly = false) {
    return function set(target, key, value) {
        if (isReadonly) {
            console.warn(`${key.toString()} cannot be set`);
            return true;
        }
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}

//* reactive
function reactive(target) {
    return new Proxy(target, reactiveHandler);
}
//* readonly
function readonly(target) {
    return new Proxy(target, readonlyHandler);
}
//* shallowReactive
function shallowReadonly(target) {
    return new Proxy(target, shallowReadonlyHandler);
}

function initProps(instance, props = {}) {
    instance.props = shallowReadonly(props);
}

const getterMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
};
const publicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        if (getterMap.hasOwnProperty(key)) {
            return getterMap[key](instance);
        }
    },
};

function emit(instance, event, ...args) {
    const { props } = instance;
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initSlots(instance, children) {
    instance.slots = Array.isArray(children) ? children : [children];
    // const slots = {}
    // for (const key in children) {
    //   const value = children[key]
    //   slots[key] = Array.isArray(value) ? value : [value]
    // }
    // instance.slots = slots
}

let componentInstance = null;
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        setupState: {},
        type: vnode.type,
        proxy: new Proxy({}, {}),
        props: vnode.props ?? {},
        provides: parent?.provides ?? {},
        parent,
        emit: () => { },
        slots: [],
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    // 1.初始化 props
    initProps(instance, instance.vnode.props);
    // 2.初始化 slots
    initSlots(instance, instance.vnode.children);
    // 3.初始化有状态组件 ( 区别于函数组件 )
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.vnode.type;
    // 设置代理对象
    instance.proxy = new Proxy({ _: instance }, publicInstanceProxyHandlers);
    const { setup } = Component;
    if (typeof setup === 'function') {
        setComponentInstance(instance);
        const setupResult = setup(instance.props, {
            emit: instance.emit,
        });
        handleSetupResult(instance, setupResult);
        setComponentInstance(null);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
}
function setComponentInstance(instance) {
    componentInstance = instance;
}
function getComponentInstance() {
    return componentInstance;
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag: getShapeFlag(type),
    };
    // children
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ARRAY_CHILDREN */;
    }
    return vnode;
}
function createTextVnode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ELEMENT */
        : 2 /* STATEFUL_COMPONENT */;
}

function render(vnode, container) {
    // patch
    patch(vnode, container, null);
}
function patch(vnode, container, parent) {
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & 1 /* ELEMENT */) {
                // 处理原生元素
                processElement(vnode, container, parent);
            }
            else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                // 处理 vue 组件
                processComponent(vnode, container, parent);
            }
    }
}
//* Fragment
function processFragment(vnode, container, parent) {
    mountChildren(vnode.children, container, parent);
}
//* Text
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
//* 处理原生元素
function processElement(vnode, container, parent) {
    mountElement(vnode, container, parent);
}
function mountElement(vnode, container, parent) {
    const el = (vnode.el = document.createElement(vnode.type));
    // 设置子节点
    // string array
    const { children } = vnode;
    if (vnode.shapeFlag & 4 /* TEXT_CHILDREN */) {
        el.textContent = children;
    }
    else if (vnode.shapeFlag & 8 /* ARRAY_CHILDREN */) {
        mountChildren(vnode.children, el, parent);
    }
    // 设置属性 props
    const { props } = vnode;
    for (const key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) {
            const val = props[key];
            if (isEvent(key)) {
                const event = key.slice(2).toLocaleLowerCase();
                el.addEventListener(event, val);
            }
            else {
                el.setAttribute(key, val);
            }
        }
    }
    container.append(el);
}
function mountChildren(children, container, parent) {
    children.forEach(child => patch(child, container, parent));
}
//* 处理 vue 组件
function processComponent(vnode, container, parent) {
    // 挂载组件
    mountComponent(vnode, container, parent);
}
function mountComponent(vnode, container, parent) {
    const instance = createComponentInstance(vnode, parent);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    // vnode tree
    const subtree = instance.render.call(proxy);
    // 根据 subtree 再调用 patch
    // vnode -> element -> mountElement
    patch(subtree, container, instance);
    vnode.el = subtree.el;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转换成 vnode，后续操作都会基于 vnode
            const vnode = createVNode(rootComponent);
            const _rootContainer = typeof rootContainer === 'string'
                ? document.querySelector(rootContainer)
                : rootContainer;
            render(vnode, _rootContainer);
        },
    };
}

const h = createVNode;

function renderSlots(slots, name) {
    // const slot = (slots as Record<string, any>)[name]
    // if (slot) return createVNode('div', {}, slot)
    return createVNode(Fragment, {}, slots);
}

function provide(key, value) {
    const currentInstance = getComponentInstance();
    if (currentInstance) {
        const { parent } = currentInstance;
        // 初始化时，将当前组件实例的 provides 的原型设置为父组件的 provides
        // 判断初始化的标准: currentInstance.provides 和 parent.provides 指向同一个对象
        if (currentInstance.provides === parent?.provides) {
            currentInstance.provides = Object.create(parent?.provides ?? {});
        }
        currentInstance.provides[key] = value;
    }
}
function inject(key, defaultVal) {
    const instance = getComponentInstance();
    if (!instance)
        return;
    const { parent } = instance;
    return (parent?.provides[key] ??
        (typeof defaultVal === 'function' ? defaultVal() : defaultVal));
}

export { createApp, createTextVnode, getComponentInstance, h, inject, provide, renderSlots };
