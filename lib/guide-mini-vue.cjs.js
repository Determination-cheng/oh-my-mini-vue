'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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

const h = createVNode;

function renderSlots(slots, name) {
    // const slot = (slots as Record<string, any>)[name]
    // if (slot) return createVNode('div', {}, slot)
    return createVNode(Fragment, {}, slots);
}

let activeEffect;
let shouldTrack = false;
class ReactiveEffect {
    fn;
    scheduler;
    onStop;
    isActive = true;
    deps = new Set();
    constructor(fn, scheduler, onStop) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.onStop = onStop;
    }
    run() {
        // 如果被停止之后调用，仅仅执行传入方法
        if (!this.isActive)
            return this.fn();
        // 正常收集依赖
        shouldTrack = true;
        activeEffect = this;
        const ret = this.fn();
        shouldTrack = false;
        return ret;
    }
    stop() {
        if (this.isActive) {
            this.deps.forEach(dep => {
                dep.delete(this);
            });
            this.isActive = false;
            if (this.onStop)
                this.onStop();
        }
    }
}
function effect(fn, options) {
    const _effect = new ReactiveEffect(fn, options?.scheduler, options?.onStop);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
const targetMap = new Map();
function trackEffect(dep) {
    // 从对象的角度出发，收集相关的 effect
    dep.add(activeEffect);
    // 如果只是单纯的 reactive 并没有 effect，此时 activeEffect 是 undefined
    // 因此这里需要做一下判断
    activeEffect?.deps.add(dep);
}
function track(target, key) {
    //! runner 在被停止之后再访问对象时不应该再被收集依赖，考虑如下场景
    //! obj.prop++ <=> obj.prop = obj.prop + 1
    if (!shouldTrack)
        return;
    // target -> key -> dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffect(dep);
}
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
        // 普通的 reactive 会收集依赖
        if (!isReadonly)
            track(target, key);
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

class Ref {
    _value;
    _rawValue; // 如果传入对象会被转换成 Proxy，但进行对比时我们希望使用原始值
    deps = new Set();
    __v_IS_REF = true;
    constructor(_value) {
        this._value = isObject(_value) ? reactive(_value) : _value;
        this._rawValue = _value;
    }
    get value() {
        // 依赖收集
        trackEffect(this.deps);
        return this._value;
    }
    set value(newVal) {
        // 如果新值和旧值相等则不进行赋值 ( 主要是不重新触发依赖 )
        if (Object.is(newVal, this._rawValue))
            return;
        this._value = isObject(newVal) ? reactive(newVal) : newVal;
        this._rawValue = newVal;
        // 触发依赖
        runEffect(this.deps);
    }
}
function ref(target) {
    return new Ref(target);
}
function isRef(target) {
    return !!target.__v_IS_REF;
}
function unref(target) {
    return isRef(target) ? target.value : target;
}
function proxyRefs(target) {
    return new Proxy(target, {
        get(target, key) {
            return unref(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value);
            }
            return Reflect.set(target, key, value);
        },
    });
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
        isMounted: false,
        subtree: {},
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
        instance.setupState = proxyRefs(setupResult);
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

function createAppAPI(render) {
    return function createApp(rootComponent) {
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
    };
}

function createRenderer(options) {
    const { createElement, patchProps, insert } = options;
    function render(vnode, container) {
        // patch
        patch(null, vnode, container, null);
    }
    function patch(n1, // old
    n2, // new
    container, parent) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    // 处理原生元素
                    processElement(n1, n2, container, parent);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 处理 vue 组件
                    processComponent(n1, n2, container, parent);
                }
        }
    }
    //* Fragment
    function processFragment(n1, n2, container, parent) {
        mountChildren(n2.children, container, parent);
    }
    //* Text
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    //* 处理原生元素
    function processElement(n1, n2, container, parent) {
        // 初始化
        if (!n1) {
            mountElement(n2, container, parent);
            return;
        }
        patchElement(n1, n2);
    }
    function patchElement(n1, n2, container) {
        console.log('n1', n1);
        console.log('n2', n2);
        // todo: deal with props
    }
    function mountElement(vnode, container, parent) {
        //* 创建元素
        const el = createElement(vnode.type);
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
                //* 处理属性
                patchProps(el, key, val);
            }
        }
        //* 将当前元素添加到容器上
        insert(el, container);
    }
    function mountChildren(children, container, parent) {
        children.forEach(child => patch(null, child, container, parent));
    }
    //* 处理 vue 组件
    function processComponent(n1, n2, container, parent) {
        // 挂载组件
        mountComponent(n2, container, parent);
    }
    function mountComponent(vnode, container, parent) {
        const instance = createComponentInstance(vnode, parent);
        setupComponent(instance);
        setupRenderEffect(instance, vnode, container);
    }
    function setupRenderEffect(instance, vnode, container) {
        effect(() => {
            const { proxy } = instance;
            //* 初始化
            if (!instance.isMounted) {
                // vnode tree
                const subtree = (instance.subtree = instance.render.call(proxy));
                // 根据 subtree 再调用 patch
                // vnode -> element -> mountElement
                patch(null, subtree, container, instance);
                vnode.el = subtree.el;
                instance.isMounted = true;
                return;
            }
            //* 更新
            console.log('update');
            // vnode tree
            const subtree = instance.render.call(proxy);
            const prevSubtree = instance.subtree;
            patch(prevSubtree, subtree, container, instance);
        });
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, val) {
    if (isEvent(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, container) {
    container.append(el);
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
});
function createApp(rootComponent) {
    return renderer.createApp(rootComponent);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVnode = createTextVnode;
exports.effect = effect;
exports.getComponentInstance = getComponentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.ref = ref;
exports.renderSlots = renderSlots;
