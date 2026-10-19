/**
 * Nội dung:
 * =======================================================================================
 *  Date                Author                  Description
 *  31 Dec 2024			Khanh Tran				Init. Create file
 */
define(['../cons/scv_cons_dataset.js',
	'../cons/scv_cons_format.js'
],
function(constDataset,
	constFormat
) {
	const ID = "custdataset_scv_calculate_completion_time_wo";

	const getDataSource = (_conditions) =>{
		let resultSearch = constDataset.loadDataSettWithCondition(ID, _conditions);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let arrResult = constDataset.fetchResultDatasetAllPage(resultSearch, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		});

		return arrResult;
	}

	const getDataSourceFetchPage = (_conditions, _params) =>{
		let resultSearch = constDataset.loadDataSettWithCondition(ID, _conditions);
		
		resultSearch = resultSearch.runPaged({pageSize: 1000});

		let objRes = constDataset.fetchResultDatasetPage(resultSearch, _params, function(_obj, _column){
			return getObjResultFromSearch(_obj, _column);
		})

		return objRes;
	}

	const getObjResultFromSearch = (_objSearch, _myColumns) =>{
		let objRes = constDataset.getObjResultFromDatasetByKey(_objSearch,[
			"subsidiary",
			"location",
			"memo",
			"custbody_scv_work_bench",
			"custbody_mfgmob_workcenter",
			"tranid",
			"quantityshiprecv",
			"quantity",
			"custrecord_scv_work_bench_std_rate",
			"totaltime_min",
			"totaltime_hour",
			"requesteddate",
			"custbody_scv_prod_start_date",
			"custbody_scv_prod_end_date",
			"priority",
			"item",
			"custitem_scv_height",
			"custitem_scv_length",
			"custitem_scv_width",
			"custitem_scv_item_thickness",
			"custitem_scv_group_lv1",
			"custitem_scv_unit_conversion_rate",
			"custbody_scv_assembly_lot",
			"custbody_scv_qc_serial_code",
			"trandate",
			"internalid",
			"custbody_scv_so_thong_ke_sx",
			"quantity_remain_3ly"
		]);

		objRes.requesteddate_yyyymmdd = constFormat.dateToChar(objRes.requesteddate);
		objRes.custbody_scv_prod_start_date_yyyymmddhh24miss = constFormat.dateTimeToChar(objRes.custbody_scv_prod_start_date);
		objRes.custbody_scv_prod_end_date_yyyymmddhh24miss = constFormat.dateTimeToChar(objRes.custbody_scv_prod_end_date);
		
		return objRes;
	}

    return {
		ID: ID,
		TYPE: "transaction",
		getDataSource,
		getDataSourceFetchPage
    };
    
});
