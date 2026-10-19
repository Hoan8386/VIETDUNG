define([],

() => {
	
	const isContainValue = (value) => {
		let isContain = false;
		if(value !== undefined && value !== null && value !== '') {
			if(util.isArray(value)) {
				if(value.length > 0) {
					isContain = true;
				}
			} else {
				isContain = true;
			}
		}
		return isContain;
	}		
	
	/**
	 * Example
	 * let lOne = [{a: 1, b: 2, c: 3}, {a: 2, b: 2, c: 3}, {a: 3, b: 1, c: 3}, {a: 4, b: 2, c: 5}];
	 * let lTwo = [{a: 1, d: 2, e: 3}, {a: 2, d: 2, e: 3}, {a: 3, d: 2, e: 3}, {a: 4, d: 1, e: 3}];
	 * let key1 = ['a', 'b', 'c'];
	 * let key2 = ['a', 'd', 'e'];
	 * let keyCopare = [{key1: 'a', key2: 'a'}, {key1: 'b', key2: 'd'}];
	 * let operator = 'left'; on, right, full
	 */
	const joinTwoArrayObject = (lOne, lTwo, key1, key2, keyCopare, operator) => {
		let lg1 = lOne.length;
		let lg2 = lTwo.length;
		let lk1 = key1.length;
		let lk2 = key2.length;
		let lgKey = keyCopare.length;
		let arrRes = [], objT, isEqual, n2Temp = 0, tempValue;
		for(let i = 0; i < lg1; i++) {
		    isEqual = false;
		 	for(let j = 0; j < lg2; j++) {
		 		 isEqual = true;
		 		 if(lTwo[j].flagcomparek2 === true && (operator === 'on' || operator === 'left')) {
		 			isEqual = false;
		 		 } else {
			      	 for(let n = 0; n < lgKey; n++) {
			             if(lOne[i][keyCopare[n].key1] === lTwo[j][keyCopare[n].key2]) {
			                  if(isEqual) { 
			                       n2Temp = j;
			                  }  
			             } else {
			                  isEqual = false;break;
			             }
			         }
		 		 }
		 		if(isEqual) {
					lOne[i].flagcomparek1 = true;lTwo[n2Temp].flagcomparek2 = true;
					objT = {};
					for(let k1 = 0; k1 < lk1; k1++) {
						objT[key1[k1]] = lOne[i][key1[k1]];
					}
					for(let k2 = 0; k2 < lk2; k2++) {
						tempValue = lTwo[n2Temp][key2[k2]];
						if(isContainValue(tempValue)) {
							objT[key2[k2]] = tempValue;
						}
					}
					arrRes.push(objT);
				}
			}
		 
			if((operator === 'left' || operator === 'full') && !(lOne[i].flagcomparek1 === true)) {
				objT = {};
				for(let k1 = 0; k1 < lk1; k1++) {
					objT[key1[k1]] = lOne[i][key1[k1]];					
				}
				arrRes.push(objT);	
			}	
		}
		//let lar = arrRes.length, isEqual;
		if(operator === 'right' || operator === 'full') {
			for(let i = 0; i < lg2; i++) {
				if(!(lTwo[i].flagcomparek2 === true)) {
					objT = {};
					for(let k2 = 0; k2 < lk2; k2++) {
						objT[key2[k2]] = lTwo[i][key2[k2]];
					}
					arrRes.push(objT);
				}
			}
		}
		return arrRes;
	}
	
	const newTime = (tempdate) => {
		let hm = tempdate.split(':');
		if(hm.length === 2) {
			tempdate = new Date();
			tempdate.setHours(hm[0]);
			tempdate.setMinutes(hm[1]);
		} else {
			tempdate = '';
		}
		return tempdate;
	}
	
	const newDate = (tempdate) => {
		tempdate = tempdate.split('-');
		if(tempdate.length === 3) {
			tempdate = new Date(tempdate[0], (tempdate[1] * 1 - 1), tempdate[2]);
		} else {
			tempdate = '';
		}
		return tempdate;
	}
	
	const iterationCopy = (src) => {
		let target = {};
		for (let prop in src) {
			if (src.hasOwnProperty(prop)) {
				if (isObject(src[prop])) {
				target[prop] = iterationCopy(src[prop]);
				} else {
				target[prop] = src[prop];}
			}
		}
		return target;
	}
	
	const getDateGMT = (time, gmt) => {
		let now = new Date(time);
    	let sdate = now.toString();
    	let p1 = sdate.substring(28,29);
    	let p2 = sdate.substring(29,31);
    	let tcurr = gmt;
    	if(p1 === '-') {
    		tcurr = tcurr + 1 * p2;
    	} else {
    		tcurr = tcurr - 1 * p2;
    	}
		return new Date(now.getTime() + (tcurr * 3600000));
	}
	
	const getDateGMTWithDate = (date, gmt) => {
		let sdate = date.toString();
    	let p1 = sdate.substring(28,29);
    	let p2 = sdate.substring(29,31);
    	let tcurr = gmt;
    	if(p1 === '-') {
    		tcurr = tcurr + 1 * p2;
    	} else {
    		tcurr = tcurr - 1 * p2;
    	}
		return new Date(date.getTime() + (tcurr * 3600000));
	}
	
	const getTimeFromDate = (date, gmt) => {
		let sdate = date.toString();
    	let p1 = sdate.substring(28,29);
    	let p2 = sdate.substring(29,31);
    	let tcurr = gmt;
    	if(p1 === '-') {
    		tcurr = tcurr + 1 * p2;
    	} else {
    		tcurr = tcurr - 1 * p2;
    	}
		return date.getTime() - tcurr * 3600000;
	}
	
	const sortArayOfObject = (arrayOfObjects, field) => {
    	arrayOfObjects.sort(function(a,b) {
    	    let x = a[field].toLowerCase();
    	    let y = b[field].toLowerCase();
    	    return x < y ? -1 : x > y ? 1 : 0;
    	});
    }
	
	const sortArayOfObjectFlowFields = (arrayOfObjects, fields) => {
    	arrayOfObjects.sort(function(a,b) {
    		let x;
    	    let y;
    		let lF = fields.length;
    		let vl = 0;
    		for(let i = 0; i < lF; i++) {
    			if(vl === 0) {
	    			x = a[fields[i]].toLowerCase();
	        	    y = b[fields[i]].toLowerCase();
	        	    if(x < y) {
	        	    	vl = -1;
	        	    } else if(x > y) {
	        	    	vl = 1;
	        	    }
    			}
    		}    	    
    	    return vl;
    	});
    }
	
	const toFixed = (value, fix) => {
		let vfix = value;
		if(!!value) {
			vfix = value.toFixed(fix);
			if(vfix.indexOf('\.') !== -1) {
				let lVf = vfix.length - 1;
				let count = 0;
				for(let i = lVf; i >= 0; i--) {
					if(vfix[i] === '0') {
						count++;
					} else {
						break;
					}  
				}
				if(count !== 0) {
					vfix = vfix.substring(0, lVf - count + 1);
				}
			} else {
				vfix = value;
			}
		}
		return vfix;
	}
	
	const findListObject = (listValue, objCon) => {
		let listObj = [], isGet;
		for(let i in listValue) {
			isGet = true;
			for(let key in objCon) {
				if(listValue[i][key] !== objCon[key]) {
					isGet = false;break;					
				}
			}
			if(isGet) {
				listObj.push(listValue[i]);
			}
		}
		return listObj;
	}
	
	const getFirstObject = (listValue, objCon) => {
		let obj = null, isGet;
		for(let i in listValue) {
			isGet = true;
			for(let key in objCon) {
				if(listValue[i][key] !== objCon[key]) {
					isGet = false; break;					
				}
			}
			if(isGet) {
				obj = listValue[i]; break;
			}
		}
		return obj;
	}
	
	const getLastObject = (listValue, objCon) => {
		let obj = null, isGet;
		for(let i in listValue) {
			isGet = true;
			for(let key in objCon) {
				if(listValue[i][key] !== objCon[key]) {
					isGet = false; break;					
				}
			}
			if(isGet) {
				obj = listValue[i];
			}
		}
		return obj;
	}
	
	//start = 0 fieldCompare (field to group), fieldSum field number to sum
	const compositeListObject = (arrObj, fieldCompare, fieldSum, start) => {
    	let lAOR = arrObj.length;
    	let lAO = lAOR - 1;
    	let lFC = fieldCompare.length;
    	let lFS = fieldSum.length;
    	let isFlag = false, count;
    	let istart = start || 0, temp1, temp2;
    	for(let i = start; i < lAO; i++) {
    		count = 0;
    		for(let n = i + 1; n < lAOR; n++) {
    			isFlag = true;
    			for(let j = 0; j < lFC; j++) {
    				isFlag = true;
    				temp1 = arrObj[i][fieldCompare[j]];
					temp2 = arrObj[n][fieldCompare[j]];					
    				if(temp1 !== temp2) {
        				isFlag = false;
        				break;
        			}
        		}
        		if(isFlag) {
        			for(let j = 0; j < lFS; j++) {
        				arrObj[i][fieldSum[j]] = convertToFloat(arrObj[i][fieldSum[j]]) + convertToFloat(arrObj[n][fieldSum[j]]);
        			}
        			arrObj.splice(n,1);
        			count++; lAOR = lAOR - 1; lAO = lAO - 1;n--;
        			//break;
        		} 
    		}
    		istart = i;
    		/*if(count > 0) {
    			isSplice = true;
    			break;
    		}*/
    	}
    	/*if(isSplice) {
    		compositeListObject(arrObj, fieldCompare, fieldSum, istart);
    	}*/
    }
	
	const convertToFloat = (input) => {
		let value = null;
		if(!!input && !isNaN(input)) {
			value = parseFloat(input);
		}
		return value;
	}
	
	const removeVietnameseTones = (str) => {
	    str = str.toString();
	    if (!!str) {
	        str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
	        str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
	        str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
	        str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
	        str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
	        str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
	        str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
	        str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
	        str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
	        str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
	        str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
	        str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
	        str = str.replace(/đ/g, "d");
	        str = str.replace(/Đ/g, "D");
	        
	        str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ̀ ́ ̃ ̉ ̣  huyền, sắc, ngã, hỏi, nặng
	        str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ˆ ̆ ̛  Â, Ê, Ă, Ơ, Ư
	        str = str.replace(/ + /g," ");
	        str = str.trim();
	        str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
	        return str;
	    } else {
	        return "";
	    }
	}
	
	const removeAccents = (str) => {
	  let AccentsMap = [
	    "aàảãáạăằẳẵắặâầẩẫấậ",
	    "AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬ",
	    "dđ", "DĐ",
	    "eèẻẽéẹêềểễếệ",
	    "EÈẺẼÉẸÊỀỂỄẾỆ",
	    "iìỉĩíị",
	    "IÌỈĨÍỊ",
	    "oòỏõóọôồổỗốộơờởỡớợ",
	    "OÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢ",
	    "uùủũúụưừửữứự",
	    "UÙỦŨÚỤƯỪỬỮỨỰ",
	    "yỳỷỹýỵ",
	    "YỲỶỸÝỴ"    
	  ];
	  for (let i=0; i<AccentsMap.length; i++) {
	    let re = new RegExp('[' + AccentsMap[i].substr(1) + ']', 'g');
	    let char = AccentsMap[i][0];
	    str = str.replace(re, char);
	  }
	  return str;
	}
	
    return {
    	joinTwoArrayObject,
    	newTime,
		newDate,
		iterationCopy,
		getDateGMT,
		getDateGMTWithDate,
		getTimeFromDate,
		sortArayOfObject,
		sortArayOfObjectFlowFields,
		toFixed,
		findListObject,
		getFirstObject,
		getLastObject,
		compositeListObject,
		convertToFloat,
		removeVietnameseTones,
		removeAccents
    };
    
});
