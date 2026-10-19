/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(
    ['N/file', 'N/search'],
    (file, search) => {
        
        /**
         * Definition of the Suitelet script trigger point.
         *
         * @param {Object} context
         * @param {ServerRequest} context.request - Encapsulation of the incoming request
         * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
         * @Since 2015.2
         */
        const onRequest = (context) => {
            let request = context.request;
            let parameters = request.parameters;
            if (context.request.method === 'GET') {
                let dataHeader = getDataHeader(parameters);
                let dataDetail = getDataDetail(parameters);
                
                let templatePath = '../xml/fs_report/scv_fs_pl.xml';
                let namefile = 'PL Report.xls';
                let fileObject = file.load({
                    id: templatePath
                });
                let content = fileObject.getContents();
                content = content.replace(/{pSubsidiary}/gi, dataHeader.SubName);
                content = content.replace(/{pAddress}/gi, dataHeader.SubAddress);
                content = content.replace(/{pYear}/gi, dataHeader.YearCurrent);
                for (let idx_maso = 0; idx_maso < dataDetail.length; idx_maso++) {
                    content = content.replace("{pCur_" + dataDetail[idx_maso].maso + "}", dataDetail[idx_maso].amtCur);
                    content = content.replace("{pBef_" + dataDetail[idx_maso].maso + "}", dataDetail[idx_maso].amtBef);
                }
                let f = file.create({
                    name: namefile,
                    fileType: file.Type.XMLDOC,
                    contents: content,
                    encoding: file.Encoding.UTF8,
                });
                context.response.writeFile(f, false);
            }
        }
        
        const getDataHeader = (_params) => {
            let subsidiary = _params.custpage_subsidiary;
            let lkSubsidiary = search.lookupFields({
                type: search.Type.SUBSIDIARY, id: subsidiary.split(",")[0], columns: ['legalname',
                    'address.address']
            });
            return {
                SubName: lkSubsidiary.legalname,
                SubAddress: lkSubsidiary['address.address'],
                YearCurrent: _params.curtodt_year
            };
        }
        
        const getDataDetail = (_params) => {
            let myData = [];
            let myDataCur = getDataDetailCur(_params);
            let myDataBef = getDataDetailBef(_params);
            let arrMaSo = getListMaSo();
            for (let i = 0; i < arrMaSo.length; i++) {
                let objData = {
                    maso: arrMaSo[i].maso,
                    amtCur: 0,
                    amtBef: 0
                };
                let objCur = findByMaSo(myDataCur, objData.maso);// myDataCur.find(e => e.maso == objData.maso);
                let objBef = findByMaSo(myDataBef, objData.maso);//myDataBef.find(e => e.maso == objData.maso);
                if (objCur) {
                    objData.amtCur = Number(objCur.amt) * arrMaSo[i].factor;
                }
                if (objBef) {
                    objData.amtBef = Number(objBef.amt) * arrMaSo[i].factor;
                }
                myData.push(objData);
            }
            return myData;
        }
        
        const getDataDetailCur = (_params) => {
            let resultSearch = search.load("customsearch_scv_report_pl");
            let myFilter = resultSearch.filters;
            let myColumns = resultSearch.columns;
            if (_params.custpage_subsidiary) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: _params.custpage_subsidiary.split(","),
                }));
            }
            
            if (_params.custpage_curfromdt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_curfromdt
                }));
            }
            
            if (_params.custpage_curtodt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_curtodt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            let myData = [];
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let dataPage = resultSearch.fetch(i).data;
                for (let idx in dataPage) {
                    let obj = {};
                    let chitieu = dataPage[idx].getValue(myColumns[0]);
                    obj.maso = chitieu.substring(0, chitieu.indexOf("-")).trim();
                    obj.amt = Number(dataPage[idx].getValue(myColumns[1]));
                    myData.push(obj);
                }
            }
            return myData;
        }
        
        const getDataDetailBef = (_params) => {
            let resultSearch = search.load("customsearch_scv_report_pl");
            let myFilter = resultSearch.filters;
            let myColumns = resultSearch.columns;
            if (_params.custpage_subsidiary) {
                myFilter.push(search.createFilter({
                    name: 'subsidiary',
                    operator: search.Operator.ANYOF,
                    values: _params.custpage_subsidiary.split(","),
                }));
            }
            
            if (_params.custpage_beffromdt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORAFTER,
                    values: _params.custpage_beffromdt
                }));
            }
            if (_params.custpage_beftodt) {
                myFilter.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.ONORBEFORE,
                    values: _params.custpage_beftodt
                }));
            }
            
            resultSearch = resultSearch.runPaged({pageSize: 1000});
            let myData = [];
            for (let i = 0; i < resultSearch.pageRanges.length; i++) {
                let dataPage = resultSearch.fetch(i).data;
                for (let idx in dataPage) {
                    let obj = {};
                    let chitieu = dataPage[idx].getValue(myColumns[0]);
                    obj.maso = chitieu.substring(0, chitieu.indexOf("-")).trim();
                    obj.amt = Number(dataPage[idx].getValue(myColumns[1]));
                    myData.push(obj);
                }
            }
            return myData;
        }
        
        const getListMaSo = () => {
            return [
                {maso: "01", factor: 1},
                {maso: "02", factor: -1},
                {maso: "11", factor: -1},
                {maso: "21", factor: 1},
                {maso: "23", factor: -1},
                {maso: "22a", factor: -1},
                {maso: "25", factor: -1},
                {maso: "26", factor: -1},
                {maso: "31", factor: 1},
                {maso: "32", factor: -1},
                {maso: "51", factor: -1},
                {maso: "52", factor: -1},
                {maso: "70", factor: 1},
                {maso: "71", factor: 1}
            ];
        }
        
        const findByMaSo = (_arrFind, _maso) => {
            return _arrFind.find(o => o.maso === _maso);
        }
        
        return {
            onRequest
        };
        
    });
