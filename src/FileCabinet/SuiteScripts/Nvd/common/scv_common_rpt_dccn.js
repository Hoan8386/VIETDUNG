/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  19 Jun 2025         Huy Pham			    Init, create file, báo cáo đối chiếu công nợ,from ms.Ngọc(https://app.clickup.com/t/86czaq0qp)
 */
define(['N/search',
    '../lib/scv_lib_function.js',
    '../olib/alasql/alasql.min@4.6.6.js',
    '../cons/scv_cons_format.js',
],
    (search,
        lbf,
        alasql,
        constFormat
    ) => {
        const _export = {
            params: {},
            arrCustomer: [],
            arrSoDu: [],
            arrXuatKho: [],
            arrThanhToan: [],
            arrEntity: [],
            arrTranDate: [],
        };

        _export.setDataInput = function ({
            params = {},
            arrCustomer = [],
            arrSoDu = [],
            arrXuatKho = [],
            arrThanhToan = [],
        }) {
            this.params = params;
            this.arrCustomer = arrCustomer;
            this.arrSoDu = arrSoDu;
            this.arrXuatKho = arrXuatKho;
            this.arrThanhToan = arrThanhToan;

            this.arrXuatKho.forEach(objRes => {
                objRes.yyyymmdd = constFormat.dateToChar(objRes.ngay, "YYYYMMDD");
            });
            this.arrThanhToan.forEach(objRes => {
                objRes.yyyymmdd = constFormat.dateToChar(objRes.ngay, "YYYYMMDD");
            });

            this.arrEntity = alasql(`
                SELECT DISTINCT subsidiary_id, entity_id
                FROM (
                    SELECT DISTINCT subsidiary_id,
                        customer_id as entity_id
                    FROM ? 
                    UNION ALL
                    SELECT DISTINCT cong_ty_id as subsidiary_id,
                        khach_hang_id as entity_id
                    FROM ?
                    UNION ALL
                    SELECT DISTINCT cong_ty_id as subsidiary_id,
                        khach_hang_id as entity_id
                    FROM ?
                ) AS combined
            `, [this.arrSoDu, this.arrXuatKho, this.arrThanhToan]);

            this.arrTranDate = alasql('SELECT DISTINCT yyyymmdd FROM ? ORDER BY yyyymmdd', [this.arrXuatKho.concat(this.arrThanhToan)]);
        }

        _export.getDataSourceResult = function() {
            let arrResult = [];

            let arrSubsidiary = alasql(`
                SELECT DISTINCT subsidiary_id
                FROM ?
            `, [this.arrEntity]);

            for(let i = 0; i < arrSubsidiary.length; i++){
                let objSubsidiary = arrSubsidiary[i];

                let subName = search.lookupFields({
                    type: "subsidiary", id: objSubsidiary.subsidiary_id, 
                    columns: "namenohierarchy"
                }).namenohierarchy;

                let objResSubsidiary = {
                    idxRow: lbf.uuidv4(),
                    idxRowParent: -1,
                    lvl: 1,
                    stt: subName,
                    subsidiary_id: objSubsidiary.subsidiary_id,
                    amount: 0, amount_paid: 0,
                    rowPreparedData: {
                        style: {
                            fontWeight: "bold",
                            backgroundColor: "#B8CCE4"
                        }
                    }
                }

                arrResult.push(objResSubsidiary);

                let arrEntity_bySubsidiary = this.arrEntity.filter(e => e.subsidiary_id == objSubsidiary.subsidiary_id);
                for(let j = 0; j < arrEntity_bySubsidiary.length; j++){
                    let objEntity = arrEntity_bySubsidiary[j];

                    let objCustomer = this.arrCustomer.find(e => e.internalid == objEntity.entity_id);

                    let objResEntity = {
                        idxRow: lbf.uuidv4(),
                        idxRowParent: objResSubsidiary.idxRow,
                        lvl: 2,
                        stt: objCustomer?.entityid||("ID: " + objEntity.entity_id),
                        subsidiary_id: objSubsidiary.subsidiary_id,
                        entity_id: objEntity.entity_id,
                        entity_name: objCustomer?.entityid||("ID: " + objEntity.entity_id),
                        rowPreparedData: {
                            style: {
                                fontWeight: "bold",
                                backgroundColor: "#F2DBDB"
                            }
                        }
                    }

                    arrResult.push(objResEntity);

                    //#region Tính Số Dư Đầu Kỳ
                    let objResBegin = {
                        idxRow: lbf.uuidv4(),
                        idxRowParent: objResEntity.idxRow,
                        lvl: 3,
                        subsidiary_id: objSubsidiary.subsidiary_id,
                        entity_id: objEntity.entity_id,
                        stt: "", trandate: "", tranid: "", memo: "Dư đầu kỳ", unit: "",
                        quantity: "", rate: "", amount: "", amount_paid: "",
                        rowPreparedData: {
                            style: {
                                fontWeight: "bold"
                            }
                        }
                    };


                    let amountOfBegin = 0;
                    
                    let objSoDu_Entity = this.arrSoDu.find(e => e.subsidiary_id == objSubsidiary.subsidiary_id 
                        && e.customer_id == objEntity.entity_id
                    );
                    if(!!objSoDu_Entity){{
                        amountOfBegin = Number(objSoDu_Entity.amount_debit) - Number(objSoDu_Entity.amount_credit);
                        amountOfBegin = constFormat.roundNumber(amountOfBegin, 2);
                    }}

                    if(amountOfBegin > 0){
                        objResBegin.amount = amountOfBegin;
                    }
                    else{
                        objResBegin.amount_paid = Math.abs(amountOfBegin);
                    }

                    arrResult.push(objResBegin);

                    //#endregion

                    //#region Tính Phát Sinh
                    let objResPhatSinhTotal = {
                        idxRow: lbf.uuidv4(),
                        idxRowParent: objResEntity.idxRow,
                        lvl: 4,
                        stt: "",
                        subsidiary_id: objSubsidiary.subsidiary_id,
                        entity_id: objEntity.entity_id,
                        memo: "Tổng phát sinh",
                        quantity: 0,
                        rate: "",
                        amount: 0,
                        amount_paid: 0,
                        rowPreparedData: {
                            style: {
                                fontWeight: "bold"
                            }
                        }
                    };

                    let stt = 1;

                    let arrXuatKho_Entity = this.arrXuatKho.filter(e => e.cong_ty_id == objSubsidiary.subsidiary_id
                        && e.khach_hang_id == objEntity.entity_id
                    );
                    let arrThanhToan_Entity = this.arrThanhToan.filter(e => e.cong_ty_id == objSubsidiary.subsidiary_id
                        && e.khach_hang_id == objEntity.entity_id
                    );

                    let arrTranDate = alasql(`SELECT DISTINCT yyyymmdd 
                        FROM ? ORDER BY yyyymmdd
                    `, [arrXuatKho_Entity.concat(arrThanhToan_Entity)]);

                    arrTranDate.forEach(objTranDate => {
                        let arrXuatKhoDate = arrXuatKho_Entity.filter(e => e.yyyymmdd === objTranDate.yyyymmdd);
                        let arrThanhToanDate = arrThanhToan_Entity.filter(e => e.yyyymmdd === objTranDate.yyyymmdd);

                        //#region  Xử lý xuất kho/Thông tin đơn hàng
                        let arrXuatKhoTranid = alasql(`
                            SELECT DISTINCT ngay, chung_tu FROM ?
                        `, [arrXuatKhoDate]);

                        arrXuatKhoTranid.forEach(objXuatKhoTranid => {

                            //#region Dòng tổng hợp xuất kho
                            let objResXuatKhoTotal = {
                                idxRow: lbf.uuidv4(),
                                idxRowParent: objResEntity.idxRow,
                                subsidiary_id: objSubsidiary.subsidiary_id,
                                entity_id: objEntity.entity_id,
                                stt: stt++,
                                trandate: objXuatKhoTranid.ngay,
                                tranid: objXuatKhoTranid.chung_tu,
                                memo: objXuatKhoTranid.chung_tu,
                                unit: "",
                                quantity: 0,
                                rate: "",
                                amount: 0,
                                amount_paid: "",
                                rowPreparedData: {
                                    style: {
                                        fontWeight: "bold"
                                    }
                                }
                            };

                            arrResult.push(objResXuatKhoTotal);
                            //#endregion

                            //#region Dòng chi tiết xuất kho
                            let arrXuatKhoTranidDate = arrXuatKhoDate.filter(e => e.ngay === objXuatKhoTranid.ngay 
                                && e.chung_tu === objXuatKhoTranid.chung_tu);

                            arrXuatKhoTranidDate.forEach(objXuatKho =>{
                                let objRes = {
                                    idxRow: lbf.uuidv4(),
                                    idxRowParent: objResEntity.idxRow,
                                    subsidiary_id: objSubsidiary.subsidiary_id,
                                    entity_id: objEntity.entity_id,
                                    stt: stt++,
                                    trandate: objXuatKho.ngay,
                                    tranid: objXuatKho.chung_tu,
                                    memo: objXuatKho.dien_giai,
                                    unit: objXuatKho.dvt,
                                    quantity: objXuatKho.so_luong * 1,
                                    rate: 0,
                                    amount: objXuatKho.thanh_tien * 1,
                                    amount_paid: "",
                                    internal_id: objXuatKho.id,
                                };

                                objRes.rate = objRes.quantity == 0 ? 0 : (objRes.amount / objRes.quantity);
                                objRes.rate = constFormat.roundNumber(objRes.rate, 5);

                                arrResult.push(objRes);

                                objResXuatKhoTotal.quantity += objRes.quantity;
                                objResXuatKhoTotal.amount += objRes.amount;

                                objResXuatKhoTotal.internal_id = objRes.internal_id;
                            });
                            //#endregion

                            objResPhatSinhTotal.quantity += objResXuatKhoTotal.quantity;
                            objResPhatSinhTotal.amount += objResXuatKhoTotal.amount;
                        });
                        //#endregion

                        //#region  Xử lý thanh toán
                        arrThanhToanDate.forEach(objThanhToan => {
                            let objRes = {
                                idxRow: lbf.uuidv4(),
                                idxRowParent: objResEntity.idxRow,
                                subsidiary_id: objSubsidiary.subsidiary_id,
                                entity_id: objEntity.entity_id,
                                stt: stt++,
                                trandate: objThanhToan.ngay,
                                tranid: objThanhToan.hoa_don,
                                memo: objThanhToan.dien_giai,
                                unit: "",
                                quantity: "",
                                rate: "",
                                amount: "",
                                amount_paid: objThanhToan.thanh_toan * 1,
                                internal_id: objThanhToan.id,
                                rowPreparedData: {
                                    style: {
                                        fontWeight: "bold"
                                    }
                                }
                            };

                            arrResult.push(objRes);

                            objResPhatSinhTotal.amount_paid += objRes.amount_paid;
                        });
                        //#endregion
                    });

                    objResPhatSinhTotal.amount = constFormat.roundNumber(objResPhatSinhTotal.amount, 2);
                    objResPhatSinhTotal.amount_paid = constFormat.roundNumber(objResPhatSinhTotal.amount_paid, 2);

                    arrResult.push(objResPhatSinhTotal);
                    
                    objResSubsidiary.amount += objResPhatSinhTotal.amount;
                    objResSubsidiary.amount_paid += objResPhatSinhTotal.amount_paid;
                    //#endregion

                    //#region Dư cuối kỳ
                    let objResEnd = {
                        idxRow: lbf.uuidv4(),
                        idxRowParent: objResEntity.idxRow,
                        lvl: 5,
                        stt: "",
                        subsidiary_id: objSubsidiary.subsidiary_id,
                        entity_id: objEntity.entity_id,
                        memo: "Dư cuối kỳ",
                        quantity: "",
                        rate: "",
                        amount: "",
                        amount_paid: "",
                        rowPreparedData: {
                            style: {
                                fontWeight: "bold"
                            }
                        }
                    };

                    let amountOfEnd = amountOfBegin + objResPhatSinhTotal.amount - objResPhatSinhTotal.amount_paid
                    amountOfEnd = constFormat.roundNumber(amountOfEnd, 2);

                    if(amountOfEnd > 0){
                        objResEnd.amount = amountOfEnd;
                    }
                    else{
                        objResEnd.amount_paid = Math.abs(amountOfEnd);
                    }

                    arrResult.push(objResEnd);
                    //#endregion
                }

                objResSubsidiary.amount = constFormat.roundNumber(objResSubsidiary.amount, 2);
                objResSubsidiary.amount_paid = constFormat.roundNumber(objResSubsidiary.amount_paid, 2);
            }
            
            return arrResult;
        }

        _export.getColumns = function () {
            let maskFormatVND = constFormat.getMaskFormatNumber('VND');

            let arrColumns = [
                {
                    dataField: 'stt', caption: 'STT', dataType: "string", minWidth: 120,
                    cellTemplate: (container, options) => {
                        if(!options.data.stt) return;

                        let iconPrint = ``;
                        if(options.data.lvl == 2){
                            iconPrint += `<i class="dx-icon-xlsxfile scv-icon-style mx-2" onclick="window._scvExportResult('xlsx', '${options.data.idxRow}')"></i>`;
                            iconPrint += `<i class="dx-icon-print scv-icon-style mx-2" onclick="window._scvExportResult('pdf', '${options.data.idxRow}')"></i>`;
                        }

                        container.append(`${iconPrint}<span>${options.data.stt||""}</span>`);
                    }
                },
                {dataField: 'trandate', caption: 'Ngày', dataType: "string", width: 120},
                {dataField: 'tranid', caption: 'Chứng từ', dataType: "string", width: 150,},
                {dataField: 'memo', caption: 'Diễn giải', dataType: "string", width: 300},
                {dataField: 'unit', caption: 'Đvt', dataType: "string", width: 80},
                {dataField: 'quantity', caption: 'Số lượng', dataType: 'number', format: maskFormatVND, width: 120},
                {dataField: 'rate', caption: 'Đơn giá', dataType: 'number', format: maskFormatVND, width: 120},
                {dataField: 'amount', caption: 'Thành tiền', dataType: 'number', format: maskFormatVND, width: 150},
                {dataField: 'amount_paid', caption: 'Thanh toán', dataType: 'number', format: maskFormatVND, width: 150},
            ];

            return arrColumns;
        }

        return _export;
    });
