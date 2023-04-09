var g_form = {
    init() {
        // TODO input 支持获取拖拽目录
        const self = this


    },
    preset: {},
    registerPreset(n, opts, preset) {
        this.list[n] = opts
        this.preset[n] = preset
        return this
    },

    getPreset(name, vals) {
        if (name == undefined) name = 'text'
        let data = this.preset[name]
        if (data) {
            let { props } = this.list[name]
            if (props) vals = Object.assign({}, props, vals) // 补足默认参数
            return this.preset[name](vals)
        }
    },

    list: {},
    build(name, opts) {
        opts = Object.assign({

        }, opts)
        this.list[name] = opts
        let html = ''
        for (let name of Object.keys(opts.elements).sort((a, b) => (opts.elements[b].primary || 0) - (opts.elements[a].primary || 0))) {
            html += this.buildElement(name, opts.elements[name])
        }
        return `<div id="form_${name}" class="${opts.class || ''}" >` + html + '</div>';
    },

    buildElement(name, item) {

        return `<div id="form_elements_${name}" class="${item.class || ''}">` + (item.html || `
             <div class="mt-3 mb-3 form_element">` + this.getPreset(item.type, item) + '</div>')
            .replaceAll('{id}', name)
            .replaceAll('{title}', item.title || '')
            .replaceAll('{rows}', item.rows || 3)
            .replaceAll('{props}', item.props || '')
            .replaceAll('{required}', item.required ? 'required' : '')
            .replaceAll('{help}', item.help ? `<span class="form-help ms-1" data-bs-toggle="popover" data-bs-trigger="hover focus" data-bs-placement="right" data-bs-html="true" data-bs-content="${item.help}">?</span>` : '')
            .replaceAll('{placeholder}', item.placeHolder || '') + '</div>'
    },

    resetElement(name, key) {
        let el = $(this.buildElement(key, this.get(name).elements[key]))
        this.getElement(name, key).replaceWith(el)
        return el
    },

    // 一些第三方插件的初始化
    form_init(name) {
        let d = this.get(name)
        let div = this.getContent(name)
        for (let [k, v] of Object.entries(d.elements)) {
            if (v.type == 'date') {
                let opts = Object.assign({
                    element: this.getElement(name, k).find('.datepicker')[0],
                    lang: 'zh-CN',
                    buttonText: {
                        previousMonth: `<i class="ti ti-chevron-left"></i>`,
                        nextMonth: `<i class="ti ti-chevron-right"></i>`,
                    },
                    css: [],
                    zIndex: 999999,
                }, v.opts || {})
                let picker = new easepick.create(opts)
                picker.on('select', date => {
                    // console.log(date, picker)
                });
            }
        }
        div.find('[data-bs-toggle="popover"]').each((i, el) => new bootstrap.Popover(el))
    },

    // 对话框展示
    confirm(name, form_opts, modal_opts) {
        let onShow = modal_opts.onShow
        modal_opts.onShow = function() {
            g_form.reload(name, form_opts)
            g_form.update(name)
            typeof(onShow) == 'function' && onShow()
        }

        confirm(`<fieldset id="${name}" class="form-fieldset ${form_opts.class || ''}"></fieldset>`, modal_opts)
        this.form_init(name)
    },

    // 简便写法
    confirm1(opts, modal_opts = {}) {
        let id = opts.id
        this.confirm(id, {
            elements: opts.elements,
        }, Object.assign({
            id,
            title: opts.title || '',
            btn_ok: opts.btn_ok || '确定',
            onBtnClick: (btn, modal) => {
                if (btn.id == 'btn_ok') {
                    let vals = this.getVals(id, true)
                    if (vals === false) return false
                    if (opts.callback({ vals, changes: this.getChanges(id) }) === false) return false
                }
            }
        }, modal_opts))
    },

    // 返回默认值变动过的列表
    getChanges(name) {
        let r = {}
        let d = this.get(name)
        if (d.elements) {
            let vals = this.getVals(name)
            for (let [k, v] of Object.entries(d.elements)) {
                let val = toVal(v.value)
                if (val != vals[k]) {
                    r[k] = vals[k]
                }
            }
        }
        return r
    },

    // 更新form
    update(name) {
        let div = this.getContent(name)
        if (div.length) {
            let d = this.get(name)
            for (let [id, v] of Object.entries(d.elements)) {
                let ele = div.find('#' + id)
                if (ele.length) {
                    this.setInputVal(v.type, ele[0], toVal(v.value))
                }
            }
        }
    },

    reload(name, opts) {
        $('#' + name).html(this.build(name, opts))
    },

    get(name) {
        return this.list[name]
    },

    getContent(name) {
        return $('#form_' + name)
    },

    setInputVal(type, dom, val) {
        if (type == undefined) type = 'text'
        let d = this.get(type)
        if (d && d.setVal) {
            return d.setVal(dom, val)
        }
    },

    // 更新form元素值
    setElementVal(name, key, val, attr = 'value') {
        let d = this.get(name)
        let keys = typeof(key) == 'object' ? Object.keys(key) : [key]
        let vals = typeof(key) == 'object' ? Object.values(key) : [val]
        keys.forEach((key, i) => {
            let item = d.elements[key]
            if (item) {
                item[attr] = vals[i]
                this.setInputVal(item.type, this.resetElement(name, key).find('.form_input')[0], toVal(item.value))
            }
        })
    },

    // 获取子element元素
    getChildElement(name, key) {
        return g_form.list[name].elements[key]
    },

    // 合并子element数据并更新
    assignChildElement(name, key, vals) {
        let item = Object.assign(this.getChildElement(name, key), vals)
        this.setElementVal(name, key, item.value)
    },

    getElement(name, key) {
        return $(`#form_${name} #form_elements_${key}`)
    },

    getInputVal(type, dom) {
        if (type == undefined) type = 'text'
        let d = this.get(type)
        if (d && d.getVal) return d.getVal(dom)
        return false
    },

    setInvalid(name, key, invaild = true) {
        let div = this.getContent(name)
        div.find('#' + key).toggleClass('is-invalid', invaild)
    },

    getVals(name, check = true) {
        let r = {}
        let d = this.get(name)
        for (let [id, attr] of Object.entries(d.elements)) {
            let div = this.getElement(name, id)
            let input = div.find('.form_input')
            if (!input.length) continue

            let val = this.getInputVal(attr.type, input[0])
            if (attr.required) {
                let invaild = typeof(val) == 'string' ? isEmpty(val) : val
                input.toggleClass('is-invalid', invaild)
                if (invaild) {
                    if (check) return false
                    continue
                }
            }
            r[id] = val
        }
        return r
    }

}

g_form.init()


function openFileDiaglog(opts, callback) {
    if (typeof(opts) != 'object') opts = { id: opts }
    opts = Object.assign({
        title: '选择文件',
        properties: ['openFile'],
    }, opts)
    g_pp.set(opts.id, path => callback(path));
    ipc_send('fileDialog', opts)
}

g_form
    .registerPreset('file', {
        setVal: (dom, val) => {
            dom.value = val
        },
        getVal: dom => {
            return dom.value
        },
        props: { value: '' },
    }, d => {
        return `
     <div class="mb-3">
        <div class="form-label {required}">{title}{help}</div>
        <input type="file" id="{id}" class="form-control form_input" placeholder="{placeholder}" {props}>
     </div>`
    })
    .registerPreset('date', {
        setVal: (dom, val) => {
            dom.value = val
        },
        getVal: dom => dom.value,
        props: { value: '' },
    }, d => {
        return `
    <div class="form-label {required}">{title}{help}</div>
    <div class="input-icon">
      <input class="form-control datepicker form_input" placeholder="{placeholder}" id="{id}" {props}>
      <span class="input-icon-addon" data-action="form_date_show">
        <i class="ti ti-calendar"></i>
      </span>
    </div>
     `
    })
    .registerPreset('file_chooser', {
        setVal: (dom, val) => {
            dom.value = val
        },
        getVal: dom => dom.value,
        props: { value: '' },
    }, d => {
        return `
         <div class="mb-3">
            <label class="form-label {required}">{title}{help}</label>
            <div class="input-group mb-2">
              <span class="input-group-text" data-action="form_chooseFile" title="打开选择器">
                <i class="ti ti-folder"></i>
              </span>
              <input type="text" class="form-control form_input" id="{id}" placeholder="{placeholder}" {props}>
              
            </div>
          </div>`
    })
    .registerPreset('checkbox', {
        setVal: (dom, val) => {
            dom.checked = Boolean(val)
        },
        getVal: dom => dom.checked,
        props: { value: false },
    }, d => {
        return `
         <label class="form-check">
        <input id="{id}" type="checkbox" class="form-check-input form_input"/ {props}>
        <span class="form-check-label {required}">{title}{help}</span>
      </label>`
    })
    .registerPreset('switch', {
        setVal: (dom, val) => {
            dom.checked = Boolean(val)
        },
        getVal: dom => dom.checked,
        props: { value: false },
    }, d => {
        return `
        <label class="form-check form-switch">
          <input id="{id}" class="form-check-input form_input" type="checkbox" {props}>
          <span class="form-check-label {required}">{title}{help}</span>
        </label>`
    })
    .registerPreset('radio', {
        setVal: (dom, val) => {
            dom.checked = Boolean(val)
        },
        getVal: dom => dom.checked,
        props: { value: false },
    }, d => {
        return `
        <label class="form-check form-check-inline">
            <input id="{id}" class="form-check-input form_input" type="radio" {props}>
            <span class="form-check-label {required}">{title}{help}</span>
        </label>`
    })
    .registerPreset('datalist', {
        setVal: (dom, val) => {
            dom.checked = Boolean(val)
        },
        getVal: dom => dom.checked,
        props: { list: [], value: '' }
    }, d => {
        return `
            <label class="form-label">{title}{help}</label>
            <input id="{id}" class="form-control form_input" list="detalist_{id}" placeholder="{placeholder}" {props}>
            <datalist id="detalist_{id}">
            ${(() => {
                let h = ''
                let vals = Object.values(d.list)
                let keys = Array.isArray(d.list) ? [...vals] : Object.keys(d.list)
                keys.forEach((k, i) => {
                    h += `<option value="${k}" ${k == d.value ? 'selected' : ''}>${vals[i]}</option>`
                })
                return h
            })()}
            </datalist>
        `
    })
    .registerPreset('range', {
        setVal: (dom, val) => {
            dom.value = val || 0
            let lable = $(dom).parent('.form_element').find('.range_lable')
            if (lable.length) lable.html(dom.value)
        },
        getVal: dom => dom.value * 1,
        props: { value: 0 },
    }, d => {
        opts = Object.assign({ val: 0, min: 0, max: 100, step: 1 }, d.opts)
        return `
         <label class="form-label {required}">{title}{help}<span class='range_lable text-muted ms-2'>${opts.val}</span></label>
         <input  id="{id}" type="range" class="form-range form_input" min="${opts.min}" max="${opts.max}" step="${opts.step}" {props}>
        `
    })
    .registerPreset('checkbox_list', {
        setVal: (dom, val) => {
            // TODO 新增的内容必须重新生成
            return $(dom).find('input[value="' + val + '"]').prop('checked', true)
        },
        getVal: dom => {
            let r = []
            $(dom).find('input:checked').each((i, input) => r.push(input.value))
            return r
        },
        props: { list: [], value: [] }
    }, d => {
        return `
            <div class="form-label">{title}{help}</div>
            <div id="{id}" class="form_input">
            ${(() => {
                let h = ''
                let vals = Object.values(d.list)
                let keys = Array.isArray(d.list) ? [...vals] : Object.keys(d.list)
                keys.forEach((k, i) => {
                    h += `
                    <label class="form-check form-check-inline">
                      <input class="form-check-input" type="checkbox" value="${k}" ${k == d.value ? 'checked' : ''} {props}>
                      <span class="form-check-label">${vals[i]}</span>
                    </label>
                    `
                })
                return h || `
        什么都没有...` 
            })()}
            </div></div>
        `
    })
    .registerPreset('select', {
        setVal: (dom, val) => {
            dom.value = val || ''
        },
        getVal: dom => dom.value,
        props: { list: [], value: '' }
    }, d => {
        return `
            <label class="form-label">{title}{help}</label>
            <select id="{id}" class="form-select form_input" placeholder="{placeholder}" {props}>
            ${(() => {
                let h = ''
                let vals = Object.values(d.list)
                let keys = Array.isArray(d.list) ? [...vals] : Object.keys(d.list)
                keys.forEach((k, i) => {
                    h += `<option value="${k}" ${k == d.value ? 'selected' : ''}>${vals[i]}</option>`
                })
                return h
            })()}
            </select>
        `
    })
    .registerPreset('textarea', {
        setVal: (dom, val) => {
            dom.value = val || ''
        },
        getVal: dom => dom.value,
        props: { value: '' },
    }, d => {
        return `
            <label class="form-label {required}">{title}{help}</label>
            <textarea id="{id}" rows="{rows}" placeholder="{placeholder}" class="form-control form_input" {props}/></textarea>
        `
    })
    .registerPreset('text', {
        setVal: (dom, val) => {
            dom.value = val || ''
        },
        getVal: dom => dom.value,
        props: { value: '' },
    }, d => {
        return `
           <label class="form-label {required}">{title}{help}</label>
           <input id="{id}" placeholder="{placeholder}" type="text" class="form-control form_input {props}"/>
        `
    })


g_action.registerAction('form_chooseFile', dom => {
    let input = dom.nextElementSibling
    let opts = g_form.get($(dom).parents('.form-fieldset').attr('id')).elements[input.id].opts
    opts.id = 'form_chooseFile'
    openFileDiaglog(opts, path => {
        if (!isEmpty(path[0])) {
            input.value = path[0]
        }
    })
})


g_form.registerPreset('image', {
    setVal: (dom, val) => {
        $(dom).find('img').attr('src', val)
    },
    getVal: dom => {
        return $(dom).find('img').attr('src')
    }
}, d => {
    return `
     <div class="mb-3 text-center" id="{id}">
        <img class="avatar-rounded" title="点击上传图片" data-action="form_image" width="50" src="${d.value}">
      </div>`
})

g_action.registerAction('form_image', dom => {
    g_form.confirm('form_image', {
        elements: {
            src: {
                title: '地址',
                type: 'file_chooser',
                required: true,
                value: dom.src,
                opts: {
                    title: '选择图片',
                    properties: ['openFile'],
                    filters: [
                        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
                    ],
                }
            },
        },
    }, {
        id: 'form_image',
        title: '输入地址',
        onBtnClick: (btn, modal) => {
            if (btn.id == 'btn_ok') {
                let { src } = g_form.getVals('form_image')
                getEle('form_image').attr('src', src)
            }
        }
    })
})