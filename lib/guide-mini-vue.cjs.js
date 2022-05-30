'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function createComponentInstance(vnode) {
    const component = { vnode, setupState: {}, type: vnode.type };
    return component;
}
function setupComponent(instance) {
    // 1.初始化 props
    // initProps()
    // 2.初始化 slots
    // initSlots()
    // 3.初始化有状态组件 ( 区别于函数组件 )
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.vnode.type;
    const { setup } = Component;
    if (typeof setup === 'function') {
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
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

function isObject(target) {
    return typeof target === 'object' && target !== null;
}

function render(vnode, container) {
    // patch
    patch(vnode, container);
}
function patch(vnode, container) {
    if (typeof vnode.type === 'string') {
        // 处理原生元素
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 处理 vue 组件
        processComponent(vnode, container);
    }
}
//* 处理原生元素
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type);
    // 设置子节点
    // string array
    const { children } = vnode;
    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        children.forEach(child => patch(child, el));
    }
    // 设置属性 props
    const { props } = vnode;
    for (const key in props) {
        if (Object.prototype.hasOwnProperty.call(props, key)) {
            const val = props[key];
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
//* 处理 vue 组件
function processComponent(vnode, container) {
    // 挂载组件
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    // vnode tree
    const subtree = instance.render();
    // 根据 subtree 再调用 patch
    // vnode -> element -> mountElement
    patch(subtree, container);
}

function createVNode(type, props, children) {
    const vnode = { type, props, children };
    return vnode;
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

exports.createApp = createApp;
exports.h = h;
