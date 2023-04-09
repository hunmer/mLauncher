 // g_setting.setDefault('proxy', 'http://127.0.0.1:4780')
 g_setting.tabs = {
     // general: {
     //     title: '常规',
     //     icon: 'home',
     //     elements: {
     //         oneTab: {
     //             title: '单标签页',
     //             type: 'switch',
     //             value: () => getConfig('oneTab'),
     //         },
     //     }
     // },
     about: {
         title: '关于',
         icon: 'coffee',
         elements: {
             about: {
                 html: `<div class="row">
                        <div class="card">
                          <div class="card-body p-4 text-center">
                            <span class="avatar avatar-xl mb-3 avatar-rounded" style="background-image: url(https://github.com/hunmer.png)"></span>
                            <h3 class="m-0 mb-1"><a href='#' data-action="author">@hunmer</a></h3>
                            <div class="text-muted">liaoyanjie2000@gmail.com</div>
                            <div class="mt-3">
                              <span class="badge bg-purple-lt">DEV</span>
                            </div>
                          </div>
                          <div class="ribbon bg-yellow fs-3 cursor-pointer" data-action="homepage">
                            <b>给个Star呗~</b>
                            <i class="ti ti-star ms-2"></i>
                          </div>
                          <div class="card-body">
                                ${g_tabler.build_accordion({
                                    header: '{title}',
                                    datas: [{
                                        html: '简易Electron启动器，用于启动一些个人应用...',
                                        group: '✨这软件是啥',
                                    }, {
                                        html: 'github发布页上应有会写...',
                                        group: '👀如何制作自己的APP并导入？',
                                    }]
                                }, false)}
                          </div>
                        </div>
                    </div>`
             }
         }
     },
 }

 $(function() {
     g_action.registerAction({
         homepage: () => ipc_send('url', 'https://github.com/hunmer/mCollection'),
         author: () => ipc_send('url', 'https://github.com/hunmer'),
     })
     g_setting.getConfig('darkMode') && g_setting.call('darkMode', true)
 });

