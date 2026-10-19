/**
 * Nội dung: Import Record
 * Key word:
 * =======================================================================================
 *  Date                Author                  Description
 * 08 Nov 2024		    Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
define(['N/record', 'N/search',
	'../lib/scv_lib_function.js', 

	'../cons/scv_cons_search.js',
    '../cons/scv_cons_importline.js',
    '../cons/scv_cons_import_detail.js',
	'../cons/scv_cons_valuetype.js',
	'../cons/scv_cons_unitstypeuom.js',
],
	function(record, search,
		lbf, 

		constSearch,
		constImportLine,
		constImportDetail,
		constValueType,
		constUnitsTypeUom,
	) 
{
	const NONE_VALUE = "@NONE@";
	const FOLDER_FILEIMPORT = 1892;

	let arrUnitTypeUom = [];

	const getListFieldTemplateColumn = (_importId, _importLineId, _hasMainField) =>{
		let arrFieldMain = getListFieldMain(_importId);
        let arrSublist = getListSublist(_importLineId);
        let arrFieldSublist = getListFieldSublist(_importLineId);

		if(_hasMainField != "T"){
			arrFieldMain = arrFieldMain.filter(e => e.custrecord_scv_import_d_valuetype == constValueType.RECORDS.PK.ID)
		}

		let arrResult = [];

		for(let i = 0; i < arrFieldMain.length; i++){
			let objFieldMain = arrFieldMain[i];

			if(!objFieldMain.custrecord_scv_import_d_subrec_invdetail){
				arrResult.push({
					id: objFieldMain.custrecord_scv_import_d_fieldid,
					label: objFieldMain.custrecord_scv_import_d_label,
					sublistId: "",
					sublistLabel: "",
					fieldId: objFieldMain.custrecord_scv_import_d_fieldid,
					fieldLabel: objFieldMain.custrecord_scv_import_d_label,
					valueType: objFieldMain.custrecord_scv_import_d_valuetype,
					guideNote: objFieldMain.custrecord_scv_import_d_note,
					isInventoryDetail: "F"
				})
			}
			else{
				let arrFieldsInvDetail = constImportDetail.getDataSourceByCriteriaQuery({
					custrecord_scv_import_d_invdetail: objFieldMain.custrecord_scv_import_d_subrec_invdetail
				});
				for(let j = 0; j < arrFieldsInvDetail.length; j++){
					let objField = arrFieldsInvDetail[j];

					arrResult.push({
						id: objFieldMain.custrecord_scv_import_d_fieldid + "@" + objField.custrecord_scv_import_d_fieldid,
						label: objField.custrecord_scv_import_d_label,
						sublistId: "",
						sublistLabel: "",
						fieldId: objField.custrecord_scv_import_d_fieldid,
						fieldLabel: objField.custrecord_scv_import_d_label,
						valueType: objField.custrecord_scv_import_d_valuetype,
						guideNote: objField.custrecord_scv_import_d_note,
						isInventoryDetail: "T",
						inventoryDetailFieldId: objFieldMain.custrecord_scv_import_d_fieldid
					})
				}
			}
            
        }

		for(let i = 0; i < arrSublist.length; i++){
            let objSublist = arrSublist[i];

            let arrFieldSublist_filter = arrFieldSublist.filter(e => e.custrecord_scv_import_line_d == objSublist.id);

            for(let j = 0; j < arrFieldSublist_filter.length; j++){
                let objFieldSublist = arrFieldSublist_filter[j];

				if(!objFieldSublist.custrecord_scv_import_d_subrec_invdetail){
					arrResult.push({
						id: objSublist.custrecord_scv_import_line_sublist + "@" + objFieldSublist.custrecord_scv_import_d_fieldid,
						label: objSublist.name + ": " + objFieldSublist.custrecord_scv_import_d_label,
						sublistId: objSublist.custrecord_scv_import_line_sublist,
						sublistLabel: objSublist.name,
						fieldId: objFieldSublist.custrecord_scv_import_d_fieldid,
						fieldLabel: objFieldSublist.custrecord_scv_import_d_label,
						valueType: objFieldSublist.custrecord_scv_import_d_valuetype,
						guideNote: objFieldSublist.custrecord_scv_import_d_note,
						isInventoryDetail: "F"
					})
				}
				else{
					let arrFieldsInvDetail = constImportDetail.getDataSourceByCriteriaQuery({
						custrecord_scv_import_d_invdetail: objFieldSublist.custrecord_scv_import_d_subrec_invdetail
					});
					for(let z = 0; z < arrFieldsInvDetail.length; z++){
						let objField = arrFieldsInvDetail[z];
	
						arrResult.push({
							id: objSublist.custrecord_scv_import_line_sublist + "@" + objFieldSublist.custrecord_scv_import_d_fieldid + "@" + objField.custrecord_scv_import_d_fieldid,
							label: objSublist.name + ": " + objFieldSublist.custrecord_scv_import_d_label + ": " + objField.custrecord_scv_import_d_label,
							sublistId: objSublist.custrecord_scv_import_line_sublist,
							sublistLabel: objSublist.name,
							fieldId: objField.custrecord_scv_import_d_fieldid,
							fieldLabel: objField.custrecord_scv_import_d_label,
							valueType: objField.custrecord_scv_import_d_valuetype,
							guideNote: objField.custrecord_scv_import_d_note,
							isInventoryDetail: "T",
							inventoryDetailFieldId: objFieldSublist.custrecord_scv_import_d_fieldid
						})
					}
				}
            }
        }

		return arrResult;
	}

	const getListFieldMain = (_importId) =>{
		if(!_importId) return [];

        let arrFields = constImportDetail.getDataSourceByCriteriaQuery({custrecord_scv_import_d: _importId});

        return arrFields;
    }

    const getListSublist = (_importLineId) =>{
        if(!_importLineId) return [];

        let arrSublist = constImportLine.getDataSourceByCriteriaQuery({id: _importLineId});

        return arrSublist;
    }

    const getListFieldSublist = (_importLineId) =>{
        if(!_importLineId) return [];
        let arrFields = constImportDetail.getDataSourceByCriteriaQuery({custrecord_scv_import_line_d: _importLineId});

        return arrFields;
    }

	/**
	 * HuyPQ 20241126: Thêm chức năng Inventory Detail ở dưới line đã xử lý, trên header thì chưa
	 * @param {*} _arrRawData 
	 * @param {*} _importId 
	 * @param {*} _importLineId 
	 * @param {*} _isImportHeader 
	 * @returns 
	 */
	const convertRawDataToRecordJson = (_arrRawData, _importId, _importLineId, _isImportHeader) =>{
		if(_arrRawData.length == 0) return [];

		let arrFieldIdUpload = Object.keys(_arrRawData[0])

		let arrFieldTemplate = getListFieldTemplateColumn(_importId, _importLineId, _isImportHeader);

		let arrFieldIdMainActual = [], arrFieldSublistActual = [];

		for(let i = 0; i < arrFieldIdUpload.length; i++){
			let fieldIdUpload = arrFieldIdUpload[i];

			let objFieldTemplate_find = arrFieldTemplate.find(e => e.id == fieldIdUpload);
			if(!objFieldTemplate_find) continue;

			if(!objFieldTemplate_find.sublistId){
				arrFieldIdMainActual.push(objFieldTemplate_find.fieldId)
			}
			else{
				arrFieldSublistActual.push({
					id: objFieldTemplate_find.id,
					sublistId: objFieldTemplate_find.sublistId,
					fieldId: objFieldTemplate_find.fieldId,
					valueType: objFieldTemplate_find.valueType,
					inventoryDetailFieldId: objFieldTemplate_find.inventoryDetailFieldId
				})
			}
		}
		//alasql sẽ lỗi ký tự đặc biệt.Ex: :
		let arrSublistIdActual = lbf.onGroupByArray(arrFieldSublistActual, ["sublistId"])//alasql(`SELECT DISTINCT sublistId FROM ?`, [arrFieldSublistActual])
		let arrResult = [];
		let arrMainGroup = lbf.onGroupByArray(_arrRawData, arrFieldIdMainActual)//alasql(`SELECT DISTINCT ${arrFieldIdMainActual.join(", ")} FROM ?`, [_arrRawData]);

		for(let i = 0; i < arrMainGroup.length; i++){
			let objRes = {...arrMainGroup[i]};

			objRes.sublists = {};

			let arrLines_filter = _arrRawData.filter(function(e){
				for(let j = 0; j < arrFieldIdMainActual.length; j++){
					let fieldId = arrFieldIdMainActual[j];

					if(e[fieldId] != objRes[fieldId]) return false;
				}
				return true;
			})

			
			for(let idxSublist = 0; idxSublist < arrSublistIdActual.length; idxSublist++){
				let sublistId = arrSublistIdActual[idxSublist].sublistId;

				objRes.sublists[sublistId] = [];

				let arrFieldSublistActual_filter = arrFieldSublistActual.filter(e => e.sublistId == sublistId);

				for(let idxLine = 0; idxLine < arrLines_filter.length; idxLine++){
					let objLine = arrLines_filter[idxLine];

					let objLineRes = {};

					let isValidPKUnique = false;
					//arrFieldSublistActual_filter.forEach(_objField => objLineRes[_objField.fieldId] = objLine[_objField.id]);
					for(let j = 0; j < arrFieldSublistActual_filter.length; j++){
						let objFieldSublistActual = arrFieldSublistActual_filter[j];

						let fieldId = objFieldSublistActual.fieldId;
						if(!!objFieldSublistActual.inventoryDetailFieldId){
							fieldId = objFieldSublistActual.inventoryDetailFieldId + "." + objFieldSublistActual.fieldId;
						}

						objLineRes[fieldId] = objLine[objFieldSublistActual.id];
						
						if([constValueType.RECORDS.PK.ID, constValueType.RECORDS.UNIQUE.ID].includes(objFieldSublistActual.valueType * 1)  && !!objLine[objFieldSublistActual.id]){
							isValidPKUnique = true;
						}
					}

					if(!isValidPKUnique) continue;

					objRes.sublists[sublistId].push(objLineRes);
				}

				let objFirstInvDetailField = arrFieldSublistActual_filter.find(e => !!e.inventoryDetailFieldId)
				if(!!objFirstInvDetailField){
					let arrFieldIdLineSublist = arrFieldSublistActual_filter.filter(e => !e.inventoryDetailFieldId).map(e => e.fieldId);
					let arrLineSublist = lbf.onGroupByArray(objRes.sublists[sublistId], arrFieldIdLineSublist);
					for(let j = 0; j < arrLineSublist.length; j++){
						let objLineRes = arrLineSublist[j];
	
						objLineRes.inventoryDetail = {
							fieldId: objFirstInvDetailField.inventoryDetailFieldId,
							inventoryAssignment: []
						};
	
						let arrInvDetailLine = objRes.sublists[sublistId].filter(function(e){
							for(let z = 0; z < arrFieldIdLineSublist.length; z++){
								let fieldId = arrFieldIdLineSublist[z];
	
								if(e[fieldId] != objLineRes[fieldId]){
									return false;
								}
							}
							return true;
						});
						for(let z = 0; z < arrInvDetailLine.length; z++){
							let objInvDetailLine = arrInvDetailLine[z];
							let objLineAss = {};
							Object.keys(objInvDetailLine).forEach(_keyId =>{

								if(!_keyId.includes(objFirstInvDetailField.inventoryDetailFieldId + ".")) return;

								let fieldId = _keyId.replace(objFirstInvDetailField.inventoryDetailFieldId +".", "");
								objLineAss[fieldId] = objInvDetailLine[_keyId];
							});
							
							const hasData = Object.values(objLineAss).some(v => v != null && v !== "");

							if(hasData){
								objLineRes.inventoryDetail.inventoryAssignment.push(objLineAss);
							}
						}
					}

					objRes.sublists[sublistId] = arrLineSublist;
				}
			}

			arrResult.push(objRes);
		}

		return arrResult;
	}

	const importDataFromRecordJson = (_objResRec, _arrFieldTemplate, _recType) =>{
		let arrFieldMain = _arrFieldTemplate.filter(e => !e.sublistId);

		let recId = "", recExternalId = "";
		let objFieldMainPK = arrFieldMain.find(e => e.valueType == constValueType.RECORDS.PK.ID);
		let objFieldMainUnique = arrFieldMain.find(e => e.valueType == constValueType.RECORDS.UNIQUE.ID);
		let objFieldTransForm = arrFieldMain.find(e => e.valueType == constValueType.RECORDS.TRANSACTION_TRANSFORM_FROM.ID);
		
		if(!!objFieldMainPK){
			recId = _objResRec[objFieldMainPK.fieldId];
		}
		
		if(!recId && !!objFieldMainUnique){
			recExternalId = _objResRec[objFieldMainUnique.fieldId];
			if(!!recExternalId){
				let resultSearch = constSearch.createSearchWithFilter({
					type: _recType,
					filters:
					[
						[objFieldMainUnique.fieldId,"is", recExternalId]
					],
					columns:
					[
						{
                            name: "internalid",
                            summary: "GROUP",
                        }
					]
				});

				let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
					let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
						"internalid"
					]);
	
					return objResTmpl;
				});
				
				recId = arrResult.length > 0 ? arrResult[0].internalid : "";
			}
		}

		let isTransForm = false;
		let curRec = null;
		if(!!recId){
			curRec = record.load({type: _recType, id: recId, isDynamic: true});
		}else{
			let objTransform = transformFrom(_recType, _objResRec, objFieldTransForm);
			if(!!objTransform){
				curRec = record.transform({
					fromType: objTransform.fromType,  fromId: objTransform.fromId,
					toType: _recType, isDynamic: true
				});
				isTransForm = true;
				defaultValueTransForm(curRec);
			}
			else{
				curRec = record.create({type: _recType, isDynamic: true});
			}
		}

		for(let i = 0; i < arrFieldMain.length; i++){
			let objFieldMain = arrFieldMain[i];
			
			let value_field = _objResRec[objFieldMain.fieldId];
			if(!lbf.isContainValue(value_field)) continue;

			if([constValueType.RECORDS.PK.ID/* , constValueType.RECORDS.UNIQUE.ID */].includes(objFieldMain.valueType * 1)) continue;

			value_field = value_field.toString().trim().toUpperCase() == NONE_VALUE ? "" : value_field;

			if(objFieldMain.valueType == constValueType.RECORDS.VALUE.ID){
				curRec.setValue(objFieldMain.fieldId, value_field);
			}
			else if(objFieldMain.valueType == constValueType.RECORDS.TEXT.ID){
				curRec.setText(objFieldMain.fieldId, value_field)
			}
			else{
				value_field = constValueType.formatDataValueType(objFieldMain.valueType, value_field);
				curRec.setValue(objFieldMain.fieldId, value_field);
			}
		}
		
		let objSublist = _objResRec.sublists;
		let arrSublistId = [];
		if(!!objSublist){
			arrSublistId = Object.keys(objSublist);
		}
		for(let idxSublist = 0; idxSublist < arrSublistId.length; idxSublist++){
			let sublistId = arrSublistId[idxSublist];

			let arrSubistField = _arrFieldTemplate.filter(e => e.sublistId == sublistId);
			let objFieldSublistPK = arrSubistField.find(e => e.valueType == constValueType.RECORDS.PK.ID);
			let objFieldSublistUnique = arrSubistField.find(e => e.valueType == constValueType.RECORDS.UNIQUE.ID);
			let arrSubistFieldId = arrSubistField.map(e => e.fieldId);

			let arrLineOrgRec = getDataLineOriginalOfSublist(curRec, sublistId, arrSubistFieldId);
			
			let arrLineData = objSublist[sublistId];
			
			for(let i = 0; i < arrLineData.length; i++){
				let objLineData = arrLineData[i];

				let linePK = "";
				let lineUnique = "";
				
				if(!!objFieldSublistPK){
					linePK = objLineData[objFieldSublistPK.fieldId];
				}
				if(!linePK && !!objFieldSublistUnique){
					lineUnique = objLineData[objFieldSublistUnique.fieldId];

					if(!!lineUnique){
						let objLineOrg_find = arrLineOrgRec.find(e => e[objFieldSublistUnique.fieldId] == objLineData[objFieldSublistUnique.fieldId]);
						if(!!objLineOrg_find){
							linePK = objLineOrg_find[objFieldSublistUnique.fieldId];
						}
					}
				}

				if(!!linePK){
					let keyFieldId = objFieldSublistPK?.fieldId||objFieldSublistUnique?.fieldId;
					let objLineOrg_find = arrLineOrgRec.find(e => e[keyFieldId] == linePK);
					if(!!objLineOrg_find){
						curRec.selectLine(sublistId, objLineOrg_find.indexLine);
					}
					else{
						curRec.selectNewLine(sublistId);
						//continue;
					}
				}
				else{
					curRec.selectNewLine(sublistId);
				}
				
				for(let j = 0; j < arrSubistField.length; j++){
					let objSublistField = arrSubistField[j];

					if(objSublistField.isInventoryDetail == "T") continue;

					let value_field = objLineData[objSublistField.fieldId];

					if(!lbf.isContainValue(value_field)) continue;

					if([constValueType.RECORDS.PK.ID/* , constValueType.RECORDS.UNIQUE.ID */].includes(objSublistField.valueType * 1)) continue;

					value_field = value_field.toString().trim().toUpperCase() == NONE_VALUE ? "" : value_field;

					if(typeof(value_field) == "string"){
						value_field = value_field.trim();
					}

					if(objSublistField.valueType == constValueType.RECORDS.VALUE.ID){
						curRec.setCurrentSublistValue(sublistId, objSublistField.fieldId, value_field)
					}
					else if(objSublistField.valueType == constValueType.RECORDS.TEXT.ID){
						if(objSublistField.fieldId == "units"){
							setUnitNameSublist(curRec, sublistId, objSublistField.fieldId, value_field);
						}
						else{
							try{
								curRec.setCurrentSublistText(sublistId, objSublistField.fieldId, value_field)
							}catch(err){
								curRec.setCurrentSublistValue(sublistId, objSublistField.fieldId + "_display", value_field)
							}
						}
					}
					else{
						value_field = constValueType.formatDataValueType(objSublistField.valueType, value_field);
						curRec.setCurrentSublistValue(sublistId, objSublistField.fieldId, value_field);
					}
				}

				if(!!objLineData?.inventoryDetail?.fieldId){
					let invDetailFieldId = objLineData.inventoryDetail.fieldId;
					let arrInvAss = objLineData.inventoryDetail.inventoryAssignment;
					let arrSubistFieldInvDetail = arrSubistField.filter(e => e.isInventoryDetail == "T");
					let assignmentSublistId = "inventoryassignment";

					if(_recType == "inventorycount"){
						assignmentSublistId = "inventorydetail";
					}

					let inventoryDetailRec = curRec.getCurrentSublistSubrecord(sublistId, invDetailFieldId);
					
					while(inventoryDetailRec.getLineCount(assignmentSublistId) > 0){
						inventoryDetailRec.removeLine(assignmentSublistId, 0);
					}
					if(arrInvAss.length === 0 && curRec.type === "inventorycount"){
						try{
							curRec.removeCurrentSublistSubrecord({sublistId: sublistId, fieldId: invDetailFieldId});
						}
						catch(err){}
					}
					for(let idxAss = 0; idxAss < arrInvAss.length; idxAss++){
						let objLineAssData = arrInvAss[idxAss];

						inventoryDetailRec.selectNewLine(assignmentSublistId);

						for(let j = 0; j < arrSubistFieldInvDetail.length; j++){
							let objSublistField = arrSubistFieldInvDetail[j];
	
							let value_field = objLineAssData[objSublistField.fieldId];
	
							if(!lbf.isContainValue(value_field)) continue;

							if([constValueType.RECORDS.PK.ID/* , constValueType.RECORDS.UNIQUE.ID */].includes(objSublistField.valueType * 1)) continue;

							value_field = value_field.toString().trim().toUpperCase() == NONE_VALUE ? "" : value_field;

							if(typeof(value_field) == "string"){
								value_field = value_field.trim();
							}
		
							if(objSublistField.valueType == constValueType.RECORDS.VALUE.ID){
								inventoryDetailRec.setCurrentSublistValue(assignmentSublistId, objSublistField.fieldId, value_field)
							}
							else if(objSublistField.valueType == constValueType.RECORDS.TEXT.ID){
								try{
									inventoryDetailRec.setCurrentSublistText(assignmentSublistId, objSublistField.fieldId, value_field)
								}catch(err){
									inventoryDetailRec.setCurrentSublistValue(assignmentSublistId, objSublistField.fieldId + "_display", value_field)
								}
							}
							else{
								value_field = constValueType.formatDataValueType(objSublistField.valueType, value_field);
								inventoryDetailRec.setCurrentSublistValue(assignmentSublistId, objSublistField.fieldId, value_field);
							}
						}

						inventoryDetailRec.commitLine(assignmentSublistId);
					}
				}

				curRec.commitLine(sublistId);
			}
		}

		recId = curRec.save({enableSourcing: false, ignoreMandatoryFields: true});

		return recId;
	}

	const getDataLineOriginalOfSublist = (_curRec, _sublistId, _fields) =>{
		let arrResult = [];
		for(let i = 0; i < _curRec.getLineCount(_sublistId); i++){
			let objRes = {};
		
			objRes.indexLine = i;

			for(let j = 0; j < _fields.length; j++){
				let fieldId = _fields[j];

				objRes[fieldId] = _curRec.getSublistValue(_sublistId, fieldId, i);
			}

			arrResult.push(objRes);
		}
		return arrResult;
	}

	//Note: lưu ý trường hợp size >10mb
	const createFileJson = (nsFile, _arrResultRecord, _arrFieldTemplate, _recType) =>{
		let objResult = {
			recordType: _recType,
			arrFieldTemplate: _arrFieldTemplate,
			arrResultRecord: _arrResultRecord
		};

		let jsonFile = nsFile.create({
			name: lbf.uuidv4() + '.json',
			fileType: "JSON",
			contents: JSON.stringify(objResult),
			folder: FOLDER_FILEIMPORT
		});
		let jsonFileId = jsonFile.save();

		return jsonFileId;
	}

	const getContentsFileJson = (nsFile, _fileId) =>{
		let jsonFile = nsFile.load({id: _fileId});
		let contents = jsonFile.getContents();

		return JSON.parse(contents)
	}

	const transformFrom = (_importRecType, _objResRec, _objFieldTransForm) =>{
		if(!_objFieldTransForm) return null;

		
		let createdfromId = _objResRec[_objFieldTransForm.fieldId];
		if(!createdfromId) return null;

		let fromTransType = lbf.getTranRecordType(createdfromId);
		
		return {
			fromType: fromTransType,
			fromId: createdfromId,
			toType: _importRecType,
		};
	}

	const defaultValueTransForm = (_transFormRec) =>{
		
		let recType = _transFormRec.type;

		if(["itemfulfillment", "itemreceipt"].includes(recType)){
			let itemSublistId = "item";

			let sizeItemSublist = _transFormRec.getLineCount(itemSublistId);

			for(let i = 0; i < sizeItemSublist; i++){
				_transFormRec.selectLine(itemSublistId, i);

				_transFormRec.setCurrentSublistValue(itemSublistId, "itemreceive", false);

				_transFormRec.commitLine(itemSublistId);
			}
		}
	}

	//#region xử lý cho {units}
	const setUnitNameSublist = (_curRec, _sublistId, _fieldId, _unitName) =>{
		if(!_unitName) return;
		
		let unitId = "";

		let lstUnitTypeUom = getListDataUnitTypeUom();
		lstUnitTypeUom = lstUnitTypeUom.filter(e => e.unitname == _unitName);
		
		if(lstUnitTypeUom.length == 1){
			unitId = lstUnitTypeUom[0].internalid;
		}
		else{
			let unitslist = _curRec.getCurrentSublistValue(_sublistId, "unitslist");
			unitslist = !!unitslist ? unitslist.split("\u0005",",") : [];
			
			for(let i = 0; i < lstUnitTypeUom.length; i++){
				let objUnitTypeUom = lstUnitTypeUom[i];

				let idxUnitslist = unitslist.findIndex(_unitId => _unitId == objUnitTypeUom.internalid);
				if(idxUnitslist > -1){
					unitId = objUnitTypeUom.internalid;
					break;
				}
			}
		}
		
		if(unitId){
			_curRec.setCurrentSublistValue(_sublistId, _fieldId, unitId);
		}
	}

	const getListDataUnitTypeUom = () =>{
		if(arrUnitTypeUom.length > 0){
			return arrUnitTypeUom;
		}

		arrUnitTypeUom = constUnitsTypeUom.getDataSource();

		return arrUnitTypeUom;
	}
	//#endregion
	
    return {
		getListFieldTemplateColumn,
		convertRawDataToRecordJson,
		importDataFromRecordJson,
		createFileJson,
		getContentsFileJson
    };
    
});
