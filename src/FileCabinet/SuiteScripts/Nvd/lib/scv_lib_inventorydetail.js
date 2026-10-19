/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  06 Jan 2025         Huy Pham			    Init, create file
 */
define(['N/search', 'N/url',
	'../lib/scv_lib_function.js',

	'../cons/scv_cons_record.js',

	'../cons/scv_cons_item.js',
	'../cons/scv_cons_inventorynumber.js',

	'../cons/scv_cons_search_checkitem_onhand.js'
],
function(search, url,
	lbf,

	constRecord,

	constItem,
	constInventoryNumber,

	constSearchCheckItemOnhand
) {
	const CUR_SCRIPT = Object.freeze({
		ID: "customscript_scv_sl_popup_inventorydetai",
		DEPLOYMENTID: "customdeploy_scv_sl_popup_inventorydetai",
		SVC_DEPLOYMENTID: "customdeploy_scv_sl_popup_invdetail_svc",
	});

	let lstInfoMappingDetail = [];

	const addFieldInventoryDetailSublist = (_sublist, _fieldId) =>{
		let arrResult = [];

		let arrColumn = [
			{id: _fieldId, label: "Inventory Detail", type: "textarea", isInventoryDetail: "T"},
			{id: getStoreFieldId(_fieldId), label: "Inventory Detail Store", type: "textarea", displayType: "hidden"},
			{id: getNeededFieldId(_fieldId), label: "Inventory Detail Needed", type: "checkbox", displayType: "hidden", defaultValue: "T"},
			{id: getAvailableFieldId(_fieldId), label: "Inventory Detail Available", type: "checkbox", displayType: "hidden", defaultValue: "T"},
			{id: getLotNoFieldId(_fieldId), label: "Inventory Detail Lot", type: "checkbox", displayType: "hidden", defaultValue: "T"}
		];
		for(let i = 0; i< arrColumn.length; i++){
			let objCol = arrColumn[i];

			let field = _sublist.addField({
				id : objCol.id,
				type : objCol.type,
				label : objCol.label
			}).updateDisplayType({displayType: objCol.displayType||"inline"});

			if(!!objCol.defaultValue){
				field.defaultValue = objCol.defaultValue;
			}

			arrResult.push({id: objCol.id, field: field});
		}

		return arrResult;
	}
	const pageInitParentInventoryDetailSublist = (_action, _curRec, _sublistId, _fieldId, _mappingFieldPopup, _isEdit = true) =>{
		
		addInforMappingDetail(_sublistId, _fieldId, _mappingFieldPopup, _isEdit);
		
		let idxColInventoryDetail = getIndexColumnInventoryDetail(_curRec, _sublistId, _fieldId);
		
		for(let i = 0; i < _curRec.getLineCount(_sublistId); i++) {
			let isAvail = _curRec.getSublistValue(_sublistId, getAvailableFieldId(_fieldId), i);
			if(!isAvail) continue;

			let row = document.getElementById(_sublistId + 'row' + i);
			let cellsDisplay = row.querySelectorAll('td');
			
			let neededId = getNeededIconId(_sublistId, i);
			let setId = getSetIconId(_sublistId, i);
			let removedId = getRemoveIconId(_sublistId, i);

			cellsDisplay[idxColInventoryDetail].innerHTML  = `
			<span class="always-visible field_widget_boxpos uir-summary-field-helper" style="left: 0px;">
				<span id="${neededId}" class="smalltextul i_inventorydetailneeded" style="visibility: inherit; cursor: pointer;" /></span>
				<span id="${setId}" class="smalltextul i_inventorydetailset" style="visibility: inherit; cursor: pointer;" ></span>
				<span id="${removedId}">
					<a data-helperbuttontype="" class="smalltextul " title="Delete" href="#" style="" aria-label="Delete" role="button">
						<img src="/images/forms/icon_remove_row_default.png" alt="Delete" border="0" style="margin-left: 5px; position: relative; top:2px;">
					</a>
				</span>
			</span>`;

			document.getElementById(neededId).addEventListener("click", function(e){
				openPopupInventoryDetail(_action, _curRec, _sublistId, _fieldId, i, _mappingFieldPopup, _isEdit);
			});
			document.getElementById(setId).addEventListener("click", function(e){
				openPopupInventoryDetail(_action, _curRec, _sublistId, _fieldId, i, _mappingFieldPopup, _isEdit);
			});
			document.getElementById(removedId).addEventListener("click", function(e){
				removeDataInventoryDetail(_curRec, _sublistId, _fieldId, i);
			});
			enableLineInventoryDetail(_curRec, _sublistId, _fieldId, i);
		}
	}

	const addInforMappingDetail = (_sublistId, _fieldId, _mappingFieldPopup, _isEdit = true) =>{
		/* let mappingFieldPopup = {
                item: "custpage_col_item",
                quantity: "custpage_col_quantity_tobe_received",
                description: "custpage_col_description",
                unit: "custpage_col_unit",
                unit_display: "custpage_col_unit",
                location: "custpage_col_receivelocation"
        }*/
		let objInforMappingDetail = {..._mappingFieldPopup};
		objInforMappingDetail.sublistId = _sublistId;
		objInforMappingDetail.inventoryDetailFieldId = _fieldId;
		objInforMappingDetail.isEdit = _isEdit;

		lstInfoMappingDetail.push(objInforMappingDetail);
	}

	const getNeededIconId = (_sublistId, _line) =>{
		return "scv_" + _sublistId + "_inventorydetail_needed_" + _line;
	}

	const getSetIconId = (_sublistId, _line) =>{
		return "scv_" + _sublistId + "_inventorydetail_set_" + _line;
	}

	const getRemoveIconId = (_sublistId, _line) =>{
		return "scv_" + _sublistId + "_inventorydetail_remove_" + _line;
	}

	const getNeededFieldId = (_inventoryDetailFieldId) => {
		return _inventoryDetailFieldId + "needed";
	}

	const getAvailableFieldId = (_inventoryDetailFieldId) => {
		return _inventoryDetailFieldId + "avail";
	}

	const getLotNoFieldId = (_inventoryDetailFieldId) => {
		return _inventoryDetailFieldId + "lotno";
	}
	
	const getStoreFieldId = (_inventoryDetailFieldId) =>{
		return _inventoryDetailFieldId + "store";
	}

	const enableLineInventoryDetail = (_curRec, _sublistId, _fieldId, _line) =>{
		let isEdit = true;
		let quantity = 0, inventoryDetailQuantity = 0;
		let keyStore = _curRec.getSublistValue(_sublistId, getStoreFieldId(_fieldId), _line);
		if(!!keyStore){
			let objInventoryDetailStore = getDataStoreInventoryClientSide(keyStore);//_curRec.getSublistValue(_sublistId, getStoreFieldId(_fieldId), _line);
			if(!!objInventoryDetailStore){
				inventoryDetailQuantity = objInventoryDetailStore.quantity * 1;
			}
		}
		
		let objInfoMappingDetail = lstInfoMappingDetail.find(e => e.sublistId == _sublistId);
		if(!!objInfoMappingDetail){
			quantity = _curRec.getSublistValue(_sublistId, objInfoMappingDetail.quantity, _line) * 1;
			isEdit = objInfoMappingDetail.isEdit;
		}

		let isNeeded = _curRec.getSublistValue(_sublistId, getNeededFieldId(_fieldId), _line);
		
		if(isNeeded){
			jQuery("#" + getNeededIconId(_sublistId, _line)).show();
			jQuery("#" + getSetIconId(_sublistId, _line)).hide();
			jQuery("#" + getRemoveIconId(_sublistId, _line)).hide();
		}
		else{
			jQuery("#" + getNeededIconId(_sublistId, _line)).hide();
			jQuery("#" + getSetIconId(_sublistId, _line)).show();
			jQuery("#" + getRemoveIconId(_sublistId, _line)).show();
			if(quantity != inventoryDetailQuantity){
				jQuery("#" + getNeededIconId(_sublistId, _line)).show();
				jQuery("#" + getSetIconId(_sublistId, _line)).hide();
			}
		}

		if(!isEdit){
			jQuery("#" + getRemoveIconId(_sublistId, _line)).hide();
		}

	}

	const getIndexColumnInventoryDetail = (_curRec, _sublistId, _fieldId) =>{
		let lstFieldSublist = _curRec.getValue(_sublistId + "fields")

		if(!lstFieldSublist) return -1;

		lstFieldSublist = lstFieldSublist.split("\x01");

		return lstFieldSublist.findIndex(id => id == _fieldId);
	}

	const openPopupInventoryDetail = (_action, _curRec, _sublistId, _fieldId, _line, _fieldParams, _isEdit = true) =>{
		let objParams = {
			action_type: _action,
			sublistid: _sublistId,
			fieldid: _fieldId,
			line: _line,
			item: !!_fieldParams.item ? (_curRec.getSublistValue(_sublistId, _fieldParams.item, _line)??"") : "",
			quantity: !!_fieldParams.quantity ? (_curRec.getSublistValue(_sublistId, _fieldParams.quantity, _line)??0) : 0,
			description: !!_fieldParams.description ? (_curRec.getSublistValue(_sublistId, _fieldParams.description, _line)??"") : "",
			unit: !!_fieldParams.unit ? (_curRec.getSublistValue(_sublistId, _fieldParams.unit, _line)??"") : "",
			unit_display: !!_fieldParams.unit_display ? (_curRec.getSublistValue(_sublistId, _fieldParams.unit_display, _line)??"") : "",
			location: !!_fieldParams.location ? (_curRec.getSublistValue(_sublistId, _fieldParams.location, _line)??_curRec.getValue(_fieldParams.location)??"") : "",
			conversionrate: !!_fieldParams.conversionrate ? (_curRec.getSublistValue(_sublistId, _fieldParams.conversionrate, _line)??_curRec.getValue(_fieldParams.conversionrate)??1) : 1,
			isedit: _isEdit ? "T" : "F"
		};

		if(!objParams.location){
			alert("Chọn Location trước.");

			return;
		}

		let urlPopup = url.resolveScript({
			scriptId: CUR_SCRIPT.ID, 
			deploymentId: CUR_SCRIPT.DEPLOYMENTID, 
			params : objParams
		})

		let isPopup = new URLSearchParams(window.location.search).get('ifrmcntnr');
		let width = window.innerWidth - 700;
		let height = window.innerHeight - 300;

		if(isPopup === "T") {
			width = window.innerWidth - 300;
			height = window.innerHeight - 150;
		}
		return nlExtOpenWindow(urlPopup, 'childdrecord', width, height, this, true,'Inventory Detail');
	}

	const removeDataInventoryDetail = (_curRec, _sublistId, _fieldId, _line) =>{
		let isEdit = true;
		let objInfoMappingDetail = lstInfoMappingDetail.find(e => e.sublistId == _sublistId);
		if(!!objInfoMappingDetail){
			isEdit = objInfoMappingDetail.isEdit;
		}

		if(isEdit){
			nlapiSetLineItemValue(_sublistId, getStoreFieldId(_fieldId), _line + 1, "");
			nlapiSetLineItemValue(_sublistId, getNeededFieldId(_fieldId), _line + 1, "T");
		}

		enableLineInventoryDetail(_curRec, _sublistId, _fieldId, _line);
	}

	const formatDataInventoryDetail = (_objRes) =>{
		_objRes = _objRes??{};
		_objRes.item = _objRes.item??"";
		_objRes.itemdescription = _objRes.itemdescription??"";
		_objRes.unit = _objRes.unit??"";
		_objRes.unit_display = _objRes.unit_display??"";
		_objRes.quantity = _objRes.quantity??0;
		_objRes.location = _objRes.location??"";
		_objRes.lines = _objRes.lines??[];

		return _objRes;
	} 

	const getSublistValueInventoryDetail = (_curRec, _sublistId, _fieldId, _line) =>{
		let objRes = _curRec.getSublistValue(_sublistId, getStoreFieldId(_fieldId), _line);
		if(!objRes) return formatDataInventoryDetail(null);

		return formatDataInventoryDetail(JSON.parse(objRes));
	}

	const validateLine = (_curRec, _sublistId, _fieldId, _line, _acceptZero = false) =>{
		let objInfoMappingDetail = lstInfoMappingDetail.find(e => e.sublistId == _sublistId);
		if(!objInfoMappingDetail) return false;
		
		let isAvail = _curRec.getSublistValue(_sublistId, getAvailableFieldId(objInfoMappingDetail.inventoryDetailFieldId), _line);
		if(!isAvail) return true;

		let quantity_field = _curRec.getSublistField(_sublistId, objInfoMappingDetail.quantity, _line);
		let quantity = _curRec.getSublistValue(_sublistId, objInfoMappingDetail.quantity, _line) * 1;
		if(!_acceptZero && quantity == 0){
			alert(`Kiểm tra lại thông tin ${quantity_field.label} ở dòng ${_line + 1} phải khác 0 (zero)`);
			return false;
		}
		
		let keyStore = _curRec.getSublistValue(_sublistId, getStoreFieldId(objInfoMappingDetail.inventoryDetailFieldId), _line);
		let objInventoryDetail = getDataStoreInventoryClientSide(keyStore);
		if(!_acceptZero && !objInventoryDetail){
			alert(`Kiểm tra lại thông tin inventory detail ở dòng ${_line + 1} chưa đúng`);
			return false;
		}

		if(objInventoryDetail.quantity != quantity){
			let msg_err = `Kiểm tra lại thông tin inventory detail ở dòng ${_line + 1} chưa đúng:\n`;
			msg_err += `{${quantity_field.label}} = ${quantity};\n`
			msg_err += `{Quantity Inventory Detail} = ${objInventoryDetail.quantity}`;
			alert(msg_err);
			return false;
		}

		return true;
	}

	const validateField = (scriptContext) =>{
		let curRec = scriptContext.currentRecord;
		let sublistId = scriptContext.sublistId;
		let fieldId = scriptContext.fieldId;
		let line = scriptContext.line;
		
		let objInfoMappingDetail = lstInfoMappingDetail.find(e => e.sublistId == sublistId);
		if(!objInfoMappingDetail) return true;

		let isAvail = curRec.getCurrentSublistValue(sublistId, getAvailableFieldId(objInfoMappingDetail.inventoryDetailFieldId));
		if(!isAvail) return true;
		
		if([objInfoMappingDetail.item, objInfoMappingDetail.location].includes(fieldId)){
			removeDataInventoryDetail(curRec, sublistId, objInfoMappingDetail.inventoryDetailFieldId, line);
		}
		else if(fieldId == objInfoMappingDetail.quantity){
			
			let isNeeded = curRec.getCurrentSublistValue(sublistId, getNeededFieldId(objInfoMappingDetail.inventoryDetailFieldId));
			if(isNeeded){
				return true;
			}

			enableLineInventoryDetail(curRec, sublistId, objInfoMappingDetail.inventoryDetailFieldId, line)

			/* if(confirm("clear inventory detail")){
				removeDataInventoryDetail(curRec, sublistId, objInfoMappingDetail.inventoryDetailFieldId, line);
				return true;
			}else{
				return false;
			} */
		}

		return true;
	}

	const getCurrentCacheStore = (_nsCache) =>{
		let cacheScript = _nsCache.getCache({
			name: "scv_inventorydetailstore",
			scope: "PUBLIC"
		});

		return cacheScript;
	}

	const setStoreInventoryDetail = (_nsCache, _objDataSource) =>{
		let cacheInventoryDetail = getCurrentCacheStore(_nsCache);

		let keyCache = lbf.uuidv4();

		let objRes = formatDataInventoryDetail();
		if(!!_objDataSource){
			objRes = _objDataSource;
		}
		cacheInventoryDetail.put({key: keyCache, value: JSON.stringify(objRes), ttl: 86400});

		return keyCache;
	}

	const getStoreInventoryDetail = (_nsCache, _key) =>{
		let objRes = formatDataInventoryDetail();

		if(!_key){
			return objRes;
		}

		let cacheInventoryDetail = getCurrentCacheStore(_nsCache);
		
		let store_value = cacheInventoryDetail.get({key: _key});
		if(!!store_value){
			objRes = JSON.parse(store_value);
		}
		return objRes;
	}

	const removeKeyCacheStore = (_nsCache, _key) => {
		let cacheScript = getCurrentCacheStore(_nsCache);

		return cacheScript.remove({key: _key});
	}

	const getDataStoreInventoryClientSide = (_keyStore) =>{
		if(!_keyStore) return formatDataInventoryDetail();
		
		let resResult = {};

		jQuery.ajax({
			type: "post", 
			url: "/app/site/hosting/scriptlet.nl?script=" + CUR_SCRIPT.ID + "&deploy=" + CUR_SCRIPT.SVC_DEPLOYMENTID, 
			dataType: "json", 
			async: false, 
			data: {
				action: "getStoreInventoryDetail",
				keyStore: _keyStore
			}
		}).done(function (response) {
			resResult = {...response};
		})

		return resResult.data;
	}

	const setDataStoreInventoryClientSide = (_dataStore) =>{
		let resResult = {};

		jQuery.ajax({
			type: "post", 
			url: "/app/site/hosting/scriptlet.nl?script=" + CUR_SCRIPT.ID + "&deploy=" + CUR_SCRIPT.SVC_DEPLOYMENTID, 
			dataType: "json", 
			async: false, 
			data: {
				action: "setStoreInventoryDetail",
				dataStore: JSON.stringify(_dataStore)
			}
		}).done(function (response) {
			resResult = {...response};
		})

		return resResult.data;
	}

	const initFieldIssueInventoryDetail = (_field, _params) =>{
		let myFilters = [
			search.createFilter({name: 'quantityavailable', operator: "greaterthan", values: 0})
		];

		if(!!_params.location){
			myFilters.push(search.createFilter({name: 'location', operator: "anyof", values: _params.location}))
		}
		if(!!_params.item){
			myFilters.push(search.createFilter({name: 'item', operator: "anyof", values: _params.item}))
		}
		let arrResult = constInventoryNumber.getDataSource(myFilters);

		constRecord.initLoadField(_field, {data: arrResult, valueExpr: "internalid", displayExpr: "inventorynumber"}, true)
	}

	const getDataInventoryDetail = (_params) =>{
		let myFilters = [];

		if(!!_params.location){
			myFilters.push(search.createFilter({name: 'location', operator: "anyof", values: _params.location}))
		}
		if(!!_params.item){
			myFilters.push(search.createFilter({name: 'item', operator: "anyof", values: _params.item}))
		}
		if(!!_params.internalid){
			myFilters.push(search.createFilter({name: 'internalid', operator: "anyof", values: _params.internalid}))
		}

		let arrResult = constInventoryNumber.getDataSource(myFilters);

		return arrResult;
	}

	const getDataItemOnhand = (_params, _arrItemId) => {
		let myFilters = [];

		if(!!_params.location){
			myFilters.push(search.createFilter({name: 'location', operator: "anyof", values: _params.location}))
		}
		if(!!_params.item){
			myFilters.push(search.createFilter({name: 'item', operator: "anyof", values: _params.item}))
		}
		if(!!_params.inventorynumber){
			myFilters.push(search.createFilter({name: 'inventorynumber', operator: "anyof", values: _params.inventorynumber}))
		}
		if(!!_params.status){
			myFilters.push(search.createFilter({name: 'status', operator: "anyof", values: _params.status}))
		}

		let arrResult = constSearchCheckItemOnhand.getDataSource(myFilters);

		return arrResult;
	}

	const isLotItem = (_internalid, _isRtnBoolean = true)	=> {
		return constItem.isLotItem(_internalid, _isRtnBoolean);
	}

	const hasInventoryDetailItem = (_internalid, _isRtnBoolean = true)	=> {
		return constItem.hasInventoryDetailItem(_internalid, _isRtnBoolean);
	}

    return {
		CUR_SCRIPT,
		addFieldInventoryDetailSublist,
		pageInitParentInventoryDetailSublist,
		getNeededIconId,
		getSetIconId,
		getRemoveIconId,
		getNeededFieldId,
		getStoreFieldId,
		getAvailableFieldId,
		getLotNoFieldId,
		enableLineInventoryDetail,
		getIndexColumnInventoryDetail,
		openPopupInventoryDetail,
		removeDataInventoryDetail,
		getSublistValueInventoryDetail,
		formatDataInventoryDetail,
		validateLine,
		validateField,
		getCurrentCacheStore,
		setStoreInventoryDetail,
		getStoreInventoryDetail,
		removeKeyCacheStore,
		getDataStoreInventoryClientSide,
		setDataStoreInventoryClientSide,
		initFieldIssueInventoryDetail,
		getDataInventoryDetail,
		getDataItemOnhand,
		isLotItem,
		hasInventoryDetailItem
    };
    
});
