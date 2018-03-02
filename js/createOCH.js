var createOCH = new Object();

function createTheOCModelFile(json_obj, className, superName) {
	createOCH.classArr = [];
	createOCH.hBody = [];
	createOCH.mBody = [];
	createOCH.hClassBody = [];
	createOCH.mClassBody = [];
	createOCH.json_obj = json_obj;
	createOCH.className = className;
	createOCH.superName = superName;
	createOCH.createHeaderFile();
	createOCH.createOCMFile();
	for(var i = 0; i < createOCH.hClassBody.length; i++) {
		createOCH.hBody.push(createOCH.hClassBody[i])
	}
	for(var i = 0; i < createOCH.mClassBody.length; i++) {
		createOCH.mBody.push(createOCH.mClassBody[i])
	}
	
	var classNamesStr = createOCH.createClassNames();
	createOCH.hBody.splice(1, 0, classNamesStr);
}

createOCH.createClassNames = function(){
	if(this.attributeCount(this.classArr) > 0){
		var classNamesStr = "@class ";
		classNamesStr += this.classArr[0];
		for (var i = 1; i < this.classArr.length; i++) {
				classNamesStr += ", " + this.classArr[i];
		}
		classNamesStr += ";" + this.newline();
		return classNamesStr;
	}else{
		return "";
	}
}

createOCH.attributeCount = function(obj) {
        var count = 0;
        for(var i in obj) {
            if(obj.hasOwnProperty(i)) {  // 建议加上判断,如果没有扩展对象属性可以不加
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

function createHeaderFileBody(json_obj, callBack) {
	for(var key in json_obj) {
		callBack(createOCH, createOCH.buildTheAttributeWithValue(json_obj[key], key));
	}
}

createOCH.createOCMFile = function() {
	this.mBody.push(this.importFile(this.className + ".h"))
	this.mBody.push(this.createImplementation(this.className))
	this.mBody.push(this.createEnd());
}

createOCH.buildTheAttributeWithValue = function(value, key) {
	if(typeof(value) == "string") {
		return '@property (nonatomic, copy) NSString * ' + key + ';\n' + this.newline()
	} else if(typeof(value) == "number") {
		if(this.CheckFloat(value)) {
			return '@property (nonatomic, assign) CGFloat ' + key + ';\n' + this.newline()
		} else {
			return '@property (nonatomic, assign) NSInteger ' + key + ';\n' + this.newline()
		}
	} else if(typeof(value) == "object") {
		if(value instanceof Array) {
			return '@property (nonatomic, strong) NSArray * ' + key + ';\n' + this.newline()
		} else if(value instanceof Object) {
			if(this.attributeCount(value) == 0) {
				return '@property (nonatomic, strong) NSDictionary * ' + key + ';\n' + this.newline()
			} else {
				var keyModel = "";
				for (var i = 0; i < key.length; i++) {
					if (i == 0) {
							keyModel +=	key[i].toUpperCase();
					}else{
						keyModel += key[i];
					}
				}
				keyModel += "Model";
				this.classArr.push(keyModel)
				var body = "";
				var mbody = "";
				body += (this.createInterface(keyModel, "CHQModel"));
				createHeaderFileBody(value, function(self, attribute) {
					body += (attribute);
				})
				body += (this.createEnd());
				
				mbody += this.createImplementation(keyModel);
				mbody += this.createEnd();
				
				this.mClassBody.push(mbody);
				this.hClassBody.push(body);
				return '@property (nonatomic, strong) ' + keyModel + ' * ' + key + ';\n' + this.newline()
			}
		}
	}else if(typeof(value) == "boolean"){
		return '@property (nonatomic, assign) BOOL ' + key + ';\n' + this.newline()
	}
	return "";
}

createOCH.newline = function() {
	return '\n';
}

createOCH.importFile = function(fileName) {
	if(fileName == null) {
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