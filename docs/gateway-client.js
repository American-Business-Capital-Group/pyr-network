// Prometheon SI gateway client — shared, identical across the platform
// standalone sites (prometheon.si, lampasagents.si, pyr.network).
// One live backend (the chat gateway on the pilot host, port 8811);
// each site is a front door to the same service. No forked logic.
//
// Discovery: probes GET /health on each candidate in
// window.PROMETHEON_GATEWAYS (loaded from gateway-config.js) and uses the
// first that answers service:"prometheon-gateway". If none answers, the
// UI shows an explicit gateway-unreachable state — it never fakes data.
(function () {
  "use strict";

  var TOKEN_KEY = "prometheon_token";
  var base = null;
  var discovering = null;

  function candidates() {
    if (window.PROMETHEON_GATEWAYS && window.PROMETHEON_GATEWAYS.length) {
      return window.PROMETHEON_GATEWAYS.slice();
    }
    return ["http://100.89.231.37:8811"];
  }

  function fetchWithTimeout(url, options, ms) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, ms || 2500);
    var opts = Object.assign({}, options || {}, { signal: ctrl.signal });
    return fetch(url, opts).finally(function () { clearTimeout(timer); });
  }

  function discover() {
    if (base) return Promise.resolve(base);
    if (discovering) return discovering;
    var list = candidates();
    var chain = Promise.reject(new Error("no candidates"));
    list.forEach(function (candidate) {
      chain = chain.catch(function () {
        return fetchWithTimeout(candidate + "/health", {}, 2500)
          .then(function (res) {
            if (!res.ok) throw new Error("health " + res.status);
            return res.json();
          })
          .then(function (data) {
            if (!data || data.service !== "prometheon-gateway") {
              throw new Error("unexpected health payload");
            }
            base = candidate;
            return base;
          });
      });
    });
    discovering = chain.catch(function () {
      discovering = null;
      throw new Error("gateway unreachable");
    });
    return discovering;
  }

  function getToken() {
    try { return localStorage.getItem(TOKEN_KEY); } catch (e) { return null; }
  }
  function setToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) { /* storage unavailable */ }
  }
  function isLoggedIn() { return !!getToken(); }

  function request(path, options) {
    return discover().then(function (b) {
      var opts = Object.assign({ headers: {} }, options || {});
      var token = getToken();
      if (token) opts.headers["Authorization"] = "Bearer " + token;
      if (opts.body && typeof opts.body !== "string") {
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(opts.body);
      }
      return fetchWithTimeout(b + path, opts, 60000).then(function (res) {
        return res.text().then(function (text) {
          var data = null;
          try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
          if (!res.ok) {
            var err = new Error((data && (data.detail || data.message)) || ("HTTP " + res.status));
            err.status = res.status;
            err.data = data;
            throw err;
          }
          return data;
        });
      });
    });
  }

  function login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: { email: email, password: password }
    }).then(function (data) {
      if (data && data.token) setToken(data.token);
      return data;
    });
  }

  function signup(email, password, name) {
    return request("/auth/signup", {
      method: "POST",
      body: { email: email, password: password, name: name || "" }
    }).then(function (data) {
      if (data && data.token) setToken(data.token);
      return data;
    });
  }

  function logout() { setToken(null); }
  function me() { return request("/auth/me", { method: "GET" }); }
  function health() { return request("/health", { method: "GET" }); }
  function catalog() { return request("/catalog", { method: "GET" }); }

  // Chat against one platform. The caller passes the platform literally so
  // each standalone site stays locked to its own platform. A conversation
  // is created lazily on first send so the gateway can register the run
  // with the Fence, per API_SPEC.md.
  var conversationId = null;
  function sendChat(args) {
    var platform = args.platform;
    var message = args.message;
    function post() {
      return request("/chat", {
        method: "POST",
        body: {
          conversation_id: conversationId,
          message: message,
          platform: platform,
          selection: { mode: "auto" }
        }
      });
    }
    if (conversationId) return post();
    return request("/conversations", {
      method: "POST",
      body: { platform: platform }
    }).then(function (conv) {
      conversationId = conv && conv.id ? conv.id : null;
      return post();
    }).catch(function () {
      // If conversation creation is unavailable, still attempt the chat
      // with no conversation id and let the gateway answer truthfully.
      return post();
    });
  }

  window.PrometheonGateway = {
    discover: discover,
    login: login,
    signup: signup,
    logout: logout,
    me: me,
    health: health,
    catalog: catalog,
    sendChat: sendChat,
    getToken: getToken,
    isLoggedIn: isLoggedIn,
    getBase: function () { return base; }
  };
})();
