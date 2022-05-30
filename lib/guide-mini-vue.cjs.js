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

function render(vnode, container) {
    // patch
    patch(vnode);
}
function patch(vnode, container) {
    // 处理 vue 组件
    processComponent(vnode);
    // 处理原生元素
    // processElement
}
//* 处理 vue 组件
function processComponent(vnode, container) {
    // 挂载组件
    mountComponent(vnode);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponent(instance);
    setupRenderEffect(instance);
}
function setupRenderEffect(instance, container) {
    // vnode tree
    const subtree = instance.render();
    // 根据 subtree 再调用 patch
    // vnode -> element -> mountElement
    patch(subtree);
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
            typeof rootContainer === 'string'
                ? document.getElementById(rootContainer)
                : rootContainer;
            render(vnode);
        },
    };
}

const h = createVNode;

exports.createApp = createApp;
exports.h = h;
