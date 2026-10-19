/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/runtime'], function (search, runtime) {
    const objScriptId = {
        DEPLOY: 'customdeploy_scv_sl_calldata',
        SCRIPT: 'customscript_scv_sl_calldata',
    };

    const objAction = {
        CHECK_JOB: 'checkJob',
    };

    const onRequest = (context) => {
        if (context.request.method === 'POST' && runtime.getCurrentScript().deploymentId === objScriptId.DEPLOY) {
            postServer(context);
        } else if (context.request.method === 'GET') {
            getServer(context);
        }
    }

    const checkJob = (params) => {
        const deployId = params.mrId;
        let searchObj = search.load({id: 'customsearch_scv_ss_check_job'});
        searchObj.filters.push(search.createFilter({
            name: "formulatext",
            formula: "{scriptDeployment.scriptid}",
            operator: 'is',
            values: deployId
        }));
        let searchData = searchObj.run().getRange(0, 1);
        const isJobRunning = searchData.length > 0 ? 'T' : 'F';
        return {
            isJobRunning: isJobRunning,
            deployId: deployId
        }
    }

    const getServer = (context) => {
        const request = context.request;
        const response = context.response;
        log.audit('Request', request);
        log.audit('getServer_params', request.parameters);
        let objResponse = {isSuccess: true};
        let params = request.parameters;
        try {
            switch (params.action) {
                case objAction.CHECK_JOB:
                    objResponse.response = checkJob(params);
                    break;
                default:
                    break;
            }
        } catch (e) {
            objResponse.isSuccess = false;
            objResponse.msg = e.message;
            log.debug("Error getServer", e);
        }
        log.audit('getServer_response', objResponse);
        response.write(JSON.stringify(objResponse));
    }


    const postServer = (context) => {
        const request = context.request;
        const response = context.response;
        response.setHeader({name: 'Content-Type', value: 'application/json'});
        try {
            let objBody = JSON.parse(request.body);
            let jsonData = {isSuccess: true};
            log.debug('Post Server__action_'.concat(objBody.action), objBody);
            switch (objBody.action) {
                default:
                    break;
            }
            log.audit({title: 'Response', details: JSON.stringify(jsonData)});
            response.write(JSON.stringify(jsonData));
        } catch (e) {
            log.error("Error postServer", e);
            response.write(JSON.stringify({
                isSuccess: false,
                msg: e.message,
            }));
        }
    }

    return {
        onRequest: onRequest
    }
})