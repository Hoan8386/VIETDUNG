/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/format', 'N/runtime', 'N/search', 'N/ui/serverWidget',
        '../lib/scv_lib_report', '../lib/scv_lib_cmms', '../lib/scv_lib_common_info'],

    (format, runtime, search, serverWidget, libRep, libCmms, libCommonInfo) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            let request = scriptContext.request;
            let parameters = request.parameters;
            let response = scriptContext.response;
            let subsidiary = parameters.custpage_subsidiary || String(runtime.getCurrentUser().subsidiary);
            parameters.custpage_subsidiary = subsidiary;
            let master = getMaster();
            let {month, year} = getFromDateToDate(parameters);
            let masterBCC = getMasterBCC(month, year);
            let masterNCCD = getMasterNCCD();

            let listData = parameters.isSearch === 'T' ? getListDataThongKeLaborPxcd(parameters) : [];
            const listDataBCC = Object.values(groupByEmpAndDays(listData));
            // const listDataTeam = groupByTeam(listData);
            const listDataTeam = groupByTeamWorkCode(listData);
            let groupTeam = listDataTeam.groupTeam;
            let listDataNCCD = listDataTeam.result;

            if (parameters.isgetdata === 'T') {
                response.write(JSON.stringify({
                    listData: listData || [],
                    listDataBCC: listDataBCC || [],
                    listDataNCCD: listDataNCCD || [],
                    groupTeam: groupTeam || [],
                    inforReport: libCommonInfo.getInforReport({subsidiary})
                }));
            } else if (parameters.action === 'getUrlTemplate') {
                response.write(JSON.stringify({urlTemplate: libCommonInfo.getUrlFileTemplate('EXCEL', 'scv_xlsx_rp_pxcd.xlsx')}));
            }
            if (request.method === 'GET') {
                let form = createForm(parameters, subsidiary);
                let sublist = createSublist(form, master.sublistId);
                let sublistBCC = createSublistBCC(form, month, year);
                let sublistNCCD = createSublistNCCD(form);
                libRep.addFieldHeaderColList(sublist, master.col);
                libRep.addFieldHeaderColList(sublistBCC, masterBCC.col);
                libRep.addFieldHeaderColList(sublistNCCD, masterNCCD.col);
                if (listData) {
                    setSublistValueLine(master, sublist, listData);
                    setSublistValueLineBCC(masterBCC, sublistBCC, listDataBCC);
                    setSublistValueLineNCCD(masterNCCD, sublistNCCD, listDataNCCD, year, month);
                }
                response.writePage(form);
            }
        }

        const groupByTeamWorkCode = (data) => {
            const groupedData = data.reduce((acc, item) => {
                const teamKey = item.team || '';
                if (!acc[teamKey]) {
                    acc[teamKey] = {
                        team: teamKey,
                        totalManhours: 0,
                        totalMandays: 0,
                        workcodeMap: {},
                    };
                }

                // Bỏ qua dòng team tổng
                if (item.isTeamLine) return acc;

                const { workcode, manhours, mandays } = item;
                const group = acc[teamKey];

                if (!group.workcodeMap[workcode]) {
                    group.workcodeMap[workcode] = {
                        workcode,
                        workname: item.workname,
                        date: item.date,
                        workdes: item.workdes,
                        manhours: 0,
                        mandays: 0,
                    };
                }

                group.workcodeMap[workcode].manhours += parseFloat(manhours) || 0;
                group.workcodeMap[workcode].mandays += parseFloat(mandays) || 0;

                group.totalManhours += parseFloat(manhours) || 0;
                group.totalMandays += parseFloat(mandays) || 0;

                return acc;
            }, {});

            // Biến đổi kết quả thành mảng, thêm isTeamLine và stt
            const result = [];
            const groupTeam = [];

            for (const teamKey in groupedData) {
                const group = groupedData[teamKey];
                groupTeam.push(teamKey);

                // Dòng tổng team
                result.push({
                    isTeamLine: true,
                    team: teamKey,
                    totalManhours: Math.round(group.totalManhours * 100) / 100,
                    totalMandays: Math.round(group.totalMandays * 100) / 100,
                });

                // Các dòng chi tiết theo workcode
                const details = Object.values(group.workcodeMap).map((item, index) => ({
                    stt: index + 1,
                    workcode: item.workcode,
                    workname: item.workname,
                    date: item.date,
                    workdes: item.workdes,
                    manhours: Math.round(item.manhours * 100) / 100,
                    mandays: Math.round(item.mandays * 100) / 100,
                }));

                result.push(...details);
            }

            return { result, groupTeam };
        };

        const setSublistValueLineNCCD = (master, sublist, listData, year, month) => {
            let line = 0;
            let totalManhours = 0;
            let totalMandays = 0;

            // listData = groupByWorkCode(listData);

            for (let item of listData) {
                if (item.isTeamLine) {
                    sublist.setSublistValue({
                        id: "workname",
                        line: line,
                        value: `<b>Nhật ký công việc tổ ${item.team} - tháng ${month}.${year}</b>`
                    });
                    sublist.setSublistValue({
                        id: "manhours",
                        line: line,
                        value: item.totalManhours,
                    });
                    sublist.setSublistValue({
                        id: "mandays",
                        line: line,
                        value: item.totalMandays,
                    });
                } else {
                    for (let col of master.col) {
                        let value = item[col.id];
                        if (value || value === 0) {
                            sublist.setSublistValue({
                                id: col.id,
                                line: line,
                                value: value
                            });
                        }
                    }
                    totalManhours += parseFloat(item.manhours) || 0;
                    totalMandays += parseFloat(item.mandays) || 0;
                }

                line++;
            }
            sublist.setSublistValue({
                id: "workname",
                line: line,
                value: "<b>Tổng cộng</b>"
            });
            sublist.setSublistValue({
                id: "manhours",
                line: line,
                value: Math.round(totalManhours * 100) / 100,
            });
            sublist.setSublistValue({
                id: "mandays",
                line: line,
                value: Math.round(totalMandays * 100) / 100,
            });
        };


        const setSublistValueLineBCC = (master, sublist, listData) => {
            let currentStringDate = getCurrentStringDate();
            let line = 0;
            let columnTotals = {};
            for (let col of master.col) {
                columnTotals[col.id] = 0;
            }
            for (let objData of listData) {
                assignDataDefault(objData, currentStringDate);
                for (let objCol of master.col) {
                    let tempValue = objData[objCol.id];
                    if (tempValue || tempValue === 0) {
                        if (objCol.type === "float") {
                            tempValue = parseFloat(tempValue);
                            columnTotals[objCol.id] += tempValue;
                        }
                        sublist.setSublistValue({
                            id: objCol.id,
                            line: line,
                            value: tempValue,
                        });
                    }
                }
                line++;
            }

            sublist.setSublistValue({
                id: master.col[0].id,
                line: line,
                value: "Tổng cộng",
            });
            for (let objCol of master.col) {
                if (objCol.type === "float") {
                    sublist.setSublistValue({
                        id: objCol.id,
                        line: line,
                        value: columnTotals[objCol.id],
                    });
                }
            }

            sublist.setSublistValue({
                id: master.col[0].id,
                line: line,
                value: "<b>Tổng cộng</b>",
            });

            for (let objCol of master.col) {
                if (objCol.type === "float") {
                    sublist.setSublistValue({
                        id: objCol.id,
                        line: line,
                        value: columnTotals[objCol.id],
                    });
                }
            }
        };

        const setSublistValueLine = (master, sublist, listData) => {
            let currentStringDate = getCurrentStringDate();
            let line = 0;
            for (let objData of listData) {
                assignDataDefault(objData, currentStringDate);
                for (let objCol of master.col) {
                    let tempValue = objData[objCol.id];
                    if (tempValue) {
                        sublist.setSublistValue({id: objCol.id, line: line, value: tempValue});
                    }
                }
                line++;
            }
        };

        const createForm = (parameters, subsidiary) => {
            let form = serverWidget.createForm({title: "Báo cáo nhân công PXCĐ"});
            form.clientScriptModulePath = '../cs/scv_cs_cmms_nhancong_pxcd.js';
            form.addButton({id: 'custpage_bt_search', label: 'Tìm kiếm', functionName: 'onSearchResult()'});
            form.addButton({id: 'custpage_bt_export', label: 'Xuất', functionName: 'exportReport()'});
            let container = 'fieldgroup_dc_main';
            form.addFieldGroup({id: container, label: 'Filter'});

            let fieldSubsidiary = form.addField({
                id: 'custpage_subsidiary',
                type: serverWidget.FieldType.SELECT,
                label: 'CÔNG TY',
                container: container
            });
            fieldSubsidiary.isMandatory = true;
            libRep.addSelectSubsidiary(fieldSubsidiary, subsidiary);

            let defaultDate = getDateDefault(parameters);
            let fieldFromdate = form.addField({
                id: 'custpage_fromdate',
                type: serverWidget.FieldType.DATE,
                label: 'Ngày bắt đầu',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.STARTROW});
            fieldFromdate.isMandatory = true;
            fieldFromdate.defaultValue = parameters.custpage_fromdate || defaultDate.fromdate;

            let fieldTodate = form.addField({
                id: 'custpage_todate',
                type: serverWidget.FieldType.DATE,
                label: 'Ngày kết thúc',
                container: container
            }).updateLayoutType({layoutType: serverWidget.FieldLayoutType.ENDROW});
            fieldTodate.isMandatory = true;
            fieldTodate.defaultValue = parameters.custpage_todate || defaultDate.todate;

            let fieldDepartment = form.addField({
                id: 'custpage_department',
                type: serverWidget.FieldType.SELECT,
                label: 'Bộ phận',
                container: container, source: 'department'
            });
            fieldDepartment.defaultValue = parameters.custpage_department;

            let fieldEmployee = form.addField({
                id: 'custpage_employee',
                type: serverWidget.FieldType.SELECT,
                label: 'Người thực hiện',
                container: container, source: 'employee'
            });
            fieldEmployee.defaultValue = parameters.custpage_employee;

            let fieldWorkItem = form.addField({
                id: 'custpage_workitem',
                type: serverWidget.FieldType.TEXT,
                label: 'Hạng mục công việc',
                container: container
            });
            fieldWorkItem.defaultValue = parameters.custpage_workitem;
            return form;
        }

        const getDateDefault = (parameters) => {
            let fromdate = parameters.custpage_fromdate;
            let todate = parameters.custpage_todate;
            if (!fromdate) {
                let dFrom = new Date();
                dFrom.setDate(1);
                fromdate = format.format({type: format.Type.DATE, value: dFrom});
                let dTo = new Date();
                dTo.setMonth(dFrom.getMonth() + 1);
                dTo.setDate(0);
                todate = format.format({type: format.Type.DATE, value: dTo});
            }
            return {fromdate, todate}
        }

        const createSublist = (form, sublistId) =>
            form.addSublist({
                id: sublistId,
                type: serverWidget.SublistType.LIST,
                label: 'Nhật ký công việc'
            });

        const createSublistBCC = (form) =>
            form.addSublist({
                id: 'custpage_sl_result_bcc',
                type: serverWidget.SublistType.LIST,
                label: 'Bảng chấm công'
            });

        const createSublistNCCD = (form) =>
            form.addSublist({
                id: 'custpage_sl_result_nccd',
                type: serverWidget.SublistType.LIST,
                label: 'Nhân công cơ điện'
            });

        const getMaster = () => {
            let col = [
                {id: 'date', label: 'Ngày thực hiện', type: 'text', display: 'disabled'},
                {id: 'workcode', label: 'Mã hạng mục', type: 'text', display: 'disabled'},
                {id: 'workname', label: 'Tên hạng mục', type: 'text', display: 'disabled'},
                {id: 'empcode', label: 'Mã nhân viên', type: 'text', display: 'disabled'},
                {id: 'empname', label: 'Tên nhân viên', type: 'text', display: 'disabled'},
                {id: 'workdes', label: 'Nội dung công việc', type: 'text', display: 'disabled'},
                {id: 'manhours', label: 'Số giờ thực hiện', type: 'float', display: 'disabled'},
                {id: 'mandays', label: 'Công thực hiện', type: 'float', display: 'disabled'},
            ];
            return {sublistId: 'custpage_sl_result', col};
        }

        const groupByEmpAndDays = (data) => {
            const grouped = data.reduce((acc, item) => {
                let [day] = item.date.split(" ")[0].split("/");
                day = parseInt(day, 10).toString();
                const key = `${item.empcode}-${item.empname}`;
                if (!acc[key]) {
                    acc[key] = {
                        empcode: item.empcode,
                        empname: item.empname,
                        total_manhours: 0,
                    };
                }
                const manhoursKey = `manhours${day}`;
                const manhoursValue = parseFloat(item.manhours || 0);
                acc[key][manhoursKey] = (acc[key][manhoursKey] || 0) + manhoursValue;
                acc[key].total_manhours += manhoursValue;
                return acc;
            }, {});
            return Object.values(grouped).map((entry) => {
                return {
                    ...entry,
                    ngay_cong: parseFloat((entry.total_manhours / 8).toFixed(2))
                };
            });
        };

        const groupByTeam = (listData) => {
            let stt = 1;
            const groupedData = listData.reduce((acc, item) => {
                const key = item.team || "";
                if (!acc[key]) {
                    acc[key] = {
                        team: key,
                        totalManhours: 0,
                        totalMandays: 0,
                        details: [],
                    };
                }

                acc[key].details.push({
                    stt: stt,
                    date: item.date,
                    workcode: item.workcode,
                    workname: item.workname,
                    manhours: parseFloat(item.manhours) || 0,
                    mandays: parseFloat(item.mandays) || 0,
                    workdes: item.workdes,
                });
                stt++;

                acc[key].totalManhours += parseFloat(item.manhours) || 0;
                acc[key].totalMandays += parseFloat(item.mandays) || 0;

                return acc;
            }, {});

            // Create the array of grouped data
            const result = Object.values(groupedData).reduce((output, group) => {
                output.push({
                    isTeamLine: true,
                    team: group.team,
                    totalManhours: group.totalManhours,
                    totalMandays: group.totalMandays,
                });
                output.push(...group.details);
                return output;
            }, []);

            // Create a unique list of teams
            const groupTeam = Array.from(new Set(listData.map(item => item.team || "")));

            return {result, groupTeam};
        }


        const getMasterBCC = (month, year) => {
            let col = [
                {id: 'empcode', label: 'Mã nhân viên', type: 'text', display: 'disabled'},
                {id: 'empname', label: 'Tên nhân viên', type: 'text', display: 'disabled'},
            ];
            let daysInMonth = new Date(year, month, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                col.push({
                    id: `manhours${i}`,
                    label: `${i}`,
                    type: 'float',
                    display: 'disabled'
                });
            }
            col.push(
                {id: 'total_manhours', label: 'Tổng số giờ/tháng', type: 'float', display: 'disabled'},
                {id: 'ngay_cong', label: 'Ngày công', type: 'float', display: 'disabled'}
            );
            return {sublistId: 'custpage_sl_result_bcc', col};
        };


        const getMasterNCCD = () => {
            let col = [
                {id: 'stt', label: 'STT', type: 'text', display: 'disabled'},
                {id: 'workcode', label: 'Hạng mục', type: 'text', display: 'disabled'},
                {id: 'workname', label: 'Tên hạng mục', type: 'text', display: 'disabled'},
                {id: 'manhours', label: 'Nhân công thực hiện (giờ)', type: 'float', display: 'disabled'},
                {id: 'mandays', label: 'Nhân công thực hiện (công)', type: 'float', display: 'disabled'},
                {id: 'note', label: 'Ghi chú', type: 'text', display: 'disabled'}//old: workdes khong hien thi workdes
            ];
            return {sublistId: 'custpage_sl_result_nccd', col};
        }

        const getCurrentStringDate = () => {
            return format.format({type: format.Type.DATE, value: libCmms.getDateNow(7)});
        }

        const assignDataDefault = (objData, ngaynhanhang) => {
            objData.custrecord_scv_cmms_bg_estimatequantity_hidden = objData.custrecord_scv_cmms_bg_estimatequantity;
            objData.quantityrequest = objData.custrecord_scv_cmms_bg_estimatequantity;
            objData.loaiycmh = libCmms.CmmsPrType.NOI_DIA;
            objData.department = libCmms.Department.PHONG_XUAT_NHAP_KHAU;
            objData.ngaynhanhang = ngaynhanhang;
        }

        const getFromDateToDate = (parameters) => {
            let month = null, year = null;
            if(parameters.custpage_fromdate) {
                let objFromDate = format.parse({type: format.Type.DATE, value: parameters.custpage_fromdate});
                month = objFromDate.getMonth() + 1;
                year = objFromDate.getFullYear();
            }
            return {month, year}
        }

        const getListDataThongKeLaborPxcd = (parameters) => {
            let legal_name;
            if (parameters.custpage_employee) {
                let lkFieldsEmp = search.lookupFields({
                    type: 'employee',
                    id: parameters.custpage_employee,
                    columns: ["firstname"]
                });
                legal_name = lkFieldsEmp.firstname;
            }

            let listData = [];
            const SSID_THONGKE_LABOR_PXCD = 'customsearch_cmms_labor_pxcd';
            let arrFilters = [];
            pushFilterThongKeLaborPxcd(arrFilters, parameters, legal_name);
            libRep.doSearchSSRangeLabelId(SSID_THONGKE_LABOR_PXCD, 1000, listData, arrFilters);
            return listData;
        }

        const pushFilterThongKeLaborPxcd = (arrFilters, parameters, legal_name) => {
            arrFilters.push({
                name: 'formulatext',
                operator: search.Operator.IS,
                values: parameters.custpage_subsidiary,
                formula: "NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_subsidiary.id},{custrecord_scv_cmms_lb_subsidiaries.id})"
            });
            if (parameters.custpage_department) {
                arrFilters.push(search.createFilter({
                    name: 'custrecord_scv_cmms_lb_department',
                    operator: search.Operator.ANYOF,
                    values: parameters.custpage_department
                }));
            }
            // if (parameters.custpage_fromdate) {
            //     arrFilters.push(search.createFilter({
            //         name: 'created',
            //         operator: search.Operator.ONORAFTER,
            //         values: parameters.custpage_fromdate
            //     }));
            // }
            // if (parameters.custpage_todate) {
            //     arrFilters.push(search.createFilter({
            //         name: 'created',
            //         operator: search.Operator.ONORBEFORE,
            //         values: parameters.custpage_todate
            //     }));
            // }

            //DuongLong fix (18/04/2025)
            if (parameters.custpage_fromdate) {
                arrFilters.push(search.createFilter({
                    name: 'formuladate',
                    formula: "NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_date}, {custrecord_scv_cmms_lb_date})",
                    operator: search.Operator.ONORAFTER,
                    values: parameters.custpage_fromdate
                }));
            }
            if (parameters.custpage_todate) {
                arrFilters.push(search.createFilter({
                    name: 'formuladate',
                    formula: "NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_date}, {custrecord_scv_cmms_lb_date})",
                    operator: search.Operator.ONORBEFORE,
                    values: parameters.custpage_todate
                }));
            }
            if (legal_name) {
                arrFilters.push(search.createFilter({
                    name: 'firstname',
                    join: 'custrecord_scv_cmms_lb_employee',
                    operator: search.Operator.IS,
                    values: legal_name
                }));
            }
            if (parameters.custpage_workitem) {
                arrFilters.push({
                    name: 'formulatext',
                    operator: search.Operator.CONTAINS,
                    values: parameters.custpage_workitem,
                    formula: "NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_workitemcode},{custrecord_scv_cmms_lb_jobcode.custrecord_scv_cmms_wi_code})"
                });
                //NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_workitename},{custrecord_scv_cmms_lb_jobtitle})
                //NVL({custrecord_scv_cmms_lb_cmmswo.custrecord_scv_cmms_wo_workitemcode},{custrecord_scv_cmms_lb_jobcode.custrecord_scv_cmms_wi_code})
            }
        }

        return {onRequest}

    });
