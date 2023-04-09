var g_tabler = {

    bind_all() {

    },
    init() {
        $(document).
        on('click', '.form-videocheck', function(e) {
            let input = this.querySelector('.form-videocheck-input')
            input.checked = !input.checked
            clearEventBubble(e)
        }).
        on('click', '[data-bs-dropdown]', function(e) {
            let dropdown = this.dataset.bsDropdown
            // data-bs-auto-close
            let rect = this.getBoundingClientRect()
            let div = $('#' + dropdown).find('.dropdown-menu')
            div.css({
                display: 'block',
                position: 'fixed',
                zIndex: 999,
                left: rect.x - div.width(),
                top: rect.top - (div.height() - rect.height) / 2,
            })
        })
        // $(this.bind_all());
        // .on('click', 'a[data-bs-toggle]', function(e){
        //     let action = this.dataset.action_toggle
        //     console.log(action)
        // })

        // let error = console.error
        // console.error = msg => alert(msg, { title: '错误', type: 'danger' })
    },

    build_dropdown(data){
        let h = ''
        for(let v of data.items){
            h += v ? `<a class="dropdown-item ${data.itemClass || ''}" data-action="${v.action}">${v.title}</a>` : '<div class="dropdown-divider"></div>'
        }
        return data.title ? `<div class="dropdown">
          <a class="btn dropdown-toggle" data-bs-toggle="dropdown">${data.title}</a>
          <div class="dropdown-menu" ${data.menuClass || ''}>${h}</div></div>` : h
    },

    build_icons(data) {
        let h = ''
        for (let v of data) h += `<a alt="${v.title || ''}" class="me-2 ${v.classes || ''}" href="#" data-action="${v.action}"><i class="ti ti-${v.icon}"></i></a>`
        return h
    },
    build_dropdownItems(data) {
        let h = ''
        let buildItem = ({ title, action, classes }) => `<a class="${classes || ''}" href="#" data-action="${action}">${title}</a>`
        let parseItem = (v, classes = '') => {
            let r = {}
            if (v == 'add') {
                r = { title: '添加', icon: 'plus' }
            } else
            if (v == 'delete') {
                r = { title: '删除', icon: 'trash', classes: 'text-danger' }
            } else
            if (v == 'refresh') {
                r = { title: '刷新', icon: 'refresh' }
            } else
            if (v == 'edit') {
                r = { title: '编辑', icon: 'edit' }
            } else
            if (v == 'reset') {
                r = { title: '清空', icon: 'recycle' }
            }
            if (r.classes) {
                r.classes = r.classes + ' ' + classes
            }
            return Object.assign({
                classes,
                action: typeof(v) == 'string' ? data.id + '_' + v : '',
            }, r)
        }
        for (let v of data.actions) {
            if (Array.isArray(v)) {
                h += `
                <div class="dropdown">
                    <a href="#" class="btn-action dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <i class="ti ti-dots-vertical"></i>
                    </a>
                    <div class="dropdown-menu dropdown-menu-end">
                        ${(() => {
                            let h1 = '';
                            v.forEach(k => h1 += buildItem(parseItem(k, 'dropdown-item')))
                            return h1
                        })()}
                    </div>
                  </div>
                `
                continue
            }
            v = parseItem(v, 'btn-action')
            if (typeof(v) == 'object') {
                v.title = `<i class="ti ti-${v.icon}"></i>`
                h += buildItem(v)
            }
        }
        return `
            <div class="card-actions btn-actions">${h}</div>
        `
    },
    build_stamp(data) {
        let { color, icon } = data
        return `
        <div class="card-stamp">
            <div class="card-stamp-icon bg-${color || 'yellow'}">
              <i class="ti ti-${icon || 'bell'}"></i>
            </div>
          </div>`
    },

    build_badges(list) {
        let h = ''
        list.forEach(text => h += this._build_badge({ text, color: 'blue', class: 'me-2' }))
        return h
    },

    build_badge(text, color = 'blue') {
        return this._build_badge({ text, color })
    },

    _build_badge(opts) {
        opts = Object.assign({
            color: 'blue',
            text: '',
            class: ''
        }, opts)
        return `<span class="${opts.class} badge badge-outline m-1 text-${opts.color}">${opts.text}</span>`
    },

    build_accordion(opts, obj = true) {
        opts = Object.assign({
            onOpen: e => {},
            onClose: e => {},
            collapse_start: '',
            collapse_end: '',
            parent: true, // 选择后关闭其他
            emptyName: '默认分组',
            header: '',
        }, opts)

        let groups = {}
        opts.datas.every((item, i) => {
            if (!groups[item.group]) groups[item.group] = []
            groups[item.group].push(item)
            return true
        })

        let h = '';
        let i = 0
        let id = opts.id || new Date().getTime()
        for (let [group, items] of Object.entries(groups)) {
            let header = typeof(opts.header) == 'function' ? opts.header(group, items) : opts.header
            h += ` <div class="accordion-item" id="accordion-${id}-${group}">
                <h2 class="accordion-header sticky-top bg-body">
                  <button tabindex="-1" data-collapse="${group}" class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}-${group}" aria-expanded="true">
                    ${header.replace('{index}', ++i).replace('{i}', groups[group].length).replace('{title}',_l(group) || opts.emptyName)}
                  </button>
                </h2>`
            items.sort((a, b) => b.primary - a.primary).forEach(item => {
                h += `
                    <div id="collapse-${id}-${group}" class="accordion-collapse collapse ${opts.default === true || group == opts.default ? 'show' : ''}" ${opts.parent ? `data-bs-parent="#accordion-${id}"` : ''} ${item.prop || ''}>
                          <div class="accordion-body ${item.bodyClass} pt-0" >
                          ${opts.collapse_start}
                          ${item.html}
                          ${opts.collapse_end}
                          </div>
                    </div>
                    `
            })
            h += `</div>`
        }
        if (!obj) return h

        let div = $(`<div class="accordion" id="accordion-${id}">` + h + '</div>')
        div.find('[data-bs-toggle="collapse"]').on('click', function(e) {
            if (this.classList.contains('collapsed')) { // 关闭
                opts.onClose.call(this, e)
            } else {
                opts.onOpen.call(this, e)
            }
        })
        return div
    },

    build_checkbox_list(d) {
        let h = ''
        let { keys, vals } = ObjMaps(d.list)
        keys.forEach((k, i) => {
            h += `
            <label class="form-check ${d.inline ? 'form-check-inline' : ''}">
              <input class="form-check-input" type="checkbox" value="${k}" ${k == d.value ? 'checked' : ''}>
              <span class="form-check-label">${vals[i]}</span>
            </label>
            `
        })
        return `<div id="${d.id}">${h}</div>`
    },

    build_select(d) {
        let h = ''
        let { keys, vals } = ObjMaps(d.list)
        keys.forEach((k, i) => {
            h += `<option value="${k}" ${k == d.value ? 'selected' : ''}>${vals[i]}</option>`
        })
        return `
        <div id="${d.id}">
            <select name="${d.name || ''}" class="form-select" ${d.props}>${h}</select>
        </div>`
    },

    build_radio_list(d) {
        let h = ''
        let { keys, vals } = ObjMaps(d.list)
        keys.forEach((k, i) => {
            h += `
            <label class="form-check">
              <input class="form-check-input" name='radios' type="radio" value="${k}" ${k == d.value ? 'checked' : ''}>
              <span class="form-check-label">${vals[i]}</span>
            </label>
            `
        })
        return `<div id="${d.id}">${h}</div>`
    },

    buildButtonGroup(list, classes = '') {
        let h = ''
        list.forEach(d => {
            h += `
            <a href="#" class="btn btn-icon" aria-label="Button" data-action="${d.action}" title="${d.title}">
                <i class="ti ti-${d.icon} fs-2"></i>
            </a>`
        })
        return `<div class="${classes} w-full btn-group" style="height: 35px;">${h}</div>`
    },

    buildDataGrid(list) {
        let h = ''
        for (let v of list) {
            h += `
                <div class="d-flex p-1">
                    <span class="badge bg-${v.color}-lt">${v.title}</span>
                    <div class="flex-fill text-end">${v.value}</div>
                </div>
            `
        }
        return `
        <div class="rows align-items-center mt-2 w-full align-self-end">
            ${h}
        </div>`
    }
}

function ObjMaps(obj) {
    let vals = Object.values(obj)
    let keys = Array.isArray(obj) ? [...vals] : Object.keys(obj)
    return { keys, vals }
}

g_tabler.init();

// $('#sidebar_left').html(
//     g_tabler.build_accordion({
//         datas: [{
//             html: 'a',
//             group: 'group-a',
//         }, {
//             html: 'b',
//             group: 'group-b',
//         }, {
//             html: 'c',
//             group: 'group-a',
//         }]
//     })
// )