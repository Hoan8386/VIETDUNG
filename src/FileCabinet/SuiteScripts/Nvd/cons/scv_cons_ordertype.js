/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  15 Nov 2024         Khanh Tran			    Init, create file
 */
define([
	'../cons/scv_cons_search.js',
],
function(
	constSearch
) {
	const FIELD = {
		ID: "id",
		INACTIVE: "isinactive",
		NAME: "name"
	}

	const SUBLIST = {
		
	}

	const RECORDS = {
		MUA_HANG_THEO_KE_HOACH: {
			ID: 17,
			NAME: "Mua hàng theo kế hoạch"
		},
		MUA_HANG_PHAT_SINH: {
			ID: 18,
			NAME: "Mua hàng phát sinh"
		},
		NHAP_PHE_PHU_PHAM_THU_HOI: {
			ID: 22,
			NAME: "Nhập phế/phụ phẩm thu hồi"
		},
		SX_HANG_TON_KHO: {
			ID: 33,
			NAME: "SX hàng tồn kho"
		},
		SX_HANG_KHACH_DAT_NOI_DIA: {
			ID: 34,
			NAME: "SX Hàng khách đặt nội địa"
		},
		SX_HANG_KHACH_DAT_XUAT_KHAU: {
			ID: 35,
			NAME: "SX Hàng khách đặt xuất khẩu"
		},
		HANG_SX_THU_NGHIEM: {
			ID: 36,
			NAME: "Hàng sản xuất thử nghiệm"
		},
		HANG_SX_DANH_GIA: {
			ID: 37,
			NAME: "Hàng sản xuất đánh giá"
		},
		XUAT_TIEU_HAO_GC_CO_KHI: {
			ID: 42,
			NAME: "Xuất tiêu hao gia công cơ khí"
		},
		MUA_HANG_GIA_CONG: {
			ID: 47,
			NAME: "Mua hàng gia công"
		},
		MUA_BAN_NOI_BO: {
			ID: 53,
			NAME: "Mua bán nội bộ"
		},
		CHUYEN_KHO_THANH_PHAM: {
			ID: 68,
			NAME: "Chuyển kho TP sau kiểm tra"
		},
		CHUYEN_KHO_SX_SANG_KHO_TP: {
			ID: 75,
			NAME: "Chuyển kho sản xuất sang kho TP"
		},
		NHAP_THU_HOI_GC: {
			ID: 111,
			NAME: "Nhập thu hồi gia công"
		}
	}

	const getDataSource = (_filters) => {
		let resultSearch =  constSearch.createSearchWithFilter({
			type: "customrecord_scv_order_type",
			filters:
			[
				["isinactive","is","F"]
			],
			columns:
			[
				"internalid",
				"name"
			]
		}, _filters);
		
		let arrResult = constSearch.fetchResultSearchRunEach(resultSearch, function(_objTmpl, _column){
			let objResTmpl = constSearch.getObjResultFromSearchByKey(_objTmpl, _column, [
				"internalid",
				"name"
			]);

			return objResTmpl;
		});
		
		return arrResult;
	}

    return {
		TYPE: "customrecord_scv_order_type",
		FIELD,
		SUBLIST,
		RECORDS,
		getDataSource
    };
    
});
