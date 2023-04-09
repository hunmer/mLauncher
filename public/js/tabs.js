// tab 保存规则
// 点击左侧入口-> 设置规则函数 -> 如果存在相同规则的tab -> 激活tab 
//                                                  -> 新建tab带规则参数 -> tab数量=1 隐藏tab列表
class TabList {
    constructor(name, opts) {
        this.name = name
        this.opts = Object.assign({
            getTabIndex: () => 1,
            hideOneTab: true,
        }, opts)

        const onEvent = (method, e) => {
            let target = e.target.parentElement
            let tab = target.dataset.tab
            if (method == 'onShown') { // 展示
                this.currentTab = tab
                opts.saveData && this.tab_setValue(tab, 'last', new Date().getTime()) // 最后打开时间
                this.save()
            } else { // 移除
                delete this.currentTab
            }
            opts[method] && opts[method](tab, e)
        }

        // todo onSHOW old tab 参数
        $(`<div class="tablist h-full" data-tablist="${name}" >` + opts.html + '</div>').appendTo(opts.target)
            .on('show.bs.tab', e => onEvent('onShow', e))
            .on('shown.bs.tab', e => onEvent('onShown', e))
            .on('hide.bs.tab', e => onEvent('onHide', e))

        this.update()
        opts.saveData && setTimeout(() => {
            let max = [0, 0]
            let date
            this.entries((k, v) => { // 取最后打开的tab
                date = v.last || 0
                if (date > max[1]) max = [k, date]
            })
            date != undefined && this.tab_active(max[0])
        }, 200)

    }

    entries(callback) {
        for (let [k, v] of Object.entries(this.opts.items)) {
            if (callback(k, v) === false) return
        }
    }

    show(show = true) {
        let div = this.element().toggleClass('show', show)
        // div.siblings('.show').removeClass('show')
        return this
    }

    tab_hide() {
        this.show(false)
        return this
    }

    element() {
        return $(`[data-tablist="${this.name}"]`)
    }

    tab_setValue(key, k, v, update = false) {
        setObjVal(this.opts.items[key], k, v)
        this.save()
        update && this.tab_update(key)
    }

    tab_getValue(key) {
        if (key == undefined) key = this.currentTab
        return this.opts.items[key]
    }

    _parseTab(tab, item) {
        if (!item) item = this.opts.items[tab]
        return `<li class="nav-item" data-tab="${tab}" ${this.opts.dbAction ? `data-dbclick="${this.opts.dbAction}"` : ''}>
              <a href="#_tabs_${tab}" class="nav-link" data-bs-toggle="tab" aria-selected="false" role="tab">${this.opts.parseTab(tab, item)}</a>
            </li>`
    }

    // 获取指定类型的tabs
    tab_getTypes(type, val) {
        let r = []
        for (let [name, item] of Object.entries(this.opts.items)) {
            if (item.data.value && item.data.value.type == type) {
                if (val != undefined && item.data.value.value !== val) continue
                r.push(name)
            }
        }
        return r
    }
    
    _parseContent(tab, item) {
        if (!item) item = this.opts.items[tab]
        return `
         <div class="tab-pane h-full ${item.class || ''}" id="_tabs_${tab}" data-content="${tab}">
            ${ item.html || this.opts.parseContent(tab,item) || ''}
          </div>`;
    }

    // 更新tabs
    update() {
        let h = ''
        let h1 = ''
        let opts = this.opts
        let i = 0
        for (let tab of Object.keys(opts.items).sort((a, b) => {
                let a1 = opts.items[a].index || this.opts.getTabIndex(a) || 0
                let b1 = opts.items[b].index || this.opts.getTabIndex(b) || 0
                return a1 - b1
            })) {
            let item = opts.items[tab]
            h += this._parseTab(tab, item)
            i++
            if (!this.getContent(tab).length) { // content未初始化
                h1 += this._parseContent(tab, item)
            }
        }

        let div = this.element()
        div.find('.tab-tabs:eq(0)').toggleClass('hide1', opts.hideOneTab && i <= 1).
        find('ul').html(this.opts.header(h))
        h1 && div.find('.tab-content:eq(0)').append(h1)
        this.save()
    }

    // 更新单个tab状态
    tab_update(key) {
        // 初始化内容
        this.getTab(key).html(this._parseTab(key))
        this.getContent(key).html(this._parseContent(key))
        this.tab_active(key) // 触发点击
    }

    // 保存tab状态
    save() {
        this.opts.saveData && g_tabs.saveData('tabs_' + this.name, this.opts.items)
    }

    getOpts() {
        return this.opts
    }

    // 获取内容元素
    getContent(key) {
        if (!key) key = this.currentTab
        return this.element().find('[data-content="' + key + '"]')
    }

    // 获取tab元素
    getTab(key) {
        return this.element().find('[data-tab="' + key + '"]')
    }

    add(val, key, active = true) {
        if (!key) key = guid()
        this.opts.items[key] = Object.assign({

        }, val)
        this.update()
        active && this.tab_active(key)
        return key
    }

    tab_next(){
        let tabs = this.tab_tabs()
        let i = tabs.indexOf(this.currentTab) + 1
        if(i >= tabs.length) i = 0
        this.tab_active(tabs[i])
    }

    // 尝试添加标签
    try_add(func, vals = {}, update = false) {
        let find = this.tab_find(func)
        if (find == undefined) { // 规则不存在
            return this.add(vals)
        }

        if (update) { // 更新属性
            return this.add(vals, find[0])
        }

        this.tab_active(find[0])
        return find[0]
    }

    tab_find(func){
        return Object.entries(this.opts.items).find(func)
    }

    tab_findTab(value){
        let find = this.tab_find(([tab, item]) => item.value == value)
        if(find != undefined){
            return find[0]
        }
    }

    // 移除标签
    tab_remove(key) {
        if (!key) key = this.currentTab
        this.opts.onRemove && this.opts.onRemove({ tab: key })
        this.getContent(name, key).remove()
        this.getTab(name, key).remove()
        delete this.opts.items[key]
        this.update(name)

        // 默认激活最后一个tab
        let tabs = this.tab_tabs()
        tabs.length && this.tab_active(tabs.pop())
    }

    // 返回所有tab key
    tab_tabs() {
        return Object.keys(this.opts.items)
    }

    // 清空所有
    clear() {
        Object.keys(this.opts.items).forEach(name => {
            this.tab_remove(name)
        })
    }

    setItems(items) {
        this.clear()
        this.opts.items = items
        this.update()
    }

    // 激活tab
    tab_active(key) {
        let a = this.getTab(key).find('a')
        a.length && a[0].click()
    }

    tab_setActive(index){
        let list = this.tab_tabs()
        if(index == undefined) index = 0
        if(list.length > index) this.tab_active(list[index])
    }

    getCurrentTab() {
        // return this.element().find('[data-tab] a.active')
        return this.currentTab
    }

    getCurrentContent() {
        return this.getContent(this.getCurrentTab())
    }
}

var g_tabs = {

    init(funs) {
        Object.assign(this, funs)
        const self = this
        g_dropdown.register('tablist_opts', {
            position: 'top,end',
            offsetLeft: 5,
            dataKey: e => e.parents('[data-tablist]').attr('data-tablist'),
            onShow: function(e) {
                this.opts.list = {
                    edit: {
                        title: '关闭所有',
                        icon: 'x',
                        action: 'tablist_clear',
                    }
                }
            },
        })

        g_action.registerAction({
            tab_dbclose: dom => {
                dom = $(dom)
                self.method(dom.parents('[data-tablist]').attr('data-tablist'), 'tab_remove', dom.attr('data-tab'))
            },
            tablist_opts: dom => {
                g_dropdown.show('tablist_opts', dom)
            },
            tablist_clear: dom => {
                let name = g_dropdown.getValue('tablist_opts')
                self.method(name, 'clear')
                g_dropdown.hide('tablist_opts')
            }
        }).
        registerAction(['tab_close'], (dom, action) => {
            let k = g_menu.key
            let name = g_menu.target.parents('[data-tablist]').attr('data-tablist')
            switch (action[0]) {
                case 'tab_close':
                    self.method(name, 'tab_remove', k)
                    break
            }
            g_menu.hideMenu('tab_item')
        })

        g_menu.registerMenu({
            name: 'tab_item',
            selector: '[data-tab]',
            dataKey: 'data-tab',
            html: g_menu.buildItems([{
                icon: 'x',
                text: '关闭',
                action: 'tab_close'
            }])
        });
    },
    list: {},
    instance: {},

    getInstance(name) {
        return this.instance[name]
    },

    register(name, opts) {
        opts = Object.assign({
            saveData: false,
            items: g_tabs.getData ? g_tabs.getData(name) : {},
            html: `
            <div class="card bg-unset h-full">
                <div class="d-flex tab-tabs" style="height: 38px;">
                  <ul class="nav nav-tabs col" data-bs-toggle="tabs" role="tablist">
                  </ul>
                  <div class="col-auto">
                     ${opts.menu || `<a class="nav-link" data-action="tablist_opts"><i class="ti ti-dots"></i></a>`}
                  </div>
                 </div>
              <div class="card-body p-0"  style="height: calc(100% - 38px);">
                <div class="tab-content h-full">
                </div>
              </div>
            </div>`,
            header: h => `
            ${h}
           `,
            parseContent: (k, v) => v.content,
            parseTab: (k, v) => v.title,
        }, opts)

        this.list[name] = opts
        this.instance[name] = new TabList(name, opts)
        return this.instance[name]
    },

    tab_getActive(name) {
        return this.getInstance(name).getCurrentTab()
    },

    method(name, method, ...args) {
        let obj = this.instance[name]
        obj[method].apply(obj, args)
    },

    tab_init(name) {

    }

}