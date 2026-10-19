/**
 * Nội dung:
 * ============================================================================================================
 * 	Date			Author				Description
 * 09 Dec 2024		Huy Pham			Init. move from Cpl, chức năng Điều khoản thanh toán, from ms.Ngọc(https://app.clickup.com/t/86cx9a2j9)
 **/
define(['N/record', 'N/search'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search) {
	
	function calDueDate(newRecord) {
		let duedate = newRecord.getValue('duedate'), datetemp;
		let cus_term = newRecord.getValue('custbody_scv_cus_term');
		if(!!cus_term) {
			//'custrecord_scv_term_fulfill_duedate', 'custrecord_scv_term_invoicedate'	          
			let cl = ['custrecord_scv_dayofmonthnetdue', 'custrecord_scv_duenextmonthifwithindays',
				'custrecord_scv_basedate', 'custrecord_scv_daysuntilnetdue'];
			let lkT = search.lookupFields({type: 'customrecord_scv_cus_term', id: cus_term, columns: cl});
			//let fulfill_duedate = lkT.custrecord_scv_term_fulfill_duedate;
			//let invoicedate = lkT.custrecord_scv_term_invoicedate;
			let dayofmonthnetdue = lkT.custrecord_scv_dayofmonthnetdue;
			let duenextmonthifwithindays = lkT.custrecord_scv_duenextmonthifwithindays;
			let basedate = lkT.custrecord_scv_basedate;
			let daysuntilnetdue = lkT.custrecord_scv_daysuntilnetdue;
			if(!!basedate) {
				datetemp = newRecord.getValue(basedate);
				if(!!datetemp) {
					let monthtemp = datetemp.getMonth();
					let yeartemp = datetemp.getFullYear();
					if((daysuntilnetdue != null && daysuntilnetdue !== '')) {
						duedate = new Date(yeartemp, monthtemp, datetemp.getDate() + daysuntilnetdue * 1);						
					} else if(dayofmonthnetdue != null && dayofmonthnetdue !== '') {
						dayofmonthnetdue = dayofmonthnetdue * 1;
						if(duenextmonthifwithindays != null && duenextmonthifwithindays !== '') {
							duenextmonthifwithindays = duenextmonthifwithindays * 1;
							let date_basedate = datetemp.getDate();
							if(dayofmonthnetdue - date_basedate <= duenextmonthifwithindays) {
								duedate = makeDueDateWithDay(yeartemp, monthtemp + 1, dayofmonthnetdue);
							} else {
								duedate = makeDueDateWithDay(yeartemp, monthtemp, dayofmonthnetdue);
							}
						} else {
							duedate = makeDueDateWithDay(yeartemp, monthtemp, dayofmonthnetdue);							
						}
					}
				}	
			}
		}
		//log.error('duedate', duedate);
		return duedate;
	}
	
	function makeDueDateWithDay(yeartemp, monthtemp, dayofmonthnetdue) {
		let duedate1 = new Date(yeartemp, monthtemp + 1, 0);
		if(duedate1.getDate() > dayofmonthnetdue) {
			duedate1 = new Date(yeartemp, monthtemp, dayofmonthnetdue);
		}
		return duedate1;
	}
	
    return {
		calDueDate: calDueDate
    };
    
});
