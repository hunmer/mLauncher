class Worker_IPC {
	id = 0
	list = {}
	constructor(file){
		let worker = this.worker = new Worker(file) // , {type: 'module'} 浏览器环境
		worker.onmessage = ({data}) => this.onRevice(data)
		worker.onerror = this.onError
	}

	onRevice(data){
		let {ret, id} = data
		let cb = this.list[id]
		if(cb){
			delete this.list[id]
			cb(ret)
		}
	}

	onError(...args){
		console.error(args)
	}

	send(data, callback){
		let id = ++this.id
        this.list[id] = callback
        this.worker.postMessage({id, data})
	}
	
}