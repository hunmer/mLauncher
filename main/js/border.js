
g_border.init({
    addItem(h, method = 'appendTo'){
          $(h)[method]('#navbar-menu .navbar-nav')
    },
	init(){
		this.bar.html(`
			<header class="navbar navbar-expand-md w-full p-0" style="height:30px;min-height: unset;">
            <div class="p-0 w-full d-flex flex-grow-1 ms-2 app-region-darg" style="height:30px">
                <h1 class="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3 ">
                    <a href=".">
                        <img src="./favicon.svg" width="26" height="26" alt="Apps" class="me-2">
                        <b id="title" class="flex-fill">Apps</b>
                    </a>
                </h1>

                <div class="navbar-nav flex-row order-md-last align-items-center"  style="min-height: unset;">
                    <div id="traffic">
                        <div class="traffic_icons d-flex align-items-center m-0" style="font-size: 1.2rem;margin-top: 2px;">
                            <div data-action="darkMode" ><i class="ti ti-moon"></i></div>
                        </div>
                        <div class="light" style="background-color: #55efc4" data-action="min"></div>
                        <div class="light" style="background-color: #ffeaa7" data-action="max"></div>
                        <div class="light" style="background-color: #ff7675" data-action="close"></div>
                    </div>
                </div>

                <div class="collapse navbar-collapse" id="navbar-menu">
                    <div class="d-flex flex-column flex-md-row flex-fill align-items-stretch align-items-md-center">
                        <ul class="navbar-nav">
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false">
                                    <span class="nav-link-title">应用</span>
                                </a>
                                <div class="dropdown-menu  dropdown-menu-arrow bg-dark text-white">
                                    <a class="dropdown-item" data-action="app_new">新建应用</a>
                                    <a class="dropdown-item" data-action="app_checkUpdateAll">检查更新所有</a>
                                    <a class="dropdown-item" data-action="app_discover">检查本地新应用</a>
                                </div>
                            </li>
                             <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown" data-bs-auto-close="outside" role="button" aria-expanded="false">
                                    <span class="nav-link-title">其他</span>
                                </a>
                                <div class="dropdown-menu  dropdown-menu-arrow bg-dark text-white">
                                    <a class="dropdown-item" data-action="modal_hotkey">快捷键</a>
                                    <a class="dropdown-item" data-action="settings,about">设置</a>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
		`)
	}

})