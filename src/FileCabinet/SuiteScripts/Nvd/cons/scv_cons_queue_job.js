/**
 * Nội dung: 
 * =======================================================================================
 *  Date                Author                  Description
 *  08 Nov 2024         Huy Pham                Init & create file, move from Adv, from mr.Việt(https://app.clickup.com/t/86cx0fvqd)
 */
define(['N/record', 'N/task', 'N/query', 'N/search', 'N/url', 'N/runtime',
    '../lib/scv_lib_function.js',
    '../cons/scv_cons_queue_job_status.js'
],
function(record, task, query, search, url, runtime,
    lbf,
    constQueueJobStatus
) {
	const TYPE = "customrecord_scv_queue_job";
    const FIELD = {
        ID: "id",
        INACTIVE: "isinactive",
        NAME: "name"
    }

    const SUBLIST = {
        
    }

    const RECORDS = {
		JOB_SCRIPT: {
			TYPE: "",
			ID: "",
            DEPLOYID: "",
            PARAMSID: ""
		}
    }

	const createQueueJobScript = (_jobParamsInput) =>{
		return createQueueJob(RECORDS.JOB_SCRIPT.TYPE, RECORDS.JOB_SCRIPT.ID, RECORDS.JOB_SCRIPT.DEPLOYID, RECORDS.JOB_SCRIPT.PARAMSID, _jobParamsInput);
	}

    const createQueueJob = (_jobTaskTypeId, _jobScriptId, _jobDeployId, _jobParamFieldId, _jobParamsInput) =>{
        let queueRec = record.create({type: "customrecord_scv_queue_job", isDynamic: true});
        lbf.setValueData(queueRec, [
			"custrecord_scv_queue_job_tasktype",
            "custrecord_scv_queue_job_scriptid", "custrecord_scv_queue_job_deployid", "custrecord_scv_queue_job_fieldparaminput",
            "custrecord_scv_queue_job_status", "custrecord_scv_queue_job_datainput"
        ], [
            _jobTaskTypeId,
			_jobScriptId, _jobDeployId, _jobParamFieldId,
            constQueueJobStatus.RECORDS.PENDING.ID, _jobParamsInput
        ])
        let queueRecId = queueRec.save({enableSourcing: false, ignoreMandatoryFields: true});

        return queueRecId;
    }

	const processQueueJobScript = () =>{
		return processQueueJob(RECORDS.JOB_SCRIPT.ID, RECORDS.JOB_SCRIPT.DEPLOYID);
	}

    const processQueueJob = (_scriptId, _deployId) => {
		let isExistsProcessing = isExistsProcessingCloseBalance(_deployId);
		if(isExistsProcessing) return "";

		let arrQueueNext = query.runSuiteQL({query: `select id, custrecord_scv_queue_job_scriptid, custrecord_scv_queue_job_deployid, 
				custrecord_scv_queue_job_fieldparaminput, custrecord_scv_queue_job_datainput, custrecord_scv_queue_job_tasktype
			from customrecord_scv_queue_job
			where isinactive = 'F' 
				and custrecord_scv_queue_job_status = ${constQueueJobStatus.RECORDS.PENDING.ID}
                and custrecord_scv_queue_job_scriptid = '${_scriptId}'
				and custrecord_scv_queue_job_deployid = '${_deployId}'
			order by id asc`}).asMappedResults();

		if(arrQueueNext.length == 0) return "";

		let objQueueNext = arrQueueNext[0];
		let queueNextId = objQueueNext.id;

		let mrObjParams = {};
		mrObjParams[objQueueNext.custrecord_scv_queue_job_fieldparaminput] = objQueueNext.custrecord_scv_queue_job_datainput;

		var mrTask = task.create({
			taskType: objQueueNext.custrecord_scv_queue_job_tasktype,
			scriptId: objQueueNext.custrecord_scv_queue_job_scriptid,
			deploymentId: objQueueNext.custrecord_scv_queue_job_deployid,
			params: mrObjParams
		});

		mrTask.submit();

		record.submitFields({
			type: 'customrecord_scv_queue_job',
			id: queueNextId, 
			values: {
				custrecord_scv_queue_job_status: constQueueJobStatus.RECORDS.PROCESSING.ID
			},
			options: {
				enableSourcing: false, ignoreMandatoryFields : true
			}
		});

		return queueNextId;
	}

    const isExistsProcessingCloseBalance = (_scriptId, _deployId) =>{
		let queueNextId = getCurrentProcessingQueueJob(_scriptId, _deployId);

		return !!queueNextId ? true : false;
	}

    const getCurrentProcessingQueueJob = (_scriptId, _deployId) =>{
		let arrQueueNext = query.runSuiteQL({query: `select id
			from customrecord_scv_queue_job
			where isinactive = 'F' 
				and custrecord_scv_queue_job_status = ${constQueueJobStatus.RECORDS.PROCESSING.ID}
                and custrecord_scv_queue_job_scriptid = '${_scriptId}'
				and custrecord_scv_queue_job_deployid = '${_deployId}'
		`}).asMappedResults();

		return arrQueueNext.length > 0 ? arrQueueNext[0].id : "";
	}

    const getNoteOfQueueJob = (_queueId) =>{
		if(!_queueId) return;

		let note = search.lookupFields({
			type: "customrecord_scv_queue_job", 
			id: _queueId, 
			columns: "custrecord_scv_queue_job_note"
		}).custrecord_scv_queue_job_note;

		return note;
	}

    const updateNoteQueueJob = (_scriptId, _deployId, _note) =>{
        let queueId = getCurrentProcessingQueueJob(_scriptId, _deployId);
		if(!queueId) return;

		let old_note = getNoteOfQueueJob(queueId);

		if(old_note.toString().indexOf(_note.toString()) > -1){
			return;
		}
		
		let new_note = old_note;
		if(!!_note){
			new_note += "\n" + _note
		}

		if(new_note.length > 1000){
			new_note = new_note.substring(0, 1000);
			new_note += "(more...)"
		}

		record.submitFields({
			type: 'customrecord_scv_queue_job',
			id: queueId, 
			values: {
				custrecord_scv_queue_job_note: new_note
			},
			options: {
				enableSourcing: false, ignoreMandatoryFields : true
			}
		});

        return queueId;
	}

    const completeQueueJob = (_scriptId, _deployId, _note) =>{
        let queueId = getCurrentProcessingQueueJob(_scriptId, _deployId);
		if(!queueId) return;

		let old_note = getNoteOfQueueJob(queueId);

		let new_note = old_note;
		if(!!_note){
			new_note += "\n" + _note
		}

		record.submitFields({
			type: 'customrecord_scv_queue_job',
			id: queueId, 
			values: {
				custrecord_scv_queue_job_status: constQueueJobStatus.RECORDS.COMPLETED.ID,
				custrecord_scv_queue_job_note: new_note
			},
			options: {
				enableSourcing: false, ignoreMandatoryFields : true
			}
		});

		cancelDataQueuePendingOld(queueId);

        processQueueJob(_scriptId, _deployId);

        return queueId;
	}

	const cancelDataQueuePendingOld = (_queueId) => {
		if(!_queueId) return;

        let jobScriptId = "", jobDeployId = "";
		let queueJobLKF = search.lookupFields({
			type: "customrecord_scv_queue_job", 
			id: _queueId, 
			columns: ["custrecord_scv_queue_job_scriptid", "custrecord_scv_queue_job_deployid"]
		});

        jobScriptId = queueJobLKF.custrecord_scv_queue_job_scriptid;
        jobDeployId = queueJobLKF.custrecord_scv_queue_job_deployid;

		if(!jobScriptId || !jobDeployId) return;

		let arrQueueOld = query.runSuiteQL({query: `select id
			from customrecord_scv_queue_job
			where isinactive = 'F' 
				and id < ${_queueId}
				and custrecord_scv_queue_job_scriptid = '${jobScriptId}'
				and custrecord_scv_queue_job_deployid = '${jobDeployId}'
				and custrecord_scv_queue_job_status = ${constQueueJobStatus.RECORDS.PENDING.ID}
		`}).asMappedResults();

		for(let i = 0; i < arrQueueOld.length; i++){
			record.submitFields({
				type: 'customrecord_scv_queue_job',
				id: arrQueueOld[i].id, 
				values: {
					custrecord_scv_queue_job_status: constQueueJobStatus.RECORDS.CANCEL.ID,
					custrecord_scv_queue_job_note: "OLD"
				},
				options: {
					enableSourcing: false, ignoreMandatoryFields : true
				}
			});
		}

		return arrQueueOld;
	}

    const getDataQueueJob = (_params) =>{
        let str_where = ``;
        
        if(!!_params.custrecord_scv_queue_job_scriptid){
            str_where += ` and custrecord_scv_queue_job_scriptid = '${_params.custrecord_scv_queue_job_scriptid}' `;
        }
        if(!!_params.custrecord_scv_queue_job_deployid){
            str_where += ` and custrecord_scv_queue_job_deployid = '${_params.custrecord_scv_queue_job_deployid}' `;
        }

		let arrQueue = query.runSuiteQL({query: `SELECT id, custrecord_scv_queue_job_scriptid, 
                custrecord_scv_queue_job_deployid, 
                custrecord_scv_queue_job_fieldparaminput,
                custrecord_scv_queue_job_status,
                BUILTIN.DF(custrecord_scv_queue_job_status) custrecord_scv_queue_job_status_display, 
                custrecord_scv_queue_job_datainput, 
                custrecord_scv_queue_job_note,
                BUILTIN.DF(owner) owner_display,
                TO_CHAR(created,'dd/MM/YYYY HH24:MI') as created_date
            FROM customrecord_scv_queue_job
            WHERE isinactive = 'F' ${str_where}
            ORDER BY id DESC
		`}).asMappedResults();

		return arrQueue;
	}

	const getPopupQueueJobStatusScript = () =>{
		return getPopupQueueJobStatus(RECORDS.JOB_SCRIPT.ID, RECORDS.JOB_SCRIPT.DEPLOYID);
	}

	const getPopupQueueJobStatus = (_jobScriptId, _jobDeployId) =>{
		let urlScript = url.resolveScript({
            scriptId: 'customscript_scv_sl_popup_queue_job',
            deploymentId: 'customdeploy_scv_sl_popup_queue_job',
            params: {
				custrecord_scv_queue_job_scriptid: _jobScriptId,
				custrecord_scv_queue_job_deployid: _jobDeployId
			}
        });
		
		return {
			url: urlScript,
			winname: "popupStatusQueue",
			width: 1000,
			height: 700,
			title: "Status Queue Job"
		};
	}

	const cancelQueueJob = (_queueId) =>{
		if(!_queueId) return;

		let queueRec = record.load({type: "customrecord_scv_queue_job", id: _queueId, isDynamic: true});

		let statusId = queueRec.getValue("custrecord_scv_queue_job_status");
		if(statusId != constQueueJobStatus.RECORDS.PENDING.ID) return;

		let curUser = runtime.getCurrentUser();
		queueRec.setValue("custrecord_scv_queue_job_status", constQueueJobStatus.RECORDS.CANCEL.ID);
		queueRec.setValue("custrecord_scv_queue_job_note", `Cancel by ${curUser.name} (${curUser.email})`);

		queueRec.save({enableSourcing: false, ignoreMandatoryFields: true});
	}

	const setInfoJobScript = (_taskType, _scriptId, _deployId, _paramFieldId) =>{
		RECORDS.JOB_SCRIPT.TYPE = _taskType;
		RECORDS.JOB_SCRIPT.ID = _scriptId;
		RECORDS.JOB_SCRIPT.DEPLOYID = _deployId;
		RECORDS.JOB_SCRIPT.PARAMSID = _paramFieldId;

		return RECORDS.JOB_SCRIPT;
	}

	const getJobScriptId = () =>{
		return RECORDS.JOB_SCRIPT.ID;
	}

	const getJobDeployId = () =>{
		return RECORDS.JOB_SCRIPT.DEPLOYID;
	}

    return {
		TYPE,
        FIELD,
        SUBLIST,
        RECORDS,
		setInfoJobScript,
		getJobScriptId,
		getJobDeployId,
        createQueueJob,
		createQueueJobScript,
        processQueueJob,
		processQueueJobScript,
        updateNoteQueueJob,
        completeQueueJob,
        getDataQueueJob,
		getPopupQueueJobStatus,
		getPopupQueueJobStatusScript,
		cancelQueueJob,
    };
    
});