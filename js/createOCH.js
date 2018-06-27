var createOCH = new Object();

function createTheOCModelFile(json_obj, className, superName, sSuperName) {
	if(superName == "") {
		superName = "NSObject"
	}
	if(sSuperName == "") {
		sSuperName = "NSObject"
	}
	createOCH.classArr = [];
	createOCH.hBody = [];
	createOCH.mBody = [];
	createOCH.hClassBody = [];
	createOCH.mClassBody = [];
	createOCH.json_obj = json_obj;
	createOCH.className = className;
	createOCH.superName = superName;
	createOCH.sSuperName = sSuperName;
	createOCH.createOCMFile();
	createOCH.createHeaderFile();
	for(var i = 0; i < createOCH.hClassBody.length; i++) {
		createOCH.hBody.push(createOCH.hClassBody[i])
	}
	for(var i = 0; i < createOCH.mClassBody.length; i++) {
		createOCH.mBody.push(createOCH.mClassBody[i])
	}

	var classNamesStr = createOCH.createClassNames();
	createOCH.hBody.splice(1, 0, classNamesStr);
}

createOCH.createClassNames = function() {
	if(this.attributeCount(this.classArr) > 0) {
		var classNamesStr = "@class ";
		classNamesStr += this.classArr[0];
		for(var i = 1; i < this.classArr.length; i++) {
			classNamesStr += ", " + this.classArr[i];
		}
		classNamesStr += ";" + this.newline();
		return classNamesStr;
	} else {
		return "";
	}
}

createOCH.attributeCount = function(obj) {
	var count = 0;
	for(var i in obj) {
		if(obj.hasOwnProperty(i)) { // 建议加上判断,如果没有扩展对象属性可以不加
			count++;
		}
	}
	return count;
}

createOCH.createHeaderFile = function() {
	this.hBody.push(this.importFile(this.superName + ".h"));
	this.hBody.push(this.createInterface(this.className, this.superName));
	createHeaderFileBody(this.json_obj, function(self, attribute) {
		self.hBody.push(attribute);
	})
	this.hBody.push(this.createEnd());
}

function createHeaderFileBody(json_obj, callBack, classBody) {
	for(var key in json_obj) {
		callBack(createOCH, createOCH.buildTheAttributeWithValue(json_obj[key], key, classBody));
	}
}

createOCH.createOCMFile = function() {
	this.mBody.push(this.importFile(this.className + ".h"))
	this.mBody.push(this.createImplementation(this.className))
	this.mBody.push(this.createEnd());
}

createOCH.buildTheAttributeWithValue = function(value, key, classBody) {
	if(typeof(value) == "string") {
		return '@property (nonatomic, copy) NSString * ' + key + ';\n' + this.newline()
	} else if(typeof(value) == "number") {
		if(this.CheckFloat(value)) {
			return '@property (nonatomic, assign) CGFloat ' + key + ';\n' + this.newline()
		} else {
			return '@property (nonatomic, assign) NSInteger ' + key + ';\n' + this.newline()
		}
	} else if(typeof(value) == "object") {
		var classObject = new Object();
		classObject.keyModel = "";
		classObject.body = "";
		classObject.mbody = "";

		if(value instanceof Array) {

			for(var i = 0; i < key.length; i++) {
				if(i == 0) {
					classObject.keyModel += key[i].toUpperCase();
				} else {
					classObject.keyModel += key[i];
				}
			}
			classObject.keyModel += "Model";
			this.classArr.push(classObject.keyModel)

			classObject.mbody += this.createImplementation(classObject.keyModel);
			classObject.body += (this.createInterface(classObject.keyModel, this.sSuperName));
			if(classBody) {
				classBody.mbody += this.classArraySetter(value, key, classObject.keyModel)
			}else{
				this.mBody.splice(2, 0, this.classArraySetter(value, key, classObject.keyModel));
			}
			createHeaderFileBody(value[0], function(self, attribute) {
				classObject.body += (attribute);
			}, classObject)

			classObject.body += (this.createEnd());
			classObject.mbody += this.createEnd();

			this.mClassBody.push(classObject.mbody);
			this.hClassBody.push(classObject.body);
			return '@property (nonatomic, strong) NSMutableArray <' + classObject.keyModel + '*>* ' + key + ';\n' + this.newline()
		} else if(value instanceof Object) {
			if(this.attributeCount(value) == 0) {
				return '@property (nonatomic, strong) NSDictionary * ' + key + ';\n' + this.newline()
			} else {
				for(var i = 0; i < key.length; i++) {
					if(i == 0) {
						classObject.keyModel += key[i].toUpperCase();
					} else {
						classObject.keyModel += key[i];
					}
				}
				classObject.keyModel += "Model";
				this.classArr.push(classObject.keyModel)
				classObject.body += (this.createInterface(classObject.keyModel, this.sSuperName));
				classObject.mbody += this.createImplementation(classObject.keyModel);
				if(classBody) {
					classBody.mbody += this.classObjectSetter(value, key, classObject.keyModel)
				}else{
					this.mBody.splice(2, 0, this.classArraySetter(value, key, classObject.keyModel));
				}
				createHeaderFileBody(value, function(self, attribute) {
					classObject.body += (attribute);
				}, classObject)
				classObject.body += (this.createEnd());
				classObject.mbody += this.createEnd();

				this.mClassBody.push(classObject.mbody);
				this.hClassBody.push(classObject.body);
				return '@property (nonatomic, strong) ' + classObject.keyModel + ' * ' + key + ';\n' + this.newline()
			}
		}
	} else if(typeof(value) == "boolean") {
		return '@property (nonatomic, assign) BOOL ' + key + ';\n' + this.newline()
	}
	return "";
}

createOCH.newline = function() {
	return '\n';
}
/*
 -(void)setRole:(NSMutableArray *)role{
    _role = [[NSMutableArray alloc]init];
    for (NSDictionary * dict in role) {
        RoleModel * model = [[RoleModel alloc]init];
        [model setValuesForKeysWithDictionary:dict];
        [_role addObject:model];
    }
}

-(void)setDispatch:(NSDictionary *)dispatch
 * */
createOCH.classObjectSetter = function(value, key, keyModel) {
	var selKey = ''
	for(var i = 0; i < key.length; i++) {
		if(i == 0) {
			selKey += key[i].toUpperCase();
		} else {
			selKey += key[i];
		}
	}
	var setter = '-(void)set' + selKey + ':(NSDictionary *) ' + key + this.newline() +
		'{' + this.newline() +
		'\t' + "_" + key + '= [[' + keyModel + ' alloc]init];' + this.newline() +
		'\t' + '[_' + key + ' setValuesForKeysWithDictionary:' + key + '];' + this.newline() +
		'}' + this.newline()
	return setter;
}

createOCH.classArraySetter = function(value, key, keyModel) {
	var selKey = ''
	for(var i = 0; i < key.length; i++) {
		if(i == 0) {
			selKey += key[i].toUpperCase();
		} else {
			selKey += key[i];
		}
	}
	var setter = '-(void)set' + selKey + ':(NSMutableArray *) ' + key + this.newline() +
		'{' + this.newline() +
		'\t' + "_" + key + '= [[NSMutableArray alloc]init];' + this.newline() +
		'\t' + 'for (NSDictionary * dict in ' + key + ') {' + this.newline() +
		'\t\t' + keyModel + ' * model = [[' + keyModel + ' alloc]init];' + this.newline() +
		'\t\t' + '[model setValuesForKeysWithDictionary:dict];' + this.newline() +
		'\t\t' + "[_" + key + ' addObject:model];' + this.newline() +
		'\t}' + this.newline() +
		'}' + this.newline()
	return setter;
}

createOCH.importFile = function(fileName) {
	if(fileName == "NSObject.h") {
		return this.newline() + "#import <Foundation/Foundation.h>" + this.newline();
	}
	return this.newline() + "#import \"" + fileName + "\"" + "\n" + this.newline();
}

createOCH.createInterface = function(className, superClass) {
	return "@interface " + className + " : " + superClass + this.newline() + this.newline();
}

createOCH.createImplementation = function(className) {
	return "@implementation " + className + this.newline() + this.newline();
}

createOCH.createEnd = function() {
	return "@end" + this.newline();
}

//带小数点
createOCH.CheckFloat = function(n) {
	return parseInt(n) != n;
}

//function fileHeaderDes(fileName) {
//	return "//" + newline() +
//		"//" + fileName + newline() +
//		"//" + newline() +
//		"//" +
//		"//  Created by ZKLW on 2017/10/31." + newline() +
//		"//  Copyright © 2017年 ZKLW. All rights reserved." + newline() +
//		"//" + newline();
//}