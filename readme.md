
				
> 数据库插入语句
```
	sql.add([{a:1},{b:2}]).save()	支持
	sql.add([{a:1},{b:2}]).add([{c:3},{d:4}]).save()  支持
	sql.add([{a:1},{b:2}]).save().add([{c:3},{d:4}]).save();  支持
```
> 数据库单条查询语句
```
	sql.where("a","=",1).find();  支持 直接返回数据 不可在继续链式操作
```
> 数据库多条查询语句
```
	 sql.where("a","=",1).select();  //支持 直接返回数据 不可在继续链式操作

	where() 参数 最少2位  最多3位 where(key,[compare,]value) compare 可选

	compare 支持参数 =>    

	(1)= 等于  (2) != 不等于   (3) > 大于  (4) >= 大于等于  (5) < 小于  (6) <= 小于等于  (7) like 模糊查询
```	
> 数据库排序
```
	order(key[,"desc"||"asc"])  key => 必要   默认 正序
	sql.where("a","like",1).order("a","desc")
```
> 数据库分页
```
	limit(start[,end]) 

	start 必填  end 可选

	使用前必须填写条件

	sql.where([条件]).limit(start[,end]).find()
	sql.where([条件]).limit(start[,end]).order(key[,"desc"||"asc"]).find()

	sql.where([条件]).limit(start[,end]).select()
	sql.where([条件]).limit(start[,end]).order(key[,"desc"||"asc"]).select()
```

> 删除数据项目 需要有筛选条件!! 最后还要配合 .save() 才可以达到删除数据的目的
```
	sql.where([条件]).del().save()
```
> 更新数据项  需要有筛选条件!! 最后还要配合 .save() 才可以达到更新数据的目的
```
	updata(Object) => 传入参数必须是一个对象!!
	sql.where([条件]).updata({...}).save()
```


	支持链式操作的 API   (1) sql()   (2) add()   (3) del()   (4) where()  (5) limit()    (6)  order()

	不支持链式操作的 API (1) find()  (2) select() 
