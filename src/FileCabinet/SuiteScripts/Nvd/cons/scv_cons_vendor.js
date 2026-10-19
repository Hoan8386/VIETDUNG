/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  28 Oct 2024         Khanh Tran			    Init, create file
 */
define(['N/search',
	'../cons/scv_cons_entity_category_type.js'
],
function(search,
	constECT
) {
	const TYPE = "vendor";
	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const SUBLIST = {
		
	}

	const genVendorCode = (scriptContext) => {
		let triggerType = scriptContext.type;
		if(!['create', 'edit'].includes(triggerType)) return;

		let newRec = scriptContext.newRecord;
		if(triggerType == 'edit'){
			let oldRec = scriptContext.oldRecord;
			let new_vendor_category = newRec.getValue('custentity_scv_vendor_category');
			let old_vendor_category = oldRec.getValue('custentity_scv_vendor_category');
			if(new_vendor_category == old_vendor_category){
				if(newRec.getValue('companyname') != oldRec.getValue('companyname')){
					setEntityId(newRec);
				}

				return;
			}
		}

		let vendor_category = newRec.getValue('custentity_scv_vendor_category');
		let objVenCat = getDataVendorCategory(vendor_category);
		let vendor_category_parent = objVenCat.vendor_category_parent;
		let objVenCat_parent = getDataVendorCategory(vendor_category_parent);
		let vendor_category_parent_code = objVenCat_parent.vendor_category_code;
		let vendor_category_code = objVenCat.vendor_category_code;
		if(!vendor_category_code || !vendor_category_parent_code) return;

		let sequence = searchSequenceVendorCode(vendor_category_parent_code, vendor_category_code);
		sequence = sequence.toString().padStart(3, '0');
		let vendor_code = vendor_category_parent_code + vendor_category_code + sequence;
		newRec.setValue('custentity_scv_vendor_code', vendor_code);
		setEntityId(newRec);
	}

	const getDataVendorCategory = (id) => {
		if(!id) return {};

		let lk_vendor_category = search.lookupFields({type: 'customrecord_scv_entity_category', id: id, 
			columns: ['custrecord_scv_entity_category_type', 'custrecord_scv_entity_category_code', 'parent']});
		let category_type = lk_vendor_category.custrecord_scv_entity_category_type?.[0]?.value;
		if(category_type != constECT.RECORDS.VENDOR.ID) return {};

		let vendor_category_parent = lk_vendor_category.parent?.[0]?.value;
		let vendor_category_code = lk_vendor_category.custrecord_scv_entity_category_code || '';
		return{
			vendor_category_parent: vendor_category_parent,
			vendor_category_code: vendor_category_code
		}
	}

	const searchSequenceVendorCode = (parentCode, code) => {
		let filters = [], columns = [];
		filters.push(search.createFilter({
			name: 'formulatext',
			formula: `SUBSTR({custentity_scv_vendor_code}, 1, ${parentCode.length + code.length})`,
			operator: 'is',
			values: parentCode + code
		}));
		columns.push({
			name: 'formulanumeric',
			formula: `TO_NUMBER(SUBSTR({custentity_scv_vendor_code}, ${parentCode.length + code.length + 1}))`,
			summary: 'MAX'
		})
		let searchObj = search.create({
			type: 'vendor', 
			filters: filters, 
			columns: columns
		});
        let searchResults = searchObj.run().getRange(0, 1);
        let result = 0;
        if (searchResults.length) {
            result = searchResults[0].getValue(columns[0]) * 1;
        }

        return result + 1;
	}

	const setEntityId = (curRec) => {
		let vendor_code = curRec.getValue('custentity_scv_vendor_code');
		let companyname = curRec.getValue('companyname');
		curRec.setValue('entityid', vendor_code + '_' + companyname);
	}

	const setCompanyName = (curRec) => {
		let vendor_code = curRec.getValue('custentity_scv_vendor_code');
		let legal_name = curRec.getValue('custentity_scv_legal_name');
		curRec.setValue('companyname', vendor_code + '_' + legal_name);
	}

	const getDataVendorByEntCategory = (entCatId) => {
		if(!entCatId) return [];

		let arrResult = [];
		let vendorSearch = search.create({
			type: TYPE, 
			filters: [
				[FIELD.INACTIVE, "is", "F"],
				"AND",
				["custentity_scv_vendor_category", "anyof", entCatId]
			], 
			columns: ["internalid", "entityid"]
		});
		vendorSearch = vendorSearch.run().getRange(0, 1000);

		for(let objSearch of vendorSearch) {
			let objRes = {
				internalid: objSearch.getValue("internalid"),
				entityid: objSearch.getValue("entityid"),
			};
			arrResult.push(objRes);
		}
		return arrResult;
	}

    return {
		TYPE,
		FIELD,
		SUBLIST,
		genVendorCode,
		setCompanyName,
		setEntityId,
		getDataVendorByEntCategory
    };
    
});
