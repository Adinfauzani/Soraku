"use strict";
const electron = require("electron");
const WireValueType = {
  RAW: "RAW",
  HANDLER: "HANDLER"
};
const MessageType = {
  GET: "GET",
  SET: "SET",
  APPLY: "APPLY",
  CONSTRUCT: "CONSTRUCT",
  RELEASE: "RELEASE"
};
const proxyMarker = /* @__PURE__ */ Symbol("Abslink.proxy");
const releaseProxy = /* @__PURE__ */ Symbol("Abslink.releaseProxy");
const finalizer = /* @__PURE__ */ Symbol("Abslink.finalizer");
const throwMarker = /* @__PURE__ */ Symbol("Abslink.thrown");
const isObject = (val) => typeof val === "object" && val !== null || typeof val === "function";
const proxyTransferHandler = {
  canHandle: (val) => isObject(val) && proxyMarker in val,
  serialize(obj, ep) {
    const markerID = obj[proxyMarker];
    expose(obj, ep, markerID);
    return [markerID, []];
  },
  deserialize(markerID, ep) {
    return wrap$2(ep, markerID);
  }
};
const throwTransferHandler = {
  canHandle: (value) => isObject(value) && throwMarker in value,
  serialize({ value }) {
    let serialized;
    if (value instanceof Error) {
      serialized = {
        isError: true,
        value: {
          message: value.message,
          name: value.name,
          stack: value.stack
        }
      };
    } else {
      serialized = { isError: false, value };
    }
    return [serialized, []];
  },
  deserialize(serialized) {
    if (serialized.isError) {
      throw Object.assign(new Error(serialized.value.message), serialized.value);
    }
    throw serialized.value;
  }
};
const transferHandlers = /* @__PURE__ */ new Map([
  ["proxy", proxyTransferHandler],
  ["throw", throwTransferHandler]
]);
function filterPath(path, obj) {
  let parent = obj;
  const parentPath = path.slice(0, -1);
  for (const segment of parentPath) {
    if (Object.prototype.hasOwnProperty.call(parent, segment)) {
      parent = parent[segment];
    }
  }
  const lastSegment = path[path.length - 1];
  const RawValue = lastSegment ? parent[lastSegment] : parent;
  return { parent, RawValue, lastSegment };
}
function expose(obj, ep, rootMarkerID) {
  ep.on("message", function callback(data) {
    if (!data)
      return;
    const { id, type, path, markerID } = {
      path: [],
      ...data
    };
    if (markerID !== rootMarkerID)
      return;
    const argumentList = (data.argumentList ?? []).map((v) => fromWireValue(v, ep));
    let returnValue;
    try {
      const { parent, RawValue, lastSegment } = filterPath(path, obj);
      switch (type) {
        case MessageType.GET:
          returnValue = RawValue;
          break;
        case MessageType.SET:
          parent[lastSegment] = fromWireValue(data.value, ep);
          returnValue = true;
          break;
        case MessageType.APPLY:
          returnValue = RawValue.apply(parent, argumentList);
          break;
        case MessageType.CONSTRUCT:
          returnValue = new RawValue(...argumentList);
          break;
        case MessageType.RELEASE:
          returnValue = void 0;
          break;
        default:
          return;
      }
    } catch (value) {
      returnValue = { value, [throwMarker]: 0 };
    }
    Promise.resolve(returnValue).catch((value) => {
      return { value, [throwMarker]: 0 };
    }).then((returnValue2) => {
      if (type === MessageType.CONSTRUCT)
        returnValue2 = proxy(returnValue2);
      const [wireValue, transfer] = toWireValue(returnValue2, ep);
      ep.postMessage({ ...wireValue, id, markerID: rootMarkerID }, transfer);
      if (type === MessageType.RELEASE) {
        ep.off("message", callback);
        obj[finalizer]?.();
        ep.close?.();
      }
    }).catch((_) => {
      const [wireValue, transfer] = toWireValue({
        value: new TypeError("Unserializable return value"),
        [throwMarker]: 0
      }, ep);
      ep.postMessage({ ...wireValue, id, markerID: rootMarkerID }, transfer);
    });
  });
  return obj;
}
function wrap$2(endpoint, rootMarkerID) {
  const pendingListeners = /* @__PURE__ */ new Map();
  endpoint.on("message", (data) => {
    if (!data?.id) {
      return;
    }
    const resolver = pendingListeners.get(data.id);
    if (!resolver) {
      return;
    }
    try {
      resolver(data);
    } finally {
      pendingListeners.delete(data.id);
    }
  });
  return createProxy({ endpoint, pendingListeners, rootMarkerID });
}
function throwIfProxyReleased(isReleased) {
  if (isReleased) {
    throw new Error("Proxy has been released and is not useable");
  }
}
async function releaseEndpoint(epWithPendingListeners) {
  await requestResponseMessage(epWithPendingListeners, { type: MessageType.RELEASE });
  epWithPendingListeners.endpoint.close?.();
}
const proxyCounter = /* @__PURE__ */ new WeakMap();
const proxyFinalizers = "FinalizationRegistry" in globalThis && new FinalizationRegistry((epWithPendingListeners) => {
  const newCount = (proxyCounter.get(epWithPendingListeners) ?? 0) - 1;
  proxyCounter.set(epWithPendingListeners, newCount);
  if (newCount === 0) {
    releaseEndpoint(epWithPendingListeners).finally(() => {
      epWithPendingListeners.pendingListeners.clear();
    });
  }
});
function registerProxy(proxy2, epWithPendingListeners) {
  const newCount = (proxyCounter.get(epWithPendingListeners) ?? 0) + 1;
  proxyCounter.set(epWithPendingListeners, newCount);
  if (proxyFinalizers) {
    proxyFinalizers.register(proxy2, epWithPendingListeners, proxy2);
  }
}
function unregisterProxy(proxy2) {
  if (proxyFinalizers) {
    proxyFinalizers.unregister(proxy2);
  }
}
function createProxy(epWithPendingListeners, path = []) {
  let isProxyReleased = false;
  const propProxyCache = /* @__PURE__ */ new Map();
  const proxy2 = new Proxy(function() {
  }, {
    get(_target, prop) {
      throwIfProxyReleased(isProxyReleased);
      if (prop === releaseProxy) {
        return async () => {
          for (const subProxy of propProxyCache.values()) {
            subProxy[releaseProxy]();
          }
          propProxyCache.clear();
          unregisterProxy(proxy2);
          releaseEndpoint(epWithPendingListeners).finally(() => {
            epWithPendingListeners.pendingListeners.clear();
          });
          isProxyReleased = true;
        };
      }
      if (prop === "then") {
        if (path.length === 0) {
          return { then: () => proxy2 };
        }
        const r = requestResponseMessage(epWithPendingListeners, {
          type: MessageType.GET,
          path: path.map((p) => p.toString())
        }).then((v) => fromWireValue(v, epWithPendingListeners.endpoint));
        return r.then.bind(r);
      }
      const cachedProxy = propProxyCache.get(prop);
      if (cachedProxy) {
        return cachedProxy;
      }
      const propProxy = createProxy(epWithPendingListeners, [...path, prop]);
      propProxyCache.set(prop, propProxy);
      return propProxy;
    },
    set(_target, prop, rawValue) {
      throwIfProxyReleased(isProxyReleased);
      const [value, transfer] = toWireValue(rawValue, epWithPendingListeners.endpoint);
      return requestResponseMessage(epWithPendingListeners, {
        type: MessageType.SET,
        path: [...path, prop].map((p) => p.toString()),
        value
      }, transfer).then((v) => fromWireValue(v, epWithPendingListeners.endpoint));
    },
    apply(_target, _thisArg, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const last = path[path.length - 1];
      if (last === "bind") {
        return createProxy(epWithPendingListeners, path.slice(0, -1));
      }
      const [argumentList, transfer] = processArguments(rawArgumentList, epWithPendingListeners);
      return requestResponseMessage(epWithPendingListeners, {
        type: MessageType.APPLY,
        path: path.map((p) => p.toString()),
        argumentList
      }, transfer).then((v) => fromWireValue(v, epWithPendingListeners.endpoint));
    },
    construct(_target, rawArgumentList) {
      throwIfProxyReleased(isProxyReleased);
      const [argumentList, transfer] = processArguments(rawArgumentList, epWithPendingListeners);
      return requestResponseMessage(epWithPendingListeners, {
        type: MessageType.CONSTRUCT,
        path: path.map((p) => p.toString()),
        argumentList
      }, transfer).then((v) => fromWireValue(v, epWithPendingListeners.endpoint));
    }
  });
  registerProxy(proxy2, epWithPendingListeners);
  return proxy2;
}
const transferCache = /* @__PURE__ */ new WeakMap();
function processArguments(argumentList, epWithPendingListeners) {
  const wireValues = [];
  const transferables = [];
  for (const argument of argumentList) {
    const [wireValue, transfer] = toWireValue(argument, epWithPendingListeners.endpoint);
    wireValues.push(wireValue);
    transferables.push(...transfer);
  }
  return [wireValues, transferables];
}
function proxy(obj) {
  return Object.assign(obj, { [proxyMarker]: randomId() });
}
function toWireValue(value, ep) {
  for (const [name, handler] of transferHandlers) {
    if (handler.canHandle(value)) {
      const [serializedValue, transfer] = handler.serialize(value, ep);
      return [{
        type: WireValueType.HANDLER,
        name,
        value: serializedValue
      }, transfer];
    }
  }
  return [{
    type: WireValueType.RAW,
    value
  }, transferCache.get(value) ?? []];
}
function fromWireValue(value, ep) {
  switch (value.type) {
    case WireValueType.HANDLER:
      return transferHandlers.get(value.name).deserialize(value.value, ep);
    case WireValueType.RAW:
      return value.value;
  }
}
function requestResponseMessage(ep, msg, transfer) {
  return new Promise((resolve) => {
    const id = randomId();
    ep.pendingListeners.set(id, resolve);
    ep.endpoint.postMessage({ id, ...msg, markerID: ep.rootMarkerID }, transfer);
  });
}
const hex = [];
const alphabet = "0123456789abcdef";
for (let i = 0; i < 256; i++) {
  hex[i] = alphabet[i >> 4 & 15] + alphabet[i & 15];
}
let step = 0;
let buffer = "";
function randomId() {
  let i = 0;
  if (!buffer || step + 16 > 256 * 2) {
    for (buffer = "", step = 0; i < 256; ++i) {
      buffer += hex[Math.random() * 256 | 0];
    }
  }
  return buffer.substring(step, ++step + 16);
}
function createWrapper$1(channel, messageable) {
  const listeners = /* @__PURE__ */ new WeakMap();
  channel.start?.();
  messageable.start?.();
  return {
    on(event, listener) {
      const unwrapped = (event2, data) => listener(data);
      channel.on(event, unwrapped);
      listeners.set(listener, unwrapped);
    },
    off(event, listener) {
      const unwrapped = listeners.get(listener);
      channel.off(event, unwrapped);
      listeners.delete(listener);
    },
    postMessage(message, transfer) {
      messageable.postMessage("message", message, transfer);
    },
    close() {
      if (channel !== globalThis)
        channel.close?.();
      if (messageable !== globalThis)
        messageable.close?.();
    }
  };
}
function wrap$1(channel, messageable = channel) {
  return wrap$2(createWrapper$1(channel, messageable));
}
function createWrapper(channel, messageable) {
  const listeners = /* @__PURE__ */ new WeakMap();
  channel.start?.();
  messageable.start?.();
  return {
    on(event, listener) {
      const unwrapped = (event2) => listener(event2.data);
      if ("addEventListener" in channel) {
        channel.addEventListener(event, unwrapped);
      } else if ("addListener" in channel) {
        channel.addListener(event, unwrapped);
      } else {
        channel.on(event, unwrapped);
      }
      listeners.set(listener, unwrapped);
    },
    off(event, listener) {
      const unwrapped = listeners.get(listener);
      if ("removeEventListener" in channel) {
        channel.removeEventListener(event, unwrapped);
      } else if ("removeListener" in channel) {
        channel.removeListener(event, unwrapped);
      } else {
        channel.off(event, unwrapped);
      }
      listeners.delete(listener);
    },
    postMessage(message, transfer) {
      messageable.postMessage(message, transfer);
    },
    close() {
      if (channel !== globalThis)
        channel.close?.();
      if (messageable !== globalThis)
        messageable.close?.();
    }
  };
}
function wrap(channel, messageable = channel) {
  return wrap$2(createWrapper(channel, messageable));
}
electron.ipcRenderer.send("preload-done");
const version = electron.ipcRenderer.invoke("version");
const torrent = new Promise((resolve) => {
  electron.ipcRenderer.once("port", ({ ports }) => {
    if (!ports[0]) return;
    ports[0].start();
    resolve(wrap(ports[0]));
  });
});
const main = wrap$1(electron.ipcRenderer);
const native = {
  restart: () => main.restart(),
  openURL: (url) => main.openURL(url),
  share: async (data) => {
    if (!data) return;
    await navigator.clipboard.writeText(data.url ?? data.text ?? data.title);
  },
  minimise: () => main.minimise(),
  maximise: () => main.maximise(),
  focus: () => main.focus(),
  close: () => main.close(),
  setZoom: (scale) => main.setZoom(scale),
  openUIDevtools: () => electron.ipcRenderer.invoke("open-devtools").catch(() => {
  }),
  setHideToTray: (enabled) => main.setHideToTray(enabled),
  setAngle: (angle) => main.setAngle(angle),
  enableCORS: (urls) => main.enableCORS(urls),
  checkAvailableSpace: async () => await (await torrent).checkAvailableSpace(),
  checkIncomingConnections: async (port) => await (await torrent).checkIncomingConnections(port),
  updatePeerCounts: async (hashes) => await (await torrent).scrape(hashes),
  addTorrent: async (id, mediaID, episode, background) => await (await torrent).playTorrent(id, mediaID, episode, "1", background),
  deleteTorrents: async (hashes) => await (await torrent).deleteTorrents(hashes),
  rescanTorrents: async (hashes) => await (await torrent).rescanTorrents(hashes),
  library: async () => await (await torrent).library(),
  torrentInfo: async (hash) => await (await torrent).torrentInfo(hash),
  peerInfo: async (hash) => await (await torrent).peerInfo(hash),
  fileInfo: async (hash) => await (await torrent).fileInfo(hash),
  trackers: async (hash) => await (await torrent).trackers(hash),
  protocolStatus: async (hash) => await (await torrent).protocolStatus(hash),
  cachedTorrents: async () => await (await torrent).cached(),
  activeTorrents: async () => await (await torrent).activeTorrents(),
  updateSettings: (settings) => main.updateSettings(settings),
  selectDownload: async () => await main.selectDownload(),
  setMediaSession: (metadata, mediaId) => main.setMediaSession(metadata, mediaId),
  setPositionState: (state, paused) => main.setPositionState(state, paused),
  setPlayBackState: (paused) => main.setPlayBackState(paused),
  downloadProgress: (percent) => main.setDownloadProgress(percent),
  subtitles: async (hash, id, cb) => await (await torrent).attachments.subtitle(hash, id, proxy(cb)),
  errors: async (cb) => {
    await main.getLogs();
  },
  navigate: async (cb) => {
    electron.ipcRenderer.on("navigate", (_e, data) => cb(data));
  },
  updateAndRestart: () => main.restart(),
  updateReady: async () => {
  },
  checkUpdate: async () => {
  },
  updateProgress: async () => {
  },
  isApp: true,
  version: () => version
};
try {
  electron.contextBridge.exposeInMainWorld("native", native);
} catch (error) {
  console.error(error);
}
