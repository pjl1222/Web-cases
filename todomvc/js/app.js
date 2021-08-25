// 准备数据
// var list = [
// 	{ id: 1, content: '吃饭', isFinish: false, isEdit: false },
// 	{ id: 2, content: '睡觉', isFinish: true, isEdit: false },
// 	{ id: 3, content: '打豆豆', isFinish: false, isEdit: false },
// 	{ id: 4, content: '听杰伦的歌', isFinish: false, isEdit: false }
// ]
var list = JSON.parse(window.localStorage.getItem('todos')) || []

// 准备一个全局变量用来表示目前的状态
var type = 'all'  // 可选值为'active', 'completed'
// 添加内容区域
var container = document.querySelector('.todoapp')

bindHtml()
// 准备渲染的函数
function bindHtml() {
	var bindList = list
	// 根据type变量决定数组的内容
	switch(type) {
		case 'all':
			bindList = list
			break
		case 'active':
			bindList = list.filter(item => !item.isFinish)
			break
		case 'completed':
			bindList = list.filter(item => item.isFinish)
	}
	// 计算所有未完成的数量
	var activeNum = list.filter(item => !item.isFinish).length
	// 使用模板引擎
	container.innerHTML = template('tmp', {
		bindList: bindList,
		activeNum: activeNum,
		length: list.length, // 原始数组的长度
		type: type
	})
	window.localStorage.setItem('todos', JSON.stringify(list))
}

// 改变显示状态
window.addEventListener('hashchange', function() {
	type = window.location.hash.slice(2) || 'all'
	bindHtml()
})

// 事件委托，添加todo
container.addEventListener('keydown', function(e) {
	e = e || window.event
	var target = e.target || e.srcElement
	var code = e.keyCode || e.which
	// 如果是在添加的时候敲击回车
	if(target.className === 'new-todo' && code === 13) {
		var text = target.value.trim()
		if(text === '') return
		list.push({
			// 最后一条数据的id + 1
			id: list.length ? list[list.length - 1].id + 1 : 1,
			content: text,
			isFinish: false, 
			isEdit: false
		})
		bindHtml()
	}
	if(target.className === 'new-todo' && code === 27) target.value = ''
	// 确定编辑
	if(target.className === 'edit' && code === 13) {
		var id = target.dataset.id - 0
		var text = target.value.trim()
		// 如果编辑的内容为空，就把这一条todo删除
		if(!text) {
			list = list.filter(item => item.id !== id)
		}else {
			// 修改内容
			var todo = list.find(item => item.id === id)
			todo.content = text
			// 退出编辑状态
			todo.isEdit = false
		}
		bindHtml()
	}
	// 取消编辑
	if(target.className === 'edit' && code === 27) {
		var id = target.dataset.id - 0
		var todo = list.find(item => item.id === id)
		todo.isEdit = false
		bindHtml()
	}
})

// 事件委托，处理一些点击事件
container.addEventListener('click', function(e) {
	e = e || window.event
	var target = e.target || e.srcElement
	if(target.className === 'toggle') {
		var id = target.dataset.id - 0
		var todo = list.find(item => item.id === id)
		todo.isFinish = !todo.isFinish
		bindHtml()
	}
	if(target.className === 'destroy') {
		var id = target.dataset.id - 0
		list = list.filter(item => item.id !== id)
		bindHtml()
	}
	if(target.className === 'clear-completed'){
		list = list.filter(item => !item.isFinish)
		bindHtml()
	}
	if(target.className === 'toggle-all'){
		console.log('dshjk')
		list.forEach(item => { item.isFinish = target.checked })
		bindHtml()
	}
})

// 双击事件，确认编辑
container.addEventListener('dblclick', function(e) {
	e = e || window.event
	var target = e.target || e.srcElement
	// 判断双击的是label里面的label标签
	if(target.className === 'todo-item') {
		var id = target.dataset.id - 0
		list.forEach(item => { 
			item.isEdit = false 
			if(item.id === id) item.isEdit = true
		})
		bindHtml()
	}
})

