const whereCompare = {
				//等于
				"=": function(a,b){
					return a == b;
				},
				//大于
				">":function(a,b){
					return a > b;
				},
				//大于等于
				">=":function(a,b){
					return a >= b;
				},
				//小于
				"<":function(a,b){
					return a < b;
				},
				//小于等于
				"<=":function(a,b){
					return a <= b;
				},
				//不等于
				"!=":function(a,b){
					return a != b;
				},
				//模糊查询
				"like":function(a,b){
					return new RegExp(b,"i").test(a);
				}
			}

			class Sql{

				constructor(dbName){

					/*
						本地缓存  => 为了提高资源利用率 
							1: 先将数据保存到本地模拟缓存 cache 中 
							2: 最后在 save 里进行数据库储存操作
					*/

					let db = {
						dbName,
						cache: {
							add: {
								data: []
							}
						}
					}

					// 将数据库与this绑定合并一起
					Object.assign(this,db);

				}

				//静态方法查询本地数据库存在资源
				static getSql(dbName){

					let db = window.localStorage.getItem(dbName) || [];
						// console.log(db)
					if(typeof db == "string"){
						return JSON.parse(db);
					}else{
						return db;
					}
					

				}

				//更新方法
				updata(Obj){

					if(/object/i.test(Obj)){

						// console.log(Obj);

						if(!this.whereFn){

							throw Error("请在此操作之前,进行where()操作!!");

						}else{

							this.cache.updata = {
								data: Obj,
								where: this.whereFn
							}

						}

					}else{
						throw Error("updata 只支持传入对象");
					}

					return this;

				}

				//数据库插入操作
				add(items){

					// console.log(items);
					// 参数设计为对象  如果用户给我非对象的结构  throw Error("参数类型错误,") 
					//由此 需要判断参数 的传入类型

					if(Array.isArray(items)){//参数类型 支持  [{...},{...}]

						//利用递归解析数组内部元素
						items.map(item => {
							this.add(item);
						})

					}else if(/object/.test(typeof items)){//参数为对象时

						// console.log("传入参数为对象");
						//将合格的 数据插入到数据缓存中待定

						this.cache.add.data.push(items);

					}else{

						throw Error("传入参数不在参数支持类型分为内")

					}


					return this; //方便链式操作

				}

				//删除数据项
				del(){

					if(!this.whereFn){

							throw Error("请在此操作之前,进行where()操作!!");

						}else{

							this.cache.del = {
								where: this.whereFn
							}

						}

						return this;

				}

				//构造查询器  => where 只是构造查询函数的作用   给予 select 和 find 方法调用
				where(...res){

						//参数范围为 2~3 位
						if(res.length >= 2 && res.length <= 3){

							let [key,compare,value] = res;

								if(value == undefined){
									value = compare;
									compare = "="
								}

							// console.log(key,compare,value);

							//排除 异端查询 嘿嘿嘿  
							if(!whereCompare[compare]){

								throw Error(`where方法不支持${compare}查询`);

							}else{

								//利用闭包 事先导入查询所需的参数 key,value [赋予其访问该变量的权限] => 构建查询函数  
								this.whereFn = (item) => {

									return whereCompare[compare](item[key],value);  //该出代码解析如下 => 

									/*
										当  compare == "=" => true 成立时
										
										"=": function(a,b){
												return a == b;
											},
											执行获取 [ a == b]; 该代码片段
									*/

								} 

							}
								// console.log(this.whereFn)

						}else{

							throw Error("参数个数不正确,正确示范=>where('a','like',1)||where('a',1)");

						}
							

					return this;
				}
				//排序方法  构造排序方法
				order(key,sort="asc"){
					//默认正序
					// console.log("倒序=>desc 正序=> asc ");
					this.sortFn = (a,b) => {

						return /desc/i.test(sort) ? b[key] - a[key] : a[key] - b[key];

					}

					return this;
				}
 
				//设置用户所需数据的量 参数 2位  limit(起点,[步长])  构造截取数据函数
				limit(start,step){


					this.limitFn = (Arr) => {
						// 传参为一个时
						if(step === undefined){

							step = start;
							start = 0;

						}else{  //传参为 2 个时

							--start;
							step += start;

						}

						return Arr.slice(start, step)

					}

					return this;
				}


				//查询多条数据
				select(){
					//获取数据库的内容
					let list = Sql.getSql(this.dbName);
					// console.log(list)

					//利用 数组自带的 filter 过滤掉没有用的数据
					let res = list.filter(this.whereFn) || [];
					// console.log(this.sortFn);
					//数组截取
					this.limitFn && (res = this.limitFn(res));
					// console.log(res)
					//数组排序
					this.sortFn && res.sort(this.sortFn);

					// console.log(res)


					return res;

				}

				//where 构建查询 函数后 进行数据逐条整理 返回给用户  查询单条
				find(){

					//数据库查询的条目
					let list = Sql.getSql(this.dbName);
					// console.log(list)

					if(!this.whereFn){

						throw Error("缺少匹配条件,请先进行 .where(...) 操作在用 find()")
					
					}
					//如果匹配不到数据 则返回一个空数组
					let res = list.find(this.whereFn) || [];
					// res => 匹配到的结果  是一个 Array
					// console.log("主人!查询数据如下");
					// console.log(res)
					//后期可对 res 做各种逻辑处理

					return res;
				}

				//保存阶段
				save(){

					let list = Sql.getSql(this.dbName);

					// 检查是否存在删除函数
					if (this.cache.del) {

						list = list.filter(item => {

							return !this.cache.del.where(item);

						});

					}

					//检查是否存在更新函数
					if(this.cache.updata){

						list.map(item => {

							if(this.cache.updata.where(item)){//判断是否符合查询内容

								Object.assign(item,this.cache.updata.data)

							}

						})

					}

					list.push(...this.cache.add.data)
					if(list.length == 0){
						throw Error("不可插入空的数据")
					}
					window.localStorage.setItem(this.dbName,JSON.stringify(list));
					
					//存入数据库后 清除数据缓存 
					this.cache.add.data = [];
					console.log("主人!数据以存入数据库,缓存清空完成!")
					return this;
				}

			}

			

				
				
