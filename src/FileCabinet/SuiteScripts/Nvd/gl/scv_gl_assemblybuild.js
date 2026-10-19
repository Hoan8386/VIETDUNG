
function customizeGlImpact(transactionRecord, standardLines, customLines, book) {
	
	var segmentId = ['cseg_scv_sg_proj', 'cseg_scv_sc', 'cseg_scv_pc', 'cseg_scv_kmcp', 'cseg_scv_loan'];
	var arrAccRe = {};
	var count = standardLines.getCount();	
	var strLine = null, accountId = null, debit, credit, objAccount, lkAcc, memo;
	
	for(var i = 0; i < count; i++) {
		strLine = standardLines.getLine(i);
		accountId = strLine.getAccountId();
		debit = strLine.getDebitAmount();
		credit = strLine.getCreditAmount();
		var amount = credit;
		if(accountId && credit > 0) {
			objAccount = arrAccRe[accountId + ''] || {};
			if(!objAccount.id) {
				lkAcc = nlapiLookupField('account', accountId, ['number', 'type', 'custrecord_scv_acc_drc', 'custrecord_scv_acc_wip'], false);
				objAccount.id = accountId;
				objAccount.type = lkAcc.type;
				objAccount.number = lkAcc.number;
				objAccount.acc_drc = lkAcc['custrecord_scv_acc_drc'];
				objAccount.acc_wip = lkAcc['custrecord_scv_acc_wip'];
				arrAccRe[accountId + ''] = objAccount;
				//nlapiLogExecution("DEBUG", "objAccount.acc_drc", lkAcc['custrecord_scv_acc_drc']);				
			} 
			
			if(!!objAccount.acc_drc) {
				memo = strLine.getId() + '-' + strLine.getMemo();
				//Dao debit credit
			    addLine(customLines, amount, 0, objAccount.acc_drc, strLine, segmentId, memo);
			    //Debit credit
			    addLine(customLines, 0, amount, objAccount.acc_drc, strLine, segmentId, memo);	
			}
			if(!!objAccount.acc_wip) {
				memo = strLine.getId() + '-' + strLine.getMemo();
				//Dao debit credit
			    addLine(customLines, amount, 0, objAccount.acc_wip, strLine, segmentId, memo);
			    //Debit credit
			    addLine(customLines, 0, amount, objAccount.acc_wip, strLine, segmentId, '0' + '-' + strLine.getMemo());	
			}
		}	
	}
	
	
	function addLine(customLines, debit, credit, accOpp, strLine, segmentId, memo) {
		var newLine = customLines.addNewLine();
		if(debit > 0) {
			newLine.setDebitAmount(debit);
		}
		if(credit > 0) {
			newLine.setCreditAmount(credit);
		}
	    newLine.setAccountId(accOpp * 1);
	    newLine.setMemo(memo);
	    newLine.setDepartmentId(strLine.getDepartmentId());
	    newLine.setClassId(strLine.getClassId());
	    newLine.setLocationId(strLine.getLocationId());
	    newLine.setEntityId(strLine.getEntityId());
	    for(var j in segmentId) {
	    	if(strLine.getSegmentValueId(segmentId[j]) !== undefined) {
	    		newLine.setSegmentValueId(segmentId[j], strLine.getSegmentValueId(segmentId[j]));
	    	}
	    }
	}
}    