class deepFolderSelector {

    constructor(opts) {
        let _type = opts.type
        let _class = 'folder_selector_' + _type
        this.instance = _type == 'folders' ? g_folders : g_tags

        g_form.registerPreset(_type, {
            setVal: (dom, val) => {
                let h = ''
                toArr(val).forEach(folder => {
                    if (folder != '') h += `<span class="badge bg-primary me-2" data-action="folder_selector_remove" data-folder="${folder}">${this.instance.folder_getValue(folder, 'title')}<i class="ti ti-x ms-2"></i></span>`
                })
                $(dom).find('.badge-list').html(h)
            },
            getVal: dom => Array.from($(dom).find('.badge').map((i, badge) => badge.dataset.folder))
        }, d => {
            return `
             <label class="form-label">{title}</label>
              <div class="card shadow-none bg-transparent w-full form_input ${_class}" id="{id}" style="min-height: 38px;">
                  <div class="card-body p-2 cursor-text position-relative">
                    <div class="badge-list">
                        <span class="text-muted">父目录列表</span>
                    </div>
                    <i class="ti ti-${opts.icon} ms-2 fs-3 position-absolute end-10 top-10" data-action="${_type}_list" title="列表"></i>
                  </div>
                </div>
            `
        })

        let actions = ['list', 'selector_remove', 'subFolders'].map(k => _type + '_' + k)
        g_action.registerAction(actions, (dom, action) => {
            switch (actions.indexOf(action[0])) {
                case 0:
                    // todo 附带默认选中
                    return this.prompt().then(vals => {
                        // TODO form更加灵活
                        g_form.setInputVal(_type, $('.' + _class), vals)
                    })

                case 1:
                    return dom.remove()

                case 2:
                    return this.showFolder(dom.dataset.folder)
            }
        })
    }

    showFolder(folder = '') {
        let h = ''
        let r = this.instance.folder_getParents(folder)
        if (!isEmpty(folder) && folder != 'all') r.push(folder)
        r.unshift('all')
        r.forEach(k => {
            let title = k == 'all' ? '所有' : this.instance.folder_getValue(k, 'title')
            h += `<li class="breadcrumb-item" data-action="folder_subFolders" data-folder="${k}"><a href="#">${title}</a></li>`
        })
        $('#folderList_parents').html(h)

        h = ''
        let i = 0
        if (folder == 'all') folder = ''
        for (let [k, v] of Object.entries(this.instance.folder_getItems(folder, true))) {
            h += `
            <label class="form-selectgroup-item flex-fill">
            <input type="checkbox" name="" value="${k}" class="form-selectgroup-input">
            <div class="form-selectgroup-label d-flex align-items-center p-1">
              <div class="ms-3 me-3">
                <span class="form-selectgroup-check"></span>
              </div>
              <div class="form-selectgroup-label-content d-flex align-items-center">
                <span class="avatar me-3 flex-fill">
                   <i class="ti ti-${v.icon} mr-2"></i>
                </span>
                <div class="flex-fill">
                  <div class="font-weight-medium">${v.title}</div>
                  <div class="text-muted"></div>
                </div>
              </div>
              ${this.instance.folder_getItems(k).length ? `
                <div class="flex-fill text-end">
                    <button class="btn p-2" data-action="folder_subFolders" data-folder="${k}">
                        <i class="ti ti-arrow-big-right fs-1"></i>
                    </button>
                  </div>
                ` : ''}
            </div>
          </label>`
            i++
        }

        $('#folderList_folders').html(h ? `
            <div class="mb-3">
                <label class="form-label">${i}个子目录</label>
                <div class="form-selectgroup form-selectgroup-boxes d-flex flex-column">
                    ${h}
                </div>
            </div>
        ` : `<h3 class="text-center">这里什么都没有...</h3>`)
    }

    prompt(folder = '') {
        return new Promise(reslove => {
            confirm(`
            <ol class="breadcrumb breadcrumb-arrows mt-1" id="folderList_parents"></ol>
            <div id="folderList_folders" class="mt-3">

            </div>
            `, {
                id: 'folderList',
                title: '选择目录',
                onShow: () => this.showFolder(folder)
            }).then(() => reslove(Array.from($('#folderList_folders input[type="checkbox"]:checked').map((i, input) => input.value))))
        })
    }

}


var g_folderList = new deepFolderSelector({
    type: 'folders',
    icon: 'folder',
})

var g_tagsList = new deepFolderSelector({
    type: 'tags',
    icon: 'tag',
})


// $(function() {
//     g_form.confirm('test_folders', {
//         elements: {
//             parent: {
//                 type: 'folders',
//                 title: '父目录',
//                 value: ['1665313094909']
//             },
//         },
//     }, {
//         id: 'test_folders',
//         title: '编辑目录',
//         btn_ok: '保存',
//         onBtnClick: (btn, modal) => {
//             if (btn.id == 'btn_ok') {
//                 console.log(g_form.getVals('test_folders'))
//             }
//         }
//     })
// });