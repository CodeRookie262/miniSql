let Sql = (function(){
  function compareFn(compare){
    //采用设计模式中的策略模式处理数据筛选核心判断代码片段
    let obj = {
      ">": function(key,value){
        return key > value;
      },
      ">=": function (key, value) {
        return key >= value;
      },
      "<": function (key, value) {
        return key < value;
      },
      "<=": function (key, value) {
        return key <= value;
      },
      "=": function (key, value) {
        return key == value;
      },
      "!=": function (key, value) {
        return key != value;
      },
      "like": function (key, value) {
        let reg = new RegExp(value,"ig");
        return reg.test(key);
      },
    }

    return obj[compare] || obj["="];
  }

  return class {
    constructor(dbName) {
      //dbName => 数据库的名字
      // 定义初始数据结构
      let object = {
        dbName, //数据库名字
        cache: {//数据先处理后在进行缓存才是优等方法
          add: [] //需要储存的数据
        }
      }

      Object.assign(this, object);

    }
    //添加数据  支持的格式 => {...},[[{item:[{...}]}]]等复杂数据结构
    //但是最终单体必须为 Object 类型
    //支持多参数
    add(...data) {
      data.forEach(item => {
        // console.log(Array.isArray(item))
        //判断数据类型
        if (/object/i.test(typeof item) && !Array.isArray(item)) {

          this.cache.add.push(item);

        } else if (Array.isArray(item)) {//如果是个数组,则遍历每一项,然后递归调用 add 方法进行处理数据
          item.forEach(it => {
            this.add(it);
          })
        }

      })
      //add 支持链式操作
      return this;
    }

    //删除数据
    del(){
      if(this.whereFn){
        this.cache.del = {
          delFn: this.whereFn
        }
      }else{
        throw new Error("暂未创建查询函数,请在此操作前执行where方法构建查询条件!!")
      }

      //del 支持链式操作
      return this;
    }

    //更新数据
    updata(obj){
      if(/object/i.test(typeof obj)){
        if(!this.whereFn){
          throw new Error("暂未创建查询函数,请在此操作前执行where方法构建查询条件!!")
        }
        this.cache.updata = {
          data: obj,
          upFn: this.whereFn
        }
      }

      //updata 支持链式操作
      return this;
    }

    //获取数据库数据
    static getSql(dbName) {
      let db = wx.getStorageSync(dbName) || [];

      return db;
    }
    //查询函数构造器 支持参数为 (key=>键,compare=>比较方式,vlaue=>值)
    // 当2个值的话,compare为 等号
    where(key,compare,value){
      if (!key || !compare){
        throw new Error("参数缺少!!")
      }
      if(value === undefined){
        let [compare, value] = ["=", compare];

      }
      //构建函数
      this.whereFn = (ObjItem) => {
        // ObjItem 表示数据库内部数组里面的对象项,因为Array的filter,sort...可以遍历数组
        //利用闭包返回代码判断识别片段
        return compareFn(compare)(ObjItem[key],value);
        
      }
      //where 方法支持链式操作
      return this;
    }

    //数据排序 asc => 正序  desc => 降序 type = asc || desc / 默认方式为正序(asc)  
    order(key,type = "asc"){
      this.sortFn = (a,b) =>{
        const method = type === "desc" ? b[key] - a[key] : a[key] - b[key];
        return method;
      }

      // order 支持链式操作
      return this;
    }

    //数据分页 limit 至少必须传入一个参数 
    /*
      一个参数的时候,表示从第 0 条截取到到 start 条
      两个参数的时候,表示从第 start 条为起点,截取 step 条数据
    */
    limit(start = 1,step){
      // if(start == undefined) throw new Error("参数不可为空!!请传入参数/(*_*)\\");
      if(!step){
        [start,step] = [0,start];
      }else{
        [start, step] = [--start, start + step];
      }
      console.log(start,step)
      this.limitFn = Arr => {
        console.log(Arr.slice(start, step))
        return Arr.slice(start,step);
      }

      //limit 支持链式操作
      return this;
    }

    //单条查询
    find(key){
      if(this.whereFn){
        //获取数据库内部的全部数据
        let db = Sql.getSql(this.dbName);

        //如果排序存在函数构建且存在的话,即执行
        this.sortFn && db.sort(this.sortFn);

        //数据分页
        this.limitFn && (db = this.limitFn(db));

        const item = db.find(this.whereFn);
            console.log(item);
        return item;
      }else{
        throw new Error("暂未创建查询函数,请在此操作前执行where方法构建查询条件!!")
      }
    }

    //多条查询
    select(){
      if (this.whereFn) {
        //获取数据库内部的全部数据
        let db = Sql.getSql(this.dbName);

        //筛选数据
        db = db.filter(this.whereFn);

        //如果排序存在函数构建且存在的话,即执行
        this.sortFn && db.sort(this.sortFn);

        //数据分页
        this.limitFn && (db = this.limitFn(db));

        console.log(db);
        return db;
      } else {
        throw new Error("暂未创建查询函数,请在此操作前执行where方法构建查询条件!!")
      }
    }

    save() {
      //获取数据库的全部数据
      let db = Sql.getSql(this.dbName);
      //将缓存数据正式储存到本地数据库中
      
      //删除数据
      this.cache.del && (db = db.filter(item => !this.whereFn(item))) 
      this.cache.del = null;
      //更新数据
      if(this.cache.updata){
        db.forEach(item => {
          if(this.whereFn(item)){
            Object.assign(item,this.cache.updata.data)
          }
        })
        this.cache.updata = null;
      }

      db.push(...this.cache.add);
      wx.setStorageSync(this.dbName, db);
      this.cache.add = [];
    }

  }
})()

export default Sql;