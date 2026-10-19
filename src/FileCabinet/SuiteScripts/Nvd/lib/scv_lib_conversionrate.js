define([],
() => {
	const getBaseField = (recType) => {
		let quantity = 'quantity';
		let unitconversion = 'unitconversionrate';
		let sublistId = 'item';
		let lineFielId = 'line';
		let conversion_rate_field = 'custcol_scv_conversion_rate';
		if(recType === 'inventoryadjustment' || recType === 'inventorytransfer') {
			quantity = 'adjustqtyby';
			unitconversion = 'unitconversionrate';
			sublistId = 'inventory';
		} else if (recType === 'assemblybuild' || recType === 'workordercompletion' || recType === 'workorderissue') {
			unitconversion = 'conversionrate';
			lineFielId = 'linenumber'
			sublistId = 'component';
		} else if(recType === 'invoice' || recType === 'salesorder' || recType === 'purchaseorder' || recType === 'transferorder') {
			unitconversion = 'unitconversionrate';
		} else if(recType === 'itemreceipt' || recType === 'itemfulfillment') {
			unitconversion = 'unitconversion';
		}
		return {quantity, unitconversion, sublistId, lineFielId, conversion_rate_field}
	}
	const setConversionRateNewRecord = (newRecord) => {
		let recType = newRecord.type, unitconversion;
		let objBaseField = getBaseField(recType);
		let sublistId = objBaseField.sublistId;
		let lineCount = newRecord.getLineCount(sublistId);//log.error('lineCount', lineCount);
		for(let i = 0; i < lineCount; i++) {
			unitconversion = newRecord.getSublistValue({sublistId: sublistId, fieldId: objBaseField.unitconversion,  line: i}) || 1;
			newRecord.setSublistValue({sublistId: sublistId, fieldId: objBaseField.conversion_rate_field,  line: i, value: unitconversion});
		}
	}

	const setCurrentConversionRate = (currentRecord, sublistId, baseField) => {
		let recType = currentRecord.type;
		let objBaseField = baseField || getBaseField(recType);
		if(objBaseField.sublistId === sublistId) {
			let unitconversion = currentRecord.getCurrentSublistValue({sublistId: sublistId, fieldId: objBaseField.unitconversion}) || 1;
			currentRecord.setCurrentSublistValue({sublistId: sublistId, fieldId: objBaseField.conversion_rate_field,  value: unitconversion});
		}
	}

    return {
		getBaseField,
		setConversionRateNewRecord,
		setCurrentConversionRate
	}
    
});
