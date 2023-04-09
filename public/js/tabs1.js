
class TabList {
    constructor(opts) {

        const self = this
        let {list, saveData, name} = opts
        g_tabs.list[name] = this

        list = toVal(list) || []
        this.data = new basedata({
			name,
        	list,
        	saveData,
            defaultList: [],
            primarykey: 'id',
			event: {},
            insertDefault() {
                return {
                    date: new Date().getTime(),
                }
            },
            refresh() {
                self.refresh()
            },
        })
        this.opts = opts
        // list.length && this.data.refresh() // 有数据的第一次刷新
    }

	// 获取标签页内容
    getContent(id){
    	return this.getEle(id)
    }

	// 获取标签页标签
    getButton(id){
    	return this.getEle(id, 'tab')
    }

    // 获取容器
    getContainer() {
        return this.container ??= $(this.opts.container)
    }

    setItems(data){
    	this.data.setData(data)
    }

    // 刷新
    refresh() {
        this.getContainer().html(this.getHTML())
        let active = this.getActive()
        active && this.setActive(active)
    }

    // 获取最后激活
    getActive(){
    	let index = this.data.search('active', true)
    	if(index){
    		let item = this.data.list[index]
	    	return this.data.getIndex(item)
    	}
    }

    // 获取tab按钮或者内容
    getEle(id, type = 'tab-content') {
        return this.getContainer().find(`[data-${type}="${id}"]`)
    }

    // 设置激活
    setActive(id, active = true) {
    	let lastActive = this.getActive()
		lastActive != undefined && this.data.removeVal(lastActive, 'active', false)
		this.data.setVal(id, 'active', true, false) // 不刷新显示，避免死循环

    	if(active){
	        let a = this.getEle(id, 'tab').find('a')
			a.length && a[0].click()
	        // this.getEle(id, 'tab-content').addClass('active show')
    	}
    }

    getSibling(i, id){
		id ??= this.getActive()
    	let tabs =  this.data.getIndexs()
    	let index = tabs.indexOf(id)
    	if(index != -1){
    		index += i
    		return tabs[Math.max(0, Math.min(tabs.length - 1, index))]
    	}
    }

    offsetActive(offset, id){
    	let tab = this.getSibling(offset, id)
    	if(tab != undefined) this.setActive(tab)
    }

    next(){
    	this.offsetActive(1)
    }

	prev(){
    	this.offsetActive(-1)
    }

    // 获取html
    getHTML() {
            let h_tabs = '',
                h_cons = ''
            // v.getTabIndex
            // this.opts.menu
            this.data.keysEntries((k, v) => {
                        let id = 'tabs-' + k
                        h_tabs += `
    		  <li class="nav-item" data-tab="${k}">
		        <a href="#${id}" class="nav-link" data-bs-toggle="tab">
		        	${v.icon ? `<i class="ti ti-${v.icon} me-1"></i>` : ''}${v.title  || this.opts.parseTab(k, v) || ''}
		        </a>
		      </li>
    		`
            h_cons += `
    		  <div class="tab-pane" id="${id}" data-tab-content="${k}">
		       	${v.html || this.opts.parseContent(k, v) || ''}
		      </div>
    		`
        })
        return `
    	<tablist class="card" data-name="${this.opts.name}">
    	  <div class="row w-full p-0 m-0">
			  <div class="card-header col-11">
			    <ul class="nav nav-tabs p-0 card-header-tabs ${this.opts.nowarp ? 'flex-nowrap scroll-x hideScroll' : ''}" data-bs-toggle="tabs">${h_tabs}</ul>
			  </div>
			  <div class="col-1 p-0 text-end">
			  	${g_tabler.build_dropdown({
			  		title: '...',
			  		items: [{
			  			title: '关闭全部',
			  			itemClass: 'p-0',
			  			action: 'tab_closeAll',
			  		}]
			  	})}
			  </div>
		 </div>
		  <div class="card-body">
		    <div class="tab-content">${h_cons}</div>
		  </div>
		</tablist>`
    }

    // 添加tab
    add(opts, active = false) {
        let tab = opts.id ??= guid()
        if (!isEmpty(tab) && this.data.exists(tab)) return
        this.data.set(tab, opts)
    	active && this.setActive(tab)
    	return tab
    }

    clone(tab){
    	let item = this.data.get(tab)
    	if(item){
    		return this.add(Object.assign({}, item, {tab: undefined}))
    	}
    }

    // 移除tab
    close(tab) {
    	let item = this.data.get(tab)
    	if(item){
			let tabs = this.data.getIndexs()
			let index = tabs.indexOf(tab)
    		if(this.callEvent('close', {tab, item}) !== false){
    			this.data.remove(tab)
            	if(tabs.length > 1){
            		this.setActive(tabs[index + (index == tabs.length - 1 ? -1 : 1)]) // 关闭标签后自动激活其他标签
            	}
    		}
    	}
    }

    clear(){
    	return this.data.reset()
    }

    callEvent(type, data){
    	return this.opts?.['event_'+type]?.(data)
    }

}

var g_tabs = {
	list: {},
	init(){
		$(() => {
		    const onEvent = function(ev) { 
		    	let { type, target } = ev
		        let name = this.dataset.name
		        if(name != undefined){
		        	let inst = g_tabs.getInst(name)
			        let tab = getParentAttr(target, 'data-tab')
			        if(type == 'show') inst.setActive(tab, false) // 点击显示tab触发内部事件
			        inst.callEvent(type, {tab, target})
		        }
		      
		     }
		    $(document)
		        .on('show.bs.tab', 'tablist', onEvent)
		        .on('shown.bs.tab', 'tablist', onEvent)
		        .on('hide.bs.tab', 'tablist', onEvent)

		    let actions = ['close', 'clone', 'closeAll'].map(k => 'tab_'+k)
			g_action.registerAction(actions, (dom, action) => {
	            let k = g_menu.key
	            let name = $(g_menu.target || dom).parents('tablist').data('name')
	            let inst = g_tabs.getInst(name)
	            g_menu.hideMenu('tab_item')
	            switch (actions.indexOf(action[0])) {
	                case 0:
	                    return inst.close(k)
	                case 1:
	                    return inst.clone(k)
	                case 2:
	                    return inst.clear()
	            }
	        })

	        g_menu.registerMenu({
	            name: 'tab_item',
	            selector: '.nav-item[data-tab]',
	            dataKey: 'data-tab',
	            items: [{
	                icon: 'x',
	                text: '关闭',
	                action: 'tab_close'
	            },{
	                icon: 'copy',
	                text: '复制',
	                action: 'clone'
	            }]
	        })

	        $(document).on('mousewheel', '.scroll-x', function(e){
	           this.scrollLeft += e.originalEvent.deltaY
	        })
		})
	},
	getInst(name){
		return this.list[name]
	},
}

g_tabs.init()
