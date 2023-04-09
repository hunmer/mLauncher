var g_hotkey = {
    defaultList: {},
    
    init(funs = {}) {
        const self = this
        assignInstance(self, funs)
        this.list = g_hotkey.getData('hotkeys', this.defaultList);
        this.initEvent();
        this.initData();
        $(function () {
            g_menu.registerMenu({
                name: 'hotkey_item',
                selector: '[data-dbaction="hotkey_edit"]',
                dataKey: 'data-key',
                html: g_menu.buildItems([{
                    icon: 'pencil',
                    text: '编辑',
                    action: 'hotkey_item_edit'
                }, {
                    icon: 'trash',
                    text: '删除',
                    class: 'text-danger',
                    action: 'hotkey_item_delete'
                }])
            });
            g_action.
            registerAction({
                modal_hotkey: () => this.modal_show(),
                hotkey_item_edit: () => {
                    g_hotkey.prompt_add(g_menu.key);
                    g_menu.hideMenu('hotkey_item');
                },
                hotkey_item_delete: () => {
                    g_hotkey.prompt_delete(g_menu.key);
                    g_menu.hideMenu('hotkey_item');
                },
                hotkey_edit: () => {
                    g_hotkey.prompt_add(dom.dataset.key);
                },
                hotkey_toggle: () => {
                    g_setting.toggleValue('hotkey')
                }
            })
        });
    },
    hotkey_register(...args){
        return this.register.apply(this, args)
    },
    register(name, opts) {
        let isArr = Array.isArray(name)
        if (typeof(name) == 'object' && !isArr) {
            Object.assign(this.list, name)
            return this
        }
        if (!isArr) name = [name];
        for (var alisa of name) this.list[alisa] = opts;
        return this
    },

    prompt_delete(key) {
        confirm('是否删除快捷键 【' + key + '】 ?', {
            title: '删除快捷键',
        }).then(() => {
            $('#modal_hotkey_edit').modal('hide');
            g_hotkey.removeKey(key);
            toast('删除成功', 'success');
        })
    },
    prompt_add(key = '') {
        var d = this.list[key] || {
            content: '',
            title: '',
            type: '',
        }
        var h = `
            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">标题</span>
              </div>
              <input type="text" id="input_hotkey_title" class="form-control" placeholder="输入名称" value="${d.title}">
            </div>

            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text" >热键</span>
              </div>
              <input type="text"  id="input_hotkey_key" value="${key}" class="form-control" placeholder="在这里按下要设置的快捷键" onkeydown="this.value=g_hotkey.getInputCode(event);" readonly>
            </div>

            <div class="input-group mb-3">
              <div class="input-group-prepend">
                <span class="input-group-text">代码</span>
              </div>
              <textarea  id="input_hotkey_content" class="form-control">${d.content}</textarea>
            </div>

            <div class="input-group mt-10">
              <div class="input-group-prepend">
                <label class="input-group-text" for="select_hotkey_key">作用范围</label>
              </div>
              <select class="form-select" id="select_hotkey_key">
                <option selected value=''>点击选择</option>
                <option value="1">普通</option>
                <option value="2">无视输入框</option>
                <option value="3">全局</option>
              </select>
            </div>
            `;
        g_modal.modal_build({
            html: h,
            id: 'hotkey_edit',
            title: '编辑热键',
            buttons: [{
                id: 'ok',
                text: '保存',
                class: 'btn-primary',
            }, {
                id: 'test',
                text: '测试',
                class: 'btn-warning',
            }, {
                id: 'delete',
                text: '删除',
                class: 'btn-danger',
            }],
            onShow: () => {
                if (!key) {
                    $('#modal_hotkey_edit #btn_delete').hide();
                } else {
                    $('#modal_hotkey_edit option[value="' + d.type + '"]').prop('selected', true);
                }
            },
            onBtnClick: (btn, modal) => {
                var par = $(btn).parents('.modal');
                var content = $('#input_hotkey_content').val();
                if (content == '') return toast('没有输入执行内容', 'danger');
                if (btn.id == 'btn_ok') {
                    var newKey = $('#input_hotkey_key').val();
                    if (newKey == '') return toast('没有输入按键', 'danger');
                    var type = parseInt($('#select_hotkey_key').val());
                    if (isNaN(type)) return toast('没有选择作用范围', 'danger');
                    var title = $('#input_hotkey_title').val();

                    const fun = () => {
                        g_hotkey.setHotKey(newKey, {
                            content,
                            title,
                            type,
                        });
                        toast('保存成功', 'success');
                    }

                    if (newKey != key) {
                        var exists = g_hotkey.getKey(newKey);
                        if (exists) {
                            return confirm('此按键已被 ' + exists.title + ' 占用,是否覆盖?').then(() => fun());
                        }
                        key && g_hotkey.removeKey(key, false);
                    }
                    fun();
                } else
                if (btn.id == 'btn_test') {
                    try {
                        eval(content);
                    } catch (e) {
                        alert(e.toString());
                    }
                    return false;
                } else
                if (btn.id == 'btn-delete') {
                    g_hotkey.prompt_delete(key);
                    return false;
                }
                par.modal('hide');
            }
        });
    },
    getKey(key) {
        return this.list[key];
    },
    removeKey(key, save = true) {
        delete this.list[key];
        this.saveData(save);
    },
    saveData(save = true) {
        if (save) {
            g_hotkey.saveData('hotkeys', this.list);
        }
        if ($('#modal_hotkey').length) this.rendererList();
        this.initData();
    },
    initData() {
        // 正确排序按键
        var self = this;
        var list = {};
        for (var key in self.list) {
            const getPrimary = s => {
                if (s == 'ctrl') return 4;
                if (s == 'alt') return 3;
                if (s == 'shift') return 2;
                return 1;
            }
            list[key.split('+').sort((a, b) => getPrimary(b) - getPrimary(a)).join('+').toLowerCase()] = self.list[key];
        }
        self.list = list;
    },
    setHotKey(key, value, save = true) {
        this.list[key] = value;
        this.saveData(save);
        if(value.type == 2){ // 注册全局

        }
    },
    rendererList() {
        var h = '';
        for (var key in this.list) {
            var d = this.list[key];
            h += `
                <tr data-key="${key}" data-dbaction="hotkey_edit">
                  <td>${d.title}</td>
                  <td>${key}</td>
                  <td>${d.content}</td>
                </tr>
            `;
        }
        $('#modal_hotkey tbody').html(h);
    },
    modal_show() {
        var h = `
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">说明</th>
                  <th scope="col">按键</th>
                  <th scope="col">动作</th>
                </tr>
              </thead>
              <tbody>
              </tbody>
            </table>
        `;
        this.modal = g_modal.modal_build({
            html: h,
            id: 'hotkey',
            title: '快捷键列表',
            width: '80%',
            buttons: [{
                id: 'add',
                text: '新增',
                class: 'btn-warning',
            }, {
                id: 'reset',
                text: '重置',
                class: 'btn-secondary',
            }, {
                id: 'tip',
                text: '常用代码',
                class: 'btn-info',
            }],
            onBtnClick: (btn, modal) => {
                switch (btn.id) {
                    case 'btn_tip':
                        var h = `
                            <div class="table-responsive">
                                <table class="table user-select table-vcenter table-nowrap">
                                  <thead>
                                    <tr>
                                      <th scope="col">说明</th>
                                      <th scope="col">代码</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                            </div>
                        `;
                        for (var item of [
                                ['切换置顶', 'ipc_send("pin")'],
                                ['最小化', 'ipc_send("min")'],
                                ['切换最大化', 'ipc_send("max")'],
                                ['结束程序', 'ipc_send("close")'],
                            ]) {
                            h += `
                                <tr>
                                  <td>${item[0]}</td>
                                  <td>${item[1]}</td>
                                </tr>
                            `;
                        }
                        h += `</tbody>
                            </table>`;
                        alert(h, {
                            title: '常用代码',
                            btn_ok: '请求更多'
                        }).then(() => ipc_send('url', 'https://github.com/hunmer/mSearch/issues'))
                        break;
                    case 'btn_add':
                        g_hotkey.prompt_add();
                        return;

                    case 'btn_reset':
                        confirm('确定要重置吗?').then(() => {
                            g_hotkey.list = g_hotkey.defaultList;
                            g_hotkey.saveData();
                            toast('重置成功,请重新刷新页面', 'success');
                        })
                        return;
                }
                //$(btn).parents('.modal').modal('hide');
            }
        });
        this.rendererList();
    },
    keydown: {},
    // 应用最新的按键状态（获取全局功能键状态）
    onKeydown(e) {
        this.keydown = e;
    },
    // 返回按键是否正激活
    isActive(k) {
        return this.keydown[k]
    },
    initEvent() {
        var self = this;
        window.addEventListener('keydown', function(e) {
            // if(g_setting.getConfig('hotkey')) return
            self.onKeydown(e)
            
            let key = self.getInputCode(e, 'key')
            // console.log(key);
            // if ([16, 17, 18, 91, 9, 27, 13, 8, 20, 93].includes(e.keyCode)) { // 忽略功能按键
            //     return;
            // }
            if ($('#modal_hotkey_edit.show').length) return;
            var editing = $('input:focus,textarea:focus').length;
            var d = self.list[key];
            if (d) {
                if (!(editing && d.type == 1)) {
                    clearEventBubble(e);
                    return eval(d.content);
                }
            }
            var d = self.list[self.getInputCode(e, 'code')];
            if (d) {
                if (!(editing && d.type == 1)) {
                    clearEventBubble(e);
                    return eval(d.content);
                }
            }
        })
        window.addEventListener('keyup', function(e) {
            delete self.keydown
        })
    },
    getInputCode(e, type = 'key') {
        var a = [];
        if (e.ctrlKey) a.push('ctrl');
        if (e.altKey) a.push('alt');
        if (e.shiftKey) a.push('shift');
        e[type] && a.push(e[type].toLowerCase());
        return a.join('+');
    },
    // 是否按键状态
    is(keys){
        // todo 完全匹配模式
        return this.keydown && toArr(keys).every(k => this.keydown[k])
    }
}

