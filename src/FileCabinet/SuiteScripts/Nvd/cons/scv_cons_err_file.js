/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  01 Apr 2025         Huy Pham                Init & create file
 */
define(['N/record', 'N/file', 'N/runtime', 
	'../cons/scv_cons_crypto.js'
],
function(record, file, runtime, 
	constCrypto
) {

	const TYPE = "customrecord_scv_err_file";
    const FIELD = {
        ID: "id",
        INACTIVE: "isinactive",
        NAME: "name"
    }

    const SUBLIST = {}

    const RECORDS = {
		INFO_SCRIPT: {
			ID: "",
            DEPLOYID: "",
		},
		FOLDER: {
			ID: 2263,
			NAME: "Error File"//User Document (-20)
		}
    }

	const setInfoScript = (_scriptId, _deployId) =>{
		RECORDS.INFO_SCRIPT.ID = _scriptId;
		RECORDS.INFO_SCRIPT.DEPLOYID = _deployId;

		return RECORDS.INFO_SCRIPT;
	}

	const createErrorFile = (_dataOfFile, _msgError) =>{
		let curScript = runtime.getCurrentScript();

		let scriptId = RECORDS.INFO_SCRIPT.ID || curScript.id;
		let deployId = RECORDS.INFO_SCRIPT.DEPLOYID || curScript.deploymentId;

		let errFileRecId = "";

		try{
			let jsonFile = file.create({
				name: constCrypto.generateUUID() + '.json',
				fileType: "JSON",
				contents: util.isString(_dataOfFile) ? _dataOfFile : JSON.stringify(_dataOfFile),
				folder: RECORDS.FOLDER.ID
			});
			let jsonFileId = jsonFile.save();
	
			let errFileRec = record.create({type: "customrecord_scv_err_file", isDynamic: true});
	
			errFileRec.setValue("custrecord_scv_err_file_scriptid", scriptId);
			errFileRec.setValue("custrecord_scv_err_file_deployid", deployId);
			errFileRec.setValue("custrecord_scv_err_file", jsonFileId);
			errFileRec.setValue("custrecord_scv_err_file_msg", _msgError);
	
			errFileRecId = errFileRec.save({enableSourcing: false, ignoreMandatoryFields: true});
		}
		catch(err){
			log.error("Error-scv_cons_err_file.js", err.message);
		}

		return errFileRecId;
	}

	const resovleErrorFile = (_errFileRecId) =>{
		record.submitFields({
			type: "customrecord_scv_err_file",
			id: _errFileRecId,
			values: {
				"custrecord_scv_err_file_resolve": true
			},
			options: {
				enableSourcing: false, ignoreMandatoryFields : true
			}
		})
	}

    return {
		TYPE,
        FIELD,
        SUBLIST,
        RECORDS,
		setInfoScript,
        createErrorFile,
		resovleErrorFile
    };
    
});