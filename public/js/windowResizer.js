
const BREAKPOINT_SM = 1
const BREAKPOINT_MD = 2
const BREAKPOINT_LG = 3
const BREAKPOINT_XL = 4
const BREAKPOINT_XXL = 5

var g_resizer = {
	init(){
		const self = this
		window.addEventListener('resize', function(e){
			let width = this.innerWidth
			let height = this.innerHeight
			let breakpoint
			if(width <= 576){
				breakpoint = BREAKPOINT_SM
			}else
			if(width <= 768){
				breakpoint = BREAKPOINT_MD
			}else
			if(width <= 992){
				breakpoint = BREAKPOINT_LG
			}else
			if(width <= 1200){
				breakpoint = BREAKPOINT_XL
			}else{
				breakpoint = BREAKPOINT_XXL
			}
			let last = self.breakpoint_last
			for(let [selecotr, opts] of Object.entries(self.targets)){
				let ret = opts.onResize({breakpoint, width, height, last, changed: breakpoint != last})
				if(typeof(ret) == 'string'){
					let el = $(selecotr)
					el.html(ret)

				}
			}
			self.breakpoint_last = breakpoint
		})
	},
	targets: {},
	bind(selecotr, opts){
		this.targets[selecotr] = opts
		window.dispatchEvent(new Event('resize'))
	},

}

g_resizer.init()
