/* 自定义Promise函数模块 */
(function (window){
    const PENDING = 'pending'
    const RESOLVED = 'resolved'
    const REJECTED = 'rejected'
    function MyPromise(excutor) {
        const self = this
        this.status = PENDING
        this.data = undefined
        this.callbacks = [] // 里面每个元素的结构: { onResolved(){}, onRejected(){} }
        // 用于改变promise状态的函数
        function resolve(value) {
            // 如果当前状态不是pending，直接结束
            if(self.status !== PENDING) return
            // 将状态改为resolved
            self.status = RESOLVED
            // 保存value数据
            self.data = value
            // 如果有待执行的callback函数，异步执行掉onResolved
            if(self.callbacks.length > 0) {
                // 所有成功的回调要放到队列里面去执行
                setTimeout(() => {
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value)
                    });
                }, 0)
            }
        }
        function reject(reason) {
            // 如果当前状态不是pending，直接结束
            if(self.status !== PENDING) return
            // 将状态改为rejected
            self.status = REJECTED
            // 保存reason数据
            self.data = reason
            // 如果有待执行的callback函数，异步执行掉onRejected
            if(self.callbacks.length > 0) {
                // 所有成功的回调要放到队列里面去执行
                setTimeout(() => {
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(reason)
                    });
                }, 0)
            }
        }
        // 立即执行同步函数excutor
        try {
            excutor(resolve, reject)
        }catch(error) { // 如果执行器抛出异常，那么直接进入失败状态
            reject(error)
            // throw error
        }
    }
    /**
     * Promise原型对象的then()方法，指定成功和失败的回调函数
     * @param {function} onResolved
     * @param {function} onRejected
     * @return 一个新的Promise对象
     */
    MyPromise.prototype.then = function (onResolved, onRejected){
        // then不能改变状态
        const self = this
        onResolved = typeof onResolved === 'function' ? onResolved : value => value
        // 指定默认的失败的回调，并把reason传递下去,实现异常穿透关键
        onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
        // console.log(onRejected)
        // 返回一个新的Promise对象
        return new MyPromise((resolve, reject) => {
             /* 执行resolve还是reject由回调函数的返回值决定 
                1.如果抛出异常，return的promise就会失败，reason就是error
                2.如果回调函数返回非Promise，return的promise就会成功，value就是返回的值
                3.如果回调函数返回Promise，return的promise就会与这个promise的值一致
            */
            // result.then(
            //     value => resolve(value), // 当result成功时，让return的promise也成功
            //     reason => reject(reason)
            // )

            // 执行指定回调函数，根据执行结果返回改变return的promise的状态/数据
            function handle(callback) {
                try {
                    // 这个result可能是Promise，也可能不是
                    const result = callback(self.data)
                    if(result instanceof MyPromise) {
                        result.then(resolve, reject)
                    } else {
                        resolve(result)
                    }
                } catch(error) {
                    reject(error)
                    // throw error
                }
            }
           // 如果现在状态还是pending状态，把回调函数保存起来
            if(this.status === PENDING){
                this.callbacks.push({
                    onResolved (value) {
                        handle(onResolved)                      
                    },
                    onRejected (reason) {
                        handle(onRejected)
                    }
                })
            }else if(this.status === RESOLVED) {
                setTimeout(() => {
                    handle(onResolved)
                })
            }else { // 'rejected'
                setTimeout(() => {
                    handle(onRejected)
                })
            }
        })
    }
    /**
     * Promise原型对象的catch()方法，指定失败的回调函数
     * @param {function} onRejected
     * @return 一个新的Promise对象
     */
    MyPromise.prototype.catch = function (onRejected){
        return this.then(undefined, onRejected)
    }
    /**
     * Promise函数对象的resolve()方法
     * @param {*} value
     * @return 一个指定结果的成功的Promise对象
     */
    MyPromise.resolve = function (value) {
        // value可能是个promise对象
        /*
            1.如果是一般值，promise成功，成功值就是这个一般值
            2.如果是成功的promise，promise成功，value就是这个promise的value
            3.如果是失败的promise，promise失败，reason就是这个promise的reason
        */
        // 返回一个promise(可能成功也可能失败)
        return new MyPromise((resolve, reject) => {
            // value是promise
            if(value instanceof MyPromise) {
                value.then(resolve, reject)
            }else{  // value不是promise
                resolve(value)
            }
        })
    }
    /**
     * Promise函数对象的reject()方法
     * @param {*} reason
     * @return 一个指定为reason的失败的Promise对象
     */
    MyPromise.reject = function (reason) {
        // 返回一个失败的promise
        return new MyPromise((resolve, reject) => {
            reject(reason)
        })
    }
    /**
     * Promise函数对象的all()方法
     * @param {Array} promises
     * @return 一个Promise对象，只有当所有promise都成功时才成功，否则失败
     */
    MyPromise.all = function (promises) {
        // 保存成功数据的value
        const values = new Array(promises.length)
        // 用来保存成功promise的数量
        let count = 0
        // 返回一个新的promise
        return new MyPromise((resolve, reject) => {
            // 遍历获取每个promise的结果
            promises.forEach((p, index) => {
                MyPromise.resolve(p).then(
                    value => { // 将成功的结果放到最后结果中
                        values[index] = value
                        count++
                        if(count === promises.length) {
                            resolve(values)
                        }
                    },
                    reason => { // 只要一个失败了，那这个return的promise就失败了
                        reject(reason)
                    }
                )
            })
        })
    }
    /**
     * Promise函数对象的race()方法
     * @param {Array} promises
     * @return 一个Promise对象，其结果由第一个完成的Promise来决定
     */
    MyPromise.race = function (promises) {
        return new Promise((resolve, reject) => {
            // 遍历获取每个promise的结果
            promises.forEach(p => {
                MyPromise.resolve(p).then(
                    value => { // 将成功的结果放到最后结果中
                        resolve(value)
                    },
                    reason => { // 只要一个失败了，那这个return的promise就失败了
                        reject(reason)
                    }
                )
            })
        })
    }
    // 返回一个promise，在指定结果以后才产生结果
    MyPromise.resolveDelay = function (value, time) {
        return new MyPromise((resolve, reject) => {
            setTimeout(() => {
                // value是promise
                if(value instanceof MyPromise) {
                    value.then(resolve, reject)
                }else{  // value不是promise
                    resolve(value)
                }
            }, time)
        })
    }
    // 返回一个promise，在指定结果以后才失败
    MyPromise.rejectDelay = function (reason, time) {
        return new MyPromise((resolve, reject) => {
            setTimeout(() => {
                reject(reason)
            }, time)
        })
    }
    window.MyPromise = MyPromise
})(window)