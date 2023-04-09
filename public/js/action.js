var g_action = {
    list: {
        openFile(dom){
            nodejs.files.openFile(dom.dataset.file)
        }
    },
    hover: {},
    clearTimeout(action){
        if(this.hover[action]){
            clearTimeout(this.hover[action])
            delete this.hover[action]
        }
    },
    init: function() {
        const self = this
        let doAction = (dom, action, ev) => {
            if (dom.classList.contains('disabled')) return;
            self.do(dom, action, ev)
        }

        $(document)
            .on('show.bs.dropdown', function(ev) {
                let dom = ev.target
                doAction(dom, dom.dataset.dropdown_show, ev)
            })
            .on('hide.bs.dropdown', function(ev) {
                let dom = ev.target
                doAction(dom, dom.dataset.dropdown_hide, ev)
            })
            .on('mouseenter', '[data-hover]', function(ev) {
                let action = this.dataset.hover
                self.clearTimeout(action)
                self.hover[action] = this.hoverTimer = setTimeout(() => doAction(this, action, ev), this.dataset.hovertime || 0)
            })
            .on('mouseleave', '[data-out]', function(ev) {
                self.clearTimeout(this.dataset.hover || this.dataset.outfor)
                doAction(this, this.dataset.out, ev);
            })
            .on('click', '[data-url]', function(ev) {
                ipc_send('url', this.dataset.url)
            })
            .on('click', '[data-action]', function(ev) {
                doAction(this, this.dataset.action, ev);
            })
            .on('mousedown', '[data-mousedown]', function(ev) {
                if(ev.which == 1){ // 左键
                    doAction(this, this.dataset.mousedown, ev);
                }
            })
            .on('mouseup', '[data-mouseup]', function(ev) {
                if(ev.which == 1){ // 左键
                    doAction(this, this.dataset.mouseup, ev);
                }
            })
            .on('dblclick', '[data-dbclick]', function(ev) {
                doAction(this, this.dataset.dbclick, ev);
            })
            .on('change', '[data-change]', function(ev) {
                doAction(this, this.dataset.change, ev);
            })
            .on('input', '[data-input]', function(ev) {
                doAction(this, this.dataset.input, ev);
            })
            .on('focus', '[data-focus]', function(ev) {
                doAction(this, this.dataset.focus, ev);
            })
            .on('blur', '[data-blur]', function(ev) {
                doAction(this, this.dataset.blur, ev);
            })
            .on('keydown', '[data-keydown]', function(ev) {
                doAction(this, this.dataset.keydown, ev);
            })
            .on('keyup', '[data-keyup]', function(ev) {
                doAction(this, this.dataset.keyup, ev);
            })
            .on('contextmenu', '[data-contenx]', function(ev) {
                doAction(this, this.dataset.contenx, ev);
                clearEventBubble(ev);
            })
            .on('keydown',  e => { // 回车键会触发焦点的action
                if (e.keyCode == 13) {
                    let active = document.activeElement
                    let action = active.dataset.action
                    if (!isEmpty(action)) {
                        active.click()
                        clearEventBubble(e);
                    }
                }
            })

    },
    registerAction: function(name, callback) {
        let isArr = Array.isArray(name)
        if (typeof(name) == 'object' && !isArr) {
            Object.assign(this.list, name)
            return this
        }

        if (!isArr) name = [name];
        for (var alisa of name) this.list[alisa] = callback;
        return this
    },

    do(dom, action, ev) {
        // input 不关闭
        // if (!dom || !dom.nodeName == 'INPUT' && typeof(bootstrap) != 'undefined') bootstrap.Dropdown.clearMenus()
        var action = (action || '').split(',');
        if (this.list[action[0]]) {
            return this.list[action[0]](dom, action, ev);
        }

        switch (action[0]) {
            case 'resetData':
                confirm('你确定要重置数据吗', {
                    callback: btn => {
                        local_clearAll();
                        location.reload();
                    }
                })
                break;
        }
    }

}

g_action.init()


function doAction(action, dom, e) {
    g_action.do(dom, action, e)
}