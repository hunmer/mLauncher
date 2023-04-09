var g_modal = {
    styles: {
        default: {
            html: `
            <div class="modal" tabindex="-1">
              <div class="modal-dialog" role="document">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">{title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div class="modal-body">
                    {html}
                  </div>
                  <div class="modal-footer">
                    {footer}
                  </div>
                </div>
              </div>
            </div>
        `
        },

        danger: {
            html: `
            <div class="modal" tabindex="-1">
              <div class="modal-dialog modal-sm" role="document">
                <div class="modal-content">
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  <div class="modal-status bg-danger"></div>
                  <div class="modal-body text-center py-4">
                    <h3>{title}</h3>
                    <div class="text-muted">{html}</div>
                  </div>
                  <div class="modal-footer">
                    {footer}
                    </div>
                  </div>
                </div>
              </div>
            </div>
        `
        },

        success: {
            html: `
            <div class="modal" tabindex="-1">
              <div class="modal-dialog modal-sm" role="document">
                <div class="modal-content">
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  <div class="modal-status bg-success"></div>
                  <div class="modal-body text-center py-4">
                    <h3>{title}</h3>
                    <div class="text-muted">{html}</div>
                  </div>
                  <div class="modal-footer">
                    {footer}
                  </div>
                </div>
              </div>
            </div>
        `,
        },

        fullscreen: {
            html: `
            <div class="modal" tabindex="-1">
              <div class="modal-dialog modal-fullscreen" role="document">
                <div class="modal-content">
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  <div class="modal-body text-center py-4">
                    {html}
                  </div>
                  <div class="modal-footer">
                   {footer}
                  </div>
                </div>
              </div>
            </div>
        `,
        },

    },

    init: function() {
        let self = this
        $(`<style>
            html.modaled {
                overflow-y: hidden !important;
            }

            @media (max-width: 576px) {
              .modal-dialog {
                width: 100% !important;
              }
            }
        </style>`).appendTo('head')
        window.alert = (text, opts = {}) => {
            return new Promise((reslove, reject) => {
                let modal = self.modal_build(Object.assign({
                    title: '提示',
                    html: text,
                    type: 'default',
                    footer: '{btn}',
                    hotkey: true,
                    onClose: e => reject(),
                    buttons: [{
                        text: opts.btn_ok || '确定',
                        class: 'btn-primary',
                        default: true,
                        id: 'ok',
                        onClick: e => reslove(modal)
                    }]
                }, opts))

            });
        }

        window.confirm = (text, opts = {}) => {
            return new Promise((reslove, reject) => {
                let modal = self.modal_build(Object.assign({
                    title: '询问',
                    html: text || '确定吗?',
                    type: 'default',
                    footer: '{btn}',
                    hotkey: true,
                    onClose: e => reject(),
                    buttons: [{
                        text: opts.btn_ok || '确定',
                        class: 'btn-primary',
                        id: 'ok',
                        default: true,
                        onClick: e => reslove(modal)
                    }, {
                        text: opts.btn_cancel || '取消',
                        class: 'btn-danger',
                        id: 'cancel',
                        onClick: e => reject()
                    }]
                }, opts))
            });
        }

        window.prompt = (text, opts = {}) => {
            return new Promise((reslove, reject) => {

                let modal = self.modal_build(Object.assign({
                    title: '请输入',
                    html: `
                        <textarea class="form-control" data-bs-toggle="autosize" rows="${opts.rows || 3}" placeholder="${opts.placeHolder || '...'}">${text}</textarea>
                    `,
                    type: 'default',
                    footer: '{btn}',
                    hotkey: true,
                    onClose: e => reject(),
                    // todo check empty val
                    buttons: [{
                        text: opts.btn_ok || '确定',
                        default: true,
                        id: 'ok',
                        class: 'btn-primary',
                        onClick: e => reslove(modal.find('textarea').val())
                    }, {
                        text: opts.btn_cancel || '取消',
                        class: 'btn-danger',
                        id: 'cancel',
                        onClick: e => reject()
                    }]
                }, opts))
            });
        }

    },

    style_get: function(type) {
        if (!this.styles[type]) type = 'default'
        return this.styles[type]
    },

    modal_get: function(id) {
        return $('#modal_' + id)
    },

    modal_build: function(opts) {
        opts = Object.assign({
            title: '对话框',
            type: 'default',
            footer: '{btn}',
            bodyClass: '',
            once: false,
            id: new Date().getTime(),
            buttons: [],
            static: true,
            style: {},
            width: '',
            show: true,
            hotkey: true,
            btn_close: true, // 点击按钮后是否自动关闭modal
            onBtnClick: btn => {},
            onShow: function(e) {},
            onHide: function(e) {},
            onClose: function(e) {},
            getModal() {
                return $('#modal_' + this.id)
            }
        }, opts || {})

        if (Array.isArray(opts.extraButtons)) {
            opts.buttons.unshift(...opts.extraButtons)
        }
        let style = Object.assign({}, this.style_get(opts.type))

        // 底部footer
        let btns = '';
        for (let btn of opts.buttons) {
            btns += `<button type="button" ${btn.id ? `id="btn_${btn.id}"` : ''} ${btn.action ? `data-action="${btn.action}"` : ''} class="modal_btn btn mx-auto ${btn.class}" ${btn.attr || ''}>${btn.text}</button>`
        }
        opts.footer = opts.footer.replace('{btn}', btns)

        let html = style.html
            .replace('{title}', opts.title)
            .replace('{html}', opts.html)
            .replace('{footer}', opts.footer)

        let id = 'modal_' + opts.id
        let modal = $('#' + id)
        modal.length && modal.remove();
        modal = $(html).attr('id', id).css({
            backgroundColor: 'rgba(0, 0, 0, .4)',
        }).appendTo('body')

        let body = modal.find('.modal-body').addClass(opts.bodyClass)

        let dialog = modal.find('.modal-dialog')
        opts.width && dialog.css({
            width: opts.width,
            maxWidth: 'unset'
        })
        dialog.css(opts.style)
        opts.scrollable && dialog.addClass('modal-dialog-scrollable')

        let footer = modal.find('.modal-footer').toggleClass('hide', opts.footer == '')
        // 绑定按钮事件
        let def_btn
        modal.find('.modal_btn').each((i, btn) => {
            btn.addEventListener('click', function(ev) {
                if (opts.onBtnClick(btn, modal) === false) return
                if (opts.buttons[i].onClick) {
                    // onclick 是个reslove 或者 reject 函数时，无法获取callback 的返回值
                    if (opts.buttons[i].onClick.call(btn, ev) !== false && opts.btn_close) {
                        modal.method('hide', ev)
                    }
                }
            })
            if (opts.buttons[i].default) {
                def_btn = btn // 默认按钮
            }
        })

        // 热键
        if (opts.hotkey) {
            // TODO 全局热键
            modal.on('keyup', function(e) {
                // if ($('input:focus,textarea:focus').length == 0) {
                    let key = e.originalEvent.key
                    // if (key == 'Enter') { // 有冲突
                    //     def_btn && def_btn.click()
                    // } else
                    if (key == 'Escape') {
                        modal.method('hide', e)
                    }
                // }
            })
        }

        // 点击事件
        if (!opts.static) {
            modal.on('click', function(e) {
                if (!inArea(e, modal.find('.modal-content'))) {
                    modal.method(opts.once ? 'close' : 'hide', e)
                }
            })
        }

        modal.method = function(method, params) {
            switch (method) {
                case 'show':
                    if (opts.onShow(modal, params) === false) return
                    _callEvent('modal_show', { modal, params })
                    $('html').addClass('modaled')
                    return modal.show()
                case 'hide':
                    if (opts.onHide(modal, params) === false) return
                    _callEvent('modal_hide', { modal, params })
                    $('html').removeClass('modaled')
                    return modal.hide()
                case 'close':
                    if (opts.onClose(modal, params) === false) return
                    _callEvent('modal_close', { modal, params })
                    return modal.remove()
            }
        }

        modal.find('[data-bs-dismiss="modal"]').on('click', function(e) {
            modal.method(opts.once ? 'close' : 'hide', e)
        })

        opts.show && modal.method('show')
        return modal;
    },

    hide: function(id) {
        // this.modal_get(id).method('hide')
    },
    remove: function(id) {
        this.modal_get(id).remove()
    },
    isShowing(id){
        let modal = this.modal_get(id)
        return modal.length && modal.css('display') != 'none'
    }
}

g_modal.init()


const inArea = (event, target) => {
    var point = { x: event.pageX, y: event.pageY }

    var area = $(target).offset();
    area = {
        l: area.left,
        t: area.top,
        w: $(target).width(),
        h: $(target).height(),
    }

    return point.x > area.l && point.x < area.l + area.w && point.y > area.t && point.y < area.t + area.h;
}