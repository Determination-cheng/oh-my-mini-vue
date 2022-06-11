const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag: getShapeFlag(type),
        key: props?.key,
        component: null,
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

function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function toDisplayString(value) {
    return String(value);
}

function isString(s) {
    return typeof s === 'string';
}
function isText(node) {
    return node.type === 3 /* TEXT */ || node.type === 0 /* INTERPOLATION */;
}
const EMPTY_OBJECT = {};
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
function isSameVnode(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
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
    $props: (i) => i.props,
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
        next: null,
        proxy: new Proxy({}, {}),
        props: vnode.props ?? {},
        provides: parent?.provides ?? {},
        parent,
        emit: () => { },
        slots: [],
        isMounted: false,
        subtree: {},
        update: (() => { }),
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
    if (compiler && !Component.render) {
        if (Component.template) {
            Component.render = compiler(Component.template);
        }
    }
    instance.render = Component.render;
}
function setComponentInstance(instance) {
    componentInstance = instance;
}
function getComponentInstance() {
    return componentInstance;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldUpdateComponent(prevVnode, nextVnode) {
    const { props: prevProps } = prevVnode;
    const { props: nextProps } = nextVnode;
    for (const key in nextProps) {
        if (nextProps.hasOwnProperty(key)) {
            if (nextProps[key] !== prevProps[key]) {
                return true;
            }
        }
    }
    return false;
}

const queue = new Set();
let isFlushPending = false;
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    queue.add(job);
    flushQueue();
}
function flushQueue() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    queue.forEach(job => job());
    queue.clear();
    isFlushPending = false;
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchProps: hostPatchProps, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // patch
        patch(null, vnode, container, null, null);
    }
    function patch(n1, // old
    n2, // new
    container, parent, anchor) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ELEMENT */) {
                    // 处理原生元素
                    processElement(n1, n2, container, parent, anchor);
                }
                else if (shapeFlag & 2 /* STATEFUL_COMPONENT */) {
                    // 处理 vue 组件
                    processComponent(n1, n2, container, parent, anchor);
                }
        }
    }
    //* Fragment
    function processFragment(n1, n2, container, parent, anchor) {
        mountChildren(n2.children, container, parent, anchor);
    }
    //* Text
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    //* 处理原生元素
    function processElement(n1, n2, container, parent, anchor) {
        // 初始化
        if (!n1) {
            mountElement(n2, container, parent, anchor);
            return;
        }
        // 更新
        patchElement(n1, n2, container, parent, anchor);
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const el = (n2.el = n1.el);
        // 更新子节点
        patchChildren(n1, n2, el, parentComponent, anchor);
        // 更新参数
        const oldProps = n1.props ?? EMPTY_OBJECT;
        const newProps = n2.props ?? EMPTY_OBJECT;
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const shapeFlag = n2.shapeFlag;
        const c1 = n1.children;
        const c2 = n2.children;
        if (shapeFlag & 4 /* TEXT_CHILDREN */) {
            //* ? -> text
            if (prevShapeFlag & 8 /* ARRAY_CHILDREN */) {
                // 清空旧 children
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                // 设置 text
                hostSetElementText(container, c2);
            }
        }
        else {
            //* ? -> array
            if (prevShapeFlag & 4 /* TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // diff array
                patchKeyChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyChildren(c1, c2, container, parentComponent, anchor) {
        let i = 0;
        const l1 = c1.length;
        const l2 = c2.length;
        let e1 = l1 - 1;
        let e2 = l2 - 1;
        //* 左边对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break;
            }
            i++;
        }
        //* 右边对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVnode(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        //* 创建
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            //* 删除
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            //* 中间对比
            let s1 = i;
            let s2 = i;
            // 新元素中待被处理的虚拟节点数量
            const toBePatched = e2 - s2 + 1;
            // 在老数组中已经处理的虚拟节点数量
            let hasPatched = 0;
            // 新元素的坐标映射
            const newIndexMap = new Map();
            // 处理需要移动元素的数据结构
            const newIndexToOldIndexMap = Array.from(new Array(toBePatched), _ => 0);
            let hasMoved = false;
            let currentMaxNewIndex = 0;
            // 遍历新数组中间乱序部分，获取新元素的坐标映射
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                newIndexMap.set(nextChild.key, i);
            }
            // 遍历老数组
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                // 当新数组中待处理的虚拟节点都被处理完，就代表剩下的都是要删除的
                if (hasPatched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = newIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j < e2; j++) {
                        if (isSameVnode(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 当前老节点在新数组中不存在, 需要删除
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= currentMaxNewIndex) {
                        currentMaxNewIndex = newIndex;
                    }
                    else {
                        hasMoved = true;
                    }
                    // 如果是 0 则认为没有建立映射关系，意味着原来的不存在
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    hasPatched++;
                }
            }
            const increasingNewIndexSequence = hasMoved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                if (hasMoved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 移动位置
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps === newProps)
            return;
        //* 1.之前的值和现在的值不一样 —— 修改属性
        //* 2.新值为 undefined 或 null —— 删除
        //* 3.新属性无 —— 删除属性
        for (const key in newProps) {
            const prevProp = oldProps[key];
            const nextProp = newProps[key];
            if (prevProp !== nextProp) {
                hostPatchProps(el, key, prevProp, nextProp);
            }
        }
        if (oldProps !== EMPTY_OBJECT) {
            for (const key in oldProps) {
                if (!newProps.hasOwnProperty(key)) {
                    hostPatchProps(el, key, oldProps[key], null);
                }
            }
        }
    }
    function mountElement(vnode, container, parent, anchor) {
        //* 创建元素
        const el = hostCreateElement(vnode.type);
        vnode.el = el;
        // 设置子节点
        // string array
        const { children } = vnode;
        if (vnode.shapeFlag & 4 /* TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (vnode.shapeFlag & 8 /* ARRAY_CHILDREN */) {
            mountChildren(vnode.children, el, parent, anchor);
        }
        // 设置属性 props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            //* 处理属性
            hostPatchProps(el, key, null, val);
        }
        //* 将当前元素添加到容器上
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parent, anchor) {
        children.forEach(child => patch(null, child, container, parent, anchor));
    }
    //* 处理 vue 组件
    function processComponent(n1, n2, container, parent, anchor) {
        if (!n1) {
            // 挂载组件
            mountComponent(n2, container, parent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(vnode, container, parent, anchor) {
        const instance = createComponentInstance(vnode, parent);
        vnode.component = instance;
        setupComponent(instance);
        setupRenderEffect(instance, vnode, container, anchor);
    }
    function setupRenderEffect(instance, vnode, container, anchor) {
        instance.update = effect(() => {
            const { proxy } = instance;
            //* 初始化
            if (!instance.isMounted) {
                // vnode tree
                const subtree = (instance.subtree = instance.render.call(proxy, proxy));
                // 根据 subtree 再调用 patch
                // vnode -> element -> mountElement
                patch(null, subtree, container, instance, anchor);
                vnode.el = subtree.el;
                instance.isMounted = true;
                return;
            }
            //* 更新
            console.log('update');
            const { next, vnode: instanceVnode } = instance;
            if (next) {
                next.el = vnode.el;
                updateComponentPrerender(instance, next);
            }
            // vnode tree
            const subtree = instance.render.call(proxy, proxy);
            const prevSubtree = instance.subtree;
            patch(prevSubtree, subtree, container, instance, anchor);
        }, {
            scheduler() {
                console.log('update scheduler');
                queueJobs(instance.update);
            },
        });
    }
    function updateComponentPrerender(instance, nextVnode) {
        instance.vnode = nextVnode;
        instance.next = null;
        instance.props = nextVnode.props;
    }
    return {
        createApp: createAppAPI(render),
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProps(el, key, prevProp, newProp) {
    if (isEvent(key)) {
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, newProp);
    }
    else {
        if (newProp === undefined || newProp === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, newProp);
        }
    }
}
function insert(child, parent, anchor = null) {
    parent.insertBefore(child, anchor);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent)
        parent.removeChild(child);
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProps,
    insert,
    remove,
    setElementText,
});
function createApp(rootComponent) {
    return renderer.createApp(rootComponent);
}

var runtimeDOM = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    h: h,
    renderSlots: renderSlots,
    createTextVnode: createTextVnode,
    createElementVnode: createVNode,
    getComponentInstance: getComponentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    nextTick: nextTick,
    toDisplayString: toDisplayString,
    reactive: reactive,
    effect: effect,
    ref: ref,
    proxyRefs: proxyRefs
});

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVnode');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVnode',
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    getFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}) {`);
    push('return ');
    genNode(ast.codeGenNode, context);
    push('}');
    return { code: context.code };
}
function getFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    if (ast.helpers?.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
    }
    push('\n');
    push('return ');
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* TEXT */:
            genText(node, context);
            break;
        case 0 /* INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* SIMPLE_EXPRESS */:
            genExpression(node, context);
            break;
        case 2 /* ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    // genNode(children as any, context)
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
}
function genNodeList(nodes, context) {
    const { push } = context;
    nodes.forEach((node, i) => {
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    });
}
function genNullable(args) {
    return args.map(arg => arg ?? 'null');
}
function genText(node, context) {
    const { push } = context;
    push(`'${node?.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function genExpression(node, context) {
    const { push } = context;
    push(node.content);
}

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, ''));
}
function parseChildren(context, parentTag) {
    const nodes = [];
    while (!isEnd(context, parentTag)) {
        let node;
        const s = context.source;
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (s.startsWith('<')) {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, parentTag) {
    // 遇到结束标签时结束
    const s = context.source;
    // 没有结束标签
    if (parentTag && s.startsWith('</')) {
        const tag = s.match(/<\/([a-z]+)>/)?.[1];
        if (parentTag !== tag)
            throw new Error('should exist end tag');
    }
    if (parentTag && s.startsWith(`</${parentTag}`)) {
        context.source = context.source.replace(`</${parentTag}>`, '');
        return true;
    }
    // 当没有值的时候结束
    return !context.source;
}
function createRoot(children) {
    return { children, type: 4 /* ROOT */ };
}
function createParserContext(content) {
    return { source: content };
}
//* 解析插值
function parseInterpolation(context) {
    // {{message}}
    const DelimiterStart = '{{';
    const DelimiterEnd = '}}';
    const content = parseContextByDelimiter(context, DelimiterStart, DelimiterEnd);
    return {
        type: 0 /* INTERPOLATION */,
        content: {
            type: 1 /* SIMPLE_EXPRESS */,
            content,
        },
    };
}
//* 解析元素
function parseElement(context) {
    const element = parseTag(context);
    element.children = parseChildren(context, element.tag);
    return element;
}
//* 解析文本
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ['</', '{{'];
    endTokens.forEach(endToken => {
        const index = context.source.indexOf(endToken);
        if (index !== -1 && index < endIndex) {
            endIndex = index;
        }
    });
    const content = parseContextByLength(context, endIndex);
    return {
        type: 3 /* TEXT */,
        content,
    };
}
function getContent(context, DelimiterStart, DelimiterEnd) {
    const closeIndex = context.source.indexOf(DelimiterEnd, DelimiterStart.length);
    const content = context.source.slice(DelimiterStart.length, closeIndex).trim();
    return content;
}
function parseTag(context, length) {
    // 解析 tag
    const match = /^<\/?([a-z]+)/i.exec(context.source);
    const tag = match?.[1];
    // 删除处理完成的代码
    advanceByDelimiter(context, '<', '>'); // 删除开始标签
    // advanceByDelimiter(context, '<', '>') // 删除结束标签
    if (typeof length === 'number') {
        advanceByDelimiter(context, '<', '>'); // 删除结束标签
    }
    return {
        type: 2 /* ELEMENT */,
        tag,
    };
}
function parseContextByDelimiter(context, DelimiterStart, DelimiterEnd) {
    const content = getContent(context, DelimiterStart, DelimiterEnd);
    advanceByDelimiter(context, DelimiterStart, DelimiterEnd);
    return content;
}
function parseContextByLength(context, length) {
    // 1.截取
    const content = context.source.slice(0, length);
    // 2.推进
    advanceByLength(context, content.length);
    return content;
}
function advanceByDelimiter(context, DelimiterStart, DelimiterEnd) {
    const closeIndex = context.source.indexOf(DelimiterEnd, DelimiterStart.length);
    context.source = context.source.slice(closeIndex + DelimiterEnd.length);
}
function advanceByLength(context, length) {
    context.source = context.source.slice(length);
}

function transform(root, options) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createRootCodeGen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodeGen(root) {
    const child = root.children?.[0];
    if (child.type === 2 /* ELEMENT */) {
        root.codeGenNode = child.codeGenNode;
    }
    else {
        root.codeGenNode = root.children?.[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options?.nodeTransforms ?? [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
function traverseNode(node, context) {
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* ROOT */:
        case 2 /* ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    exitFns.reverse().forEach(fn => fn());
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function createVnodeCall(tag, props, children, context) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            // tag
            const vnodeTag = `"${node.tag}"`;
            // props
            let vnodeProps;
            // children
            const { children } = node;
            let vnodeChildren = children[0];
            node.codeGenNode = createVnodeCall(vnodeTag, vnodeProps, vnodeChildren, context);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function transformText(node) {
    if (node.type === 2 /* ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDOM);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVnode, createRenderer, createTextVnode, effect, getComponentInstance, h, inject, nextTick, provide, proxyRefs, reactive, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
