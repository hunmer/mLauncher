var APP_VERSION = 'v0.0.1';
// const UPDATE_SCRIPT_URL = 'https://gitee.com/neysummer2000/VideoManager/raw/main/';

var g_localKey = 'ms_';
var g_localKey_default = 'ms_'
var g_cache = {
    zIndex: 4000,
    debug: false,
    folderPreset: {}, // 创建文件夹缓存
}

// plugin触发事件
function _callEvent(){

}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}

function obj_From_key(obj, k){
    let type = typeof(obj)
    if(type == 'undefined') return {}
    return isObject(obj) ? obj : {[k]: obj}
}

function arr_forEach(arr, cb, ret = {}){
    arr.forEach((item, i) => {
        let [k, v] = cb(item, i)
        ret[k] = v
    })
    return ret
}

function getAvailbleRect(rect1, rect2) {
    let { width, height, left, top } = rect1
    if (left + width > rect2.width) {
        left = rect2.width - width
    } else
    if (left < rect2.left) {
        left = rect2.left
    }
    if (top + height > rect2.height) {
        top = rect2.height - height
    } else
    if (top < rect2.top) {
        top = rect2.top
    }
    return { width, height, left, top }
}

function obj_isEqual(obj1, obj2) {
  const props1 = Object.getOwnPropertyNames(obj1);
  const props2 = Object.getOwnPropertyNames(obj2);

  if (props1.length !== props2.length) {
    return false;
  }

  for (let i = 0; i < props1.length; i++) {
    const propName = props1[i];

    if (typeof obj1[propName] === "object") {
      if (!isEqual(obj1[propName], obj2[propName])) {
        return false;
      }
    } else if (obj1[propName] !== obj2[propName]) {
      return false;
    }
  }

  return true;
}

function assignInstance(inst, obj) {
    if (obj.init) {
        obj.init.apply(inst)
        delete obj.init
    }
    Object.assign(inst, obj)
}

function flattenArray(arr) {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            result = result.concat(flattenArray(arr[i]));
        } else {
            result.push(arr[i]);
        }
    }
    return result;
}

function getDateRange(type = 'today', rTime = false) {
    var start, end
    let date = new Date()
    let setTime = t => start = new Date(date.getTime() + t)
    switch (type) {
        case 'today':
            setTime(0)
            break
        case 'yestaday':
            setTime(0 - 86400000)
            end = new Date(new Date(start).setHours(0, 0, 0, 0))
            break
        case 'last7day':
            setTime(0 - 86400000 * 6)
            break
        case 'last30day':
            setTime(0 - 86400000 * 29)
            break
        case 'thismonth':
            setTime(0 - (date.getDate() - 1) * 86400000)
            break
        case 'lastmonth':
            let year = date.getFullYear()
            let mon = date.getMonth() - 1
            start = new Date(year, mon, 1);
            end = new Date(new Date(start).setDate(new Date(year, mon, 0).getDate() + 1));
            break
    }
    if (!end) end = date
    if (rTime) {
        start = start.getTime()
        end = end.getTime()
    }
    return { start, end }
}

function urlMatchs(str, format) {
    let arr1 = str.split('/')
    let arr2 = format.split('/')
    let ret = {}
    let match
    if (arr1.length == arr2.length) {
        arr1.forEach((k1, i1) => {
            let k2 = arr2[i1]
            if (k2.startsWith('{') && k2.endsWith('}')) {
                return ret[k2.substr(1, k2.length - 2)] = arr1[i1]
            }
            match = k1 == k2
            if (!match) return false
        })
    }
    if (match) return ret
}

function toURL(url) {
    if (url.startsWith('//')) url = 'https:' + url
    return url
}

function debug(...args) {
    if (g_cache.debug) console.log(...args)
}

function toVal(v, ...args) {
    return typeof(v) == 'function' ? v.apply(v, args) : v
}

function isObjEqual(a, b) {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) {
        return false;
    }
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
}

function getObjVals(obj, keys) {
    let r = {}
    keys.forEach(key => r[key] = obj[key])
    return r
}

function getParamsArray(arr, def) {
    if (arr == undefined) {
        return def;
    } else
    if (!Array.isArray(arr)) {
        return [arr];
    }
    return arr;
}

function setCssVar(k, v) {
    document.documentElement.style
        .setProperty(k, v);
}


function getCssVar(k) {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(k);
}

function trimEnd(s, search = ';') {
    if (s.substr(0 - search.length) == search) {
        return s.substr(0, s.length - 1)
    }
    return s
}

function colorToHex(colorArr) {
    let strHex = '#'
    for (var i = 0; i < colorArr.length; i++) {
        var hex = Number(colorArr[i]).toString(16);
        if (hex === "0") {
            hex += hex;
        }
        strHex += hex;
    }
    return strHex
}

function arr_join_range(args, join, start, end) {
    let max = args.length - 1
    if (end == undefined) end = max
    if (end > max) end = max
    if (start < 0) start = 0

    let ret = []
    for (let i = start; i <= max; i++) {
        ret.push(args[i])
    }
    return ret.join(join)
}


function replaceAll_once(str, search, replace, start = 0) {
    if (typeof(str) != 'string') return ''
    let cnt = 0
    while (true) {
        var i = str.indexOf(search, start);
        if (i == -1) break;
        start = i + search.length;

        let rep = typeof(replace) == 'function' ? replace(cnt++) : replace
        str = str.substr(0, i) + rep + str.substr(start, str.length - start);
        start += rep.length - search.length;
    }
    return str;
}



function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function getVal(v, def) {
    return !isEmpty(v) ? v : def
}

function get(...args) {
    return args.find(arg => {
        return arg !== false && arg !== undefined && arg != ''
    })
}

function getDefVal(a, b, c) {
    return a == c ? b : a
}

function OR(k, v, defV = '') {
    return k === true ? v : defV
}

function getObjVal(obj, k, def = '') {
    if (!isEmpty(k)) k = '.' + k

    try {
        let v = eval("obj" + k)
        return isEmpty(v) ? def : v
    } catch (e) {
        return def
    }
}

function setObjVal(obj, k, v) {
    if (typeof(v) == 'object') {
        v = JSON.stringify(v)
    } else
    if (typeof(v) == 'string') {
        v = '"' + v + '"'
    }
    eval(`obj.${k} = ${v};`)
    return obj
}

function toggleVideoPlay(video) {
    if (video.paused) {
        video.play()
    } else {
        video.pause()
    }
}

function replaceArr(arr, replace, search = '%') {
    let r = []
    arr.forEach(k => r.push(k.replace(search, replace)))
    return r
}


function toggleFullScreen() {
    if (!document.fullscreenElement && // alternative standard method
        !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { // current working methods
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        $(window).resize();
        return true;
    }
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
    $(window).resize();
    return false;
}

function inputFocus(ele) {
    ele.blur();
    ele.focus();
    var len = ele.value.length;
    if (document.selection) {
        var sel = ele.createTextRange();
        sel.moveStart('character', len);
        sel.collapse();
        sel.select();
    } else {
        ele.selectionStart = ele.selectionEnd = len;
    }
}

function parseFile(input) {
    var reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = function(e) {
        try {
            json = JSON.parse(this.result);
            importData(json);
        } catch (err) {
            alert('错误的json数据!');
        }
    }
}

function blobToBase64(blob) {
    return new Promise(reslove => {
        let reader = new window.FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function() {
            reslove(reader.result)
        }
    })
}

function renderSize(value) {
    if (null == value || value == '') {
        return "0 Bytes";
    }
    var unitArr = new Array("Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB");
    var index = 0;
    var srcsize = parseFloat(value);
    index = Math.floor(Math.log(srcsize) / Math.log(1024));
    var size = srcsize / Math.pow(1024, index);
    size = size.toFixed(2); //保留的小数位数
    return size + unitArr[index];
}

function importData(data, b_confirm = true) {
    var fun = (b = true) => {
        for (var key in data) {
            if (b) {
                s = data[key];
            } else {
                var old = JSON.parse(localStorage.getItem(key)) || {};
                s = JSON.stringify(Object.assign(old, JSON.parse(data[key])));
            }
            localStorage.setItem(key, s);
        }
        location.reload();
    }
    if (b_confirm) {
        confirm('<b>是否完全覆盖数据?</b>', {
            title: '导入数据',
            callback: (id) => {
                var b = id == 'ok';
                if (b) {
                    local_clearAll();
                }
                fun(b);
                return true;
            }
        });
    } else {
        fun();
    }
}

function copyObj(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function copyFn(obj) {
   if (obj == null) {
        return null
    }
    var result = Array.isArray(obj) ? [] : {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object') {
                result[key] = copyFn(obj[key]);  // 如果是对象，再次调用该方法自身
            } else {
                result[key] = obj[key];
            }
        }
    }
    return result;
}

function setHeight(selector, pb = '200px') {
    if (typeof(selector) == 'string') selector = $(selector);
    selector.css({
        'height': 'calc(100vh - ' + selector.offset().top + 'px)',
        paddingBottom: pb,
    });
}

function downloadData(blob, fileName) {
    if (typeof(blob) != 'blob') {
        blob = new Blob([blob]);
    }
    var eleLink = document.createElement('a');
    eleLink.download = fileName;
    eleLink.style.display = 'none';
    eleLink.href = URL.createObjectURL(blob);
    document.body.appendChild(eleLink);
    eleLink.click();
    document.body.removeChild(eleLink);
}


Date.prototype.format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

function popString(s, split) {
    return typeof(s) == 'string' && s.indexOf(split) != -1 ? s.split(split).pop() : '';
}

function getExtName(s) {
    return popString(s, '.')
}

function getNumber(s) {
    return s.replace(/[^0-9]/ig, '')
}

function getFilePath(s) {
    return s.replace(this.getFileName(s), '')
}

function getFileName(s, ext) {
    // I:\software\mCollecion\resources\app\renderer.js
    s = s.replaceAll('/', '\\')
    s = popString(s, '\\') || s
    if (ext === false && s.indexOf('.') != -1) {
        let ext = this.getExtName(s)
        s = s.substr(0, s.length - ext.length - 1)
    }
    return s
}

function getImgBase64(video, width, height) {
    return new Promise(function(resolve, reject) {
        let canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        canvas.toBlob(e => resolve(URL.createObjectURL(e)))
    });
}

function loadRes(files, callback, cache = true) {
    files = [...files]
    const next = () => {
        let url = files.shift()
        if(url == undefined) return callback && callback()

        let fileref
        let ext = popString(url, '.').toLowerCase()
        if (ext == "js") {
            if (!cache || !$('script[src="' + url + '"]').length) { // js已加载
                fileref = document.createElement('script');
                fileref.setAttribute("type", "text/javascript");
                fileref.setAttribute("src", url)
            }
        } else if (ext == "css") {
            if (!cache || !$('link[href="' + url + '"]').length) { // css已加载
                fileref = document.createElement("link");
                fileref.setAttribute("rel", "stylesheet");
                fileref.setAttribute("type", "text/css");
                fileref.setAttribute("href", url)
            }
        }
        if(fileref){
            document.getElementsByTagName("head")[0].appendChild(fileref).onload = () => next()
        }else{
            next()
        }
    }
    next()
}


function unescapeHTML(a) {
    a = "" + a;
    return a.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
}

function clearEventBubble(evt) {
    if (evt.stopPropagation) evt.stopPropagation();
    else evt.cancelBubble = true;
    if (evt.preventDefault) evt.preventDefault();
    else evt.returnValue = false
}


function isEmpty(s, trim = false) {
    if (s === null || typeof s === 'undefined') {
        return true;
    }

    if (typeof s === 'string') {
        return (trim ? s.trim() : s).length === 0;
    }

    return false;
}

function local_saveJson(key, data) {
    return local_set(key, data);
}

function local_readJson(key, defaul, db) {
    var r = local_get(key);
    return r === null ? defaul : JSON.parse(r);
}

function local_set(key, data, prefix = g_localKey) {
    if (window.localStorage) {
        if (typeof(data) == 'object') data = JSON.stringify(data)
        localStorage.setItem(prefix + key, data);
    }
}

function local_get(key, prefix = g_localKey) {
    if (window.localStorage) {
        return localStorage.getItem(prefix + key);
    }
}

function local_getList(prefix = g_localKey) {
    var res = [];
    for (k of Object.keys(localStorage)) {
        if (k.indexOf(prefix) == 0) {
            res.push(k);
        }
    }
    return res;
}

function replaceText(text, vars = []) {
    vars = toArr(vars)
    for (let [k, v] of Object.entries(vars)) {
        text = text.replace('%' + k, toVal(v));
    }
    return text
}


function local_getAll() {
    var d = {};
    for (var key of local_getList()) {
        d[key] = localStorage.getItem(key);
    }
    return d;
}

function local_clearAll() {
    for (var key of local_getList()) {
        localStorage.removeItem(key);
    }
}

function copyText(text, input) {
    var remove;
    if (!input) {
        remove = true;
        input = $('<input value="' + text + '" hidden>').appendTo('body')[0];
    }
    input.select();
    if (document.execCommand('copy')) {
        document.execCommand('copy');
    }
    remove && input.remove();
}

function toArr(arr) {
    return Array.isArray(arr) ? arr : [arr]
}

function showCopy(s) {
    prompt(s, {
        id: 'modal_copy',
        title: '复制文本',
        btns: [{
            id: 'copy',
            text: '复制',
            class: 'btn-primary',
        }],
        onBtnClick: (config, btn) => {
            if (btn.id == 'btn_copy') {
                copyText(s, $('#modal_copy textarea')[0]);
                toast('复制成功', 'alert-success');
                return false;
            }
        }
    })
}

function getTime(s, sh = _l(':'), sm = _l(':'), ss = _l(''), hour = false, msFixed = 2) {
    if (s == undefined) return ''

    s = Number(s);
    if (s < 0) return '';
    var h = 0,
        m = 0;
    if (s >= 3600) {
        h = parseInt(s / 3600);
        s %= 3600;
    }
    if (s >= 60) {
        m = parseInt(s / 60);
        s %= 60;
    }
    s = s.toFixed(msFixed)
    return (hour ? _s(h, sh) : _s2(h, sh)) + _s(m, sm) + (ss !== false ? _s(s, ss) : '');
}

function time_getRent(time) {
    if (!time) return '';
    var today = new Date();
    var s = (parseInt(today.getTime()) - time) / 1000;
    if (s >= 84000) {
        if (s >= 84000 * 30) {
            if (s >= 84000 * 365) {
                return getFormatedTime(4, time);
            }
            return getFormatedTime(2, time);
        }
        return parseInt(s / 86400) + '天前';
    }
    var s = '';
    if (today.getDate() != new Date(time).getDate()) {
        s = '昨天';
    }
    return s + getFormatedTime(0, time);
}

function getFormatedTime(i = 0, date = new Date()) {
    if (typeof(date) != 'object') date = new Date(parseInt(date));
    switch (i) {
        case 0:
            return _s(date.getHours()) + ':' + _s(date.getMinutes());
        case 1:
            return date.getMonth() + 1 + '/' + date.getDate() + ' ' + _s(date.getHours()) + ':' + _s(date.getMinutes());
        case 2:
            return date.getMonth() + 1 + '/' + date.getDate();
        case 3:
            return date.getFullYear() + '_' + (Number(date.getMonth()) + 1) + '_' + date.getDate();
        case 4:
            return date.getFullYear() + '/' + (Number(date.getMonth()) + 1) + '/' + date.getDate();

        case 5:
            return date.getFullYear() + '/' + (Number(date.getMonth()) + 1) + '/' + date.getDate() + ' ' + _s(date.getHours()) + ':' + _s(date.getMinutes());
    }
}

function getTime1(s, sh = _l('时'), sm = _l('分')) {
    s = Number(s);
    if (s >= 86400) {
        return parseInt(s / 86400) + _l('天');
    }
    var h = 0,
        m = 0;
    if (s >= 3600) {
        h = parseInt(s / 3600);
        s %= 3600;
    }
    if (s >= 60) {
        m = parseInt(s / 60);
        s %= 60;
    }
    return _s1(h, sh) + _s(m, sm);
}

function parseTime(s) {
    var r = {};
    s = Number(s);
    if (s >= 86400) {
        r.d = parseInt(s / 86400);
    }
    var h = 0,
        m = 0;
    if (s >= 3600) {
        r.h = parseInt(s / 3600);
        s %= 3600;
    }
    if (s >= 60) {
        r.m = parseInt(s / 60);
        s %= 60;
    }
    r.s = s;
    return r;
}

function getVal(value, defaultV) {
    return value === undefined || value == '' ? defaultV : value;
}

function randNum(min, max) {
    return parseInt(Math.random() * (max - min + 1) + min, 10);
}

function toTime(s) {
    var a = s.split(':');
    if (a.length == 1) return s;
    if (a.length == 1) return Number(s);
    if (a.length == 2) {
        a.unshift(0);
    }
    return a[0] * 3600 + a[1] * 60 + a[2] * 1;
}

function _l(s) {
    return s;
}

function _s1(s, j = '') {
    s = parseInt(s);
    return (s == 0 ? '' : (s < 10 ? '0' + s : s) + j);
}

function _s(i, j = '') {
    return (i < 10 ? '0' + i : i) + j;
}

function _s2(s, j = '') {
    s = parseInt(s);
    return (s <= 0 ? '' : s + j);
}

function insertStyle(cssText) {
    var head = document.getElementsByTagName("head")[0];
    var style = document.createElement("style");
    var rules = document.createTextNode(cssText);
    style.rel = "stylesheet"
    style.type = "text/css";
    if (style.styleSheet) {
        style.styleSheet.cssText = rules.nodeValue;
    } else {
        style.appendChild(rules);
    }
    head.appendChild(style);
    return style;
}

function getEle(opts, s = '', source) {
    if (typeof(opts) != 'object') opts = { action: opts };
    for (var key in opts) {
        s += '[data-' + key;
        if (opts[key] != '') {
            s += '="' + String(opts[key]) + '"';
        }
        s += ']';
    }
    if (!source) source = $
    return $(source.find(s));
}

function getParentAttr(dom, selector) {
    return getParent(dom, selector).attr(selector)
}

function getParentData(dom, selector) {
    dom = $(dom)
    for (let par of dom.parents()) {
        let v = $(par).data(selector)
        if (v != undefined) return v
    }
}


function getParent(dom, selector, method = 'parents') {
    dom = $(dom)
    let v = dom.attr(selector)
    if (v != undefined) return dom

    if (selector.startsWith('data-')) selector = '[' + selector + ']'
    return dom[method](selector)
}

function getChild(dom, selector) {
    return getParent(dom, selector, 'find')
}

function getChildAttr(dom, selector) {
    return getChild(dom, selector).attr(selector)
}

function set(dom, selector) {
    dom = $(dom)
    let v = dom.data(selector)
    if (v != undefined) return v
    return dom.parents('[' + selector + ']').attr(selector)
}


function getPrefixedEle(search, selector = '[data-action]', attr = 'action') {
    return $(selector).filter((i, dom) => (dom.dataset[attr] || '').startsWith(search))
}

function uniqueArr(arr) {
    return Array.from(new Set(arr));
}

function ipc_send(type, msg) {
    var data = {
        type: type,
        msg: msg
    }
    if (typeof(nodejs) != 'undefined') {
        nodejs.method(data); // ELECTRON
    } else {
        console.log(JSON.stringify(data));
    }
}

function isInputFocused() {
    return ['input', 'textarea'].includes(document.activeElement.nodeName.toLowerCase())
}



function toast(msg, style = 'bg-info', time = 3000) {
    g_toast.show('default', {
        text: msg,
        class: style,
        delay: time
    });
}

function replaceClass(dom, find, replace, apply = true) {
    if (dom.length) dom = dom[0]
    if (!dom.classList) return

    dom.classList.forEach(c => {
        for (let f of find.split(' ')) c.startsWith(f) && dom.classList.remove(c)
    })
    if (apply) {
        replace = replace.split(' ')
        if (replace.length) {
            for (let f of replace) dom.classList.add(f)
        }
    }
    return dom
}


function isScroll(el) {
    let elems = el ? [el] : [document.documentElement, document.body];
    let scrollX = false,
        scrollY = false;
    for (let i = 0; i < elems.length; i++) {
        let o = elems[i];
        // test horizontal
        let sl = o.scrollLeft;
        o.scrollLeft += (sl > 0) ? -1 : 1;
        o.scrollLeft !== sl && (scrollX = scrollX || true);
        o.scrollLeft = sl;
        // test vertical
        let st = o.scrollTop;
        o.scrollTop += (st > 0) ? -1 : 1;
        o.scrollTop !== st && (scrollY = scrollY || true);
        o.scrollTop = st;
    }
    // ret
    return {
        scrollX: scrollX,
        scrollY: scrollY
    };
}

function scrollY(ele, scrollTop = 0) {
    if (scrollTop == -1) scrollTop = ele.prop('scrollHeight')
    ele.animate({ scrollTop }, 500);
}

function cutString(s_text, s_start, s_end, i_start = 0, fill = false) {
    i_start = s_text.indexOf(s_start, i_start);
    if (i_start === -1) return '';
    i_start += s_start.length;
    i_end = s_text.indexOf(s_end, i_start);
    if (i_end === -1) {
        if (!fill) return '';
        i_end = s_text.length
    }
    return s_text.substr(i_start, i_end - i_start);
}

function cutString1(str, key1, key2) {
    var m = str.match(new RegExp(key1 + '(.*?)' + key2));
    return m ? m[1] : '';
}


function arr_equal(arr1, arr2) {
    return arr1.length == arr2.length && arr_include(arr1, arr2)
}

function arr_include(arr, all) {
    return arr.every(key => all.includes(key))
}

function arr_compare(arr1, arr2) {
    let removed = []
    arr1.filter(key1 => {
        let i = arr2.indexOf(key1)
        if (i == -1) { // 被移除
            removed.push(key1)
        } else {
            arr2.splice(i, 1) // 移除已存在的
        }
    })
    return {
        removed: removed,
        added: arr2
    }
}

function obj_compare(obj1, obj2) {
    obj1 = copyObj(obj1)
    obj2 = copyObj(obj2)
    let changed = []
    let removed = []
    for (let k in obj1) {
        if (obj2[k] != undefined) {
            if (JSON.stringify(obj1[k]) != JSON.stringify(obj2[k])) {
                changed.push(k)
            }
        } else {
            removed.push(k)
        }
    }
    return {
        removed,
        changed
    }
}

function urlToFile(url) {
    return decodeURI(url).replaceAll('%23', '#')
}

function fileToUrl(url) {
    return url.replaceAll('\\', '/').replaceAll('#', '%23')
    // return safeFileName(encodeURI(url.replaceAll('\\', '/')).replaceAll('#', '%23'))
}

function safePath(str) {
    return str
        .replaceAll('\\', '＼')
        .replaceAll('/', '／')
}

function safeFileName(str) {
    return str
        .replaceAll(':', '：')
        .replaceAll('*', '＊')
        .replaceAll('?', '？')
        .replaceAll('"', '＂')
        .replaceAll('<', '＜')
        .replaceAll('>', '＞')
        .replaceAll("|", "｜")
}

function formatText(text, vars){
    for(let [k, v] of Object.entries(vars)){
        text = text.replaceAll('%'+k+'%', toVal(v || ''))
    }
    return text
}

