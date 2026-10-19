/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  31 Dec 2024         Huy Pham                Init & create file
 */
define(['N/dataset'],
function(dataset) {
	const ID = "";

	const RECORDS = {}

	const loadDataSettWithCondition = (_id, _conditions) =>{
		let resultDataset = dataset.load(_id);
		let myCondition = [];
		
		if(util.isArray(_conditions)){
			_conditions.forEach(_objCondition => myCondition.push(_objCondition));
		}
		else if(util.isObject(_conditions) || typeof(_conditions) == "object"){
			myCondition.push(_conditions)
		}
		
		if(myCondition.length > 0){
			let finalCondition = [];
			if(!!resultDataset.condition){
				finalCondition.push(resultDataset.condition);
			}
			
			finalCondition.push(dataset.createCondition({operator: 'AND', children: myCondition}));

			resultDataset.condition = dataset.createCondition({
				operator: "AND",
				children: finalCondition
			});
		}
		
		return resultDataset;
	}

	/**
	 * 
	 * @param {Object} _resultDatasetFullPage : search obbject
	 * @param {Object} _params : page, rangePageFetch
	 * @param {function} _funcObjectMappingColumn : 
	 * @returns 
	 */
	const fetchResultDatasetPage = (_resultDatasetFullPage, _params, _funcObjectMappingColumn) =>{
		_params.rangePageFetch = Number(_params.rangePageFetch||1);
		_params.page = Number(_params.page||0);

		let arrResult = []
		
		let ttlPage = _resultDatasetFullPage.pageRanges.length;
		let idxPageFetched = _params.page;
		let maxPageFetch = _params.page + _params.rangePageFetch;

		for(let i = _params.page; i < _resultDatasetFullPage.pageRanges.length; i++){
			if(i >= maxPageFetch){
				break;
			}
			idxPageFetched = i;
			let currentPage = _resultDatasetFullPage.fetch({index : (i)}).data;

			let myColumns = currentPage.columns;
			let arrResultOfPage = currentPage.results;

			for(let idx = 0; idx < arrResultOfPage.length; idx++){
				let objCurPage = arrResultOfPage[idx];
				let objRes = _funcObjectMappingColumn(objCurPage, myColumns);

				arrResult.push(objRes);
			}
		}

		return {arrResult: arrResult, info: {page: idxPageFetched, ttlPage: ttlPage, rangePageFetch: _params.rangePageFetch}};
	}
	
	const fetchResultDatasetAllPage = (_resultDatasetFullPage, _funcObjectMappingColumn) =>{
		let arrResult = [];

		for(let idxPage = 0; idxPage < _resultDatasetFullPage.pageRanges.length; idxPage++){
			let currentPage = _resultDatasetFullPage.fetch({index : idxPage}).data;

			let myColumns = currentPage.columns;
			let arrResultOfPage = currentPage.results;
                
            for(let i = 0; i < arrResultOfPage.length; i++){
                let objCurPage = arrResultOfPage[i];

                let objRes = _funcObjectMappingColumn(objCurPage, myColumns);

                arrResult.push(objRes);
            }
		}

		return arrResult;
	}

	const fetchResultDatasetRun = (_resultDataset, _funcObjectMappingColumn) =>{
		let myColumns = _resultDataset.columns;
		let resultSearch = _resultDataset.run().results;
		let arrResult = [];
		for(var i = 0; i < resultSearch.length; i++){
			let objCurPage = resultSearch[i];

			let objRes = _funcObjectMappingColumn(objCurPage, myColumns);

			arrResult.push(objRes);
		}

		return arrResult;
	}
	
	const replaceValueNoneByKey = (_objRes, _arrKey = []) =>{
		if(_arrKey.length == 0){
			_arrKey = Object.keys(_objRes);
		}

		for(let i = 0; i < _arrKey.length; i++){
			let keyId = _arrKey[i];
			if(!keyId) continue;

			if(!!_objRes[keyId] &&  typeof(_objRes[keyId]) == "string"){
				_objRes[keyId] = _objRes[keyId].replace("- None -", "")
			}
		}
	}
	
	const getObjResultFromDatasetByKey = (_objSearch, _arrKey) =>{
		let objRes = {};

		let arrValueOfRow = _objSearch.values;

		arrValueOfRow.forEach((_value, index) =>{
			objRes[_arrKey[index]] = _value;
		});
		
		return objRes;
	}
	
	const getObjResultFromDatasetWithLabel = (_objSearch, _myColumns) =>{
		let arrColKey = getDataKeyByColumnDataset(_myColumns);

		let objRes = getObjResultFromDatasetByKey(_objSearch, arrColKey);
		
		return objRes;
	}

	const getDataKeyByColumnDataset = (_myColumns) =>{
		let arrColKey = [];

		for(let i = 0; i < _myColumns.length; i++){
			let eleColumn = _myColumns[i];

			let keyId = formatStringToKeyID(eleColumn.label);

			let idxColKey_find = arrColKey.findIndex(_key => _key == keyId);
			if(idxColKey_find == -1){
				arrColKey.push(keyId)
			}else{
				keyId = keyId + "_" + i;
				arrColKey.push(keyId)
			}
		}

		return arrColKey;
	}

	const formatStringToKeyID = (_strInput) => {
		return removeAccents(_strInput.toLowerCase().replaceAll(" ","")/* .replace(/[^a-zA-Z0-9 ]/g, '') */)
	}

	function removeAccents(str) {
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
		return str.trim();
	}

    return {
		ID: ID,
		TYPE: "",
		RECORDS: RECORDS,
		loadDataSettWithCondition,
		fetchResultDatasetPage,
		fetchResultDatasetAllPage,
		fetchResultDatasetRun,
		replaceValueNoneByKey,
		getObjResultFromDatasetByKey,
		getObjResultFromDatasetWithLabel,
		getDataKeyByColumnDataset,
		formatStringToKeyID
    };
    
});
