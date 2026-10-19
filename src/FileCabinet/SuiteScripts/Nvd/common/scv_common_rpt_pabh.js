/**
 * Nội dung: 
 * Key:
 * =======================================================================================
 *  Date                Author                  Description
 *  21 May 2025         Huy Pham			    Init, create file, báo cáo phương án bán hàng,from ms.Ngọc(https://app.clickup.com/t/86cyzcz1u)
 *  19 Aug 2025         Huy Pham                Update report layout and logic, from ms.Ngọc(https://app.clickup.com/t/86cyzcz1u?comment=90160129230101)
 */
define([
    '../olib/alasql/alasql.min@1.7.3.js',
    '../cons/scv_cons_format.js',
],
    (
        alasql,
        constFormat
    ) => {
        const _export = {
            parameters: {},
            arrTransSales: [],
            arrSalesTerm: [],
        };

        _export.setDataInput = function ({
            parameters = {},
            arrTransSales = [],
            arrSalesTerm = [],
        }) {
            this.parameters = parameters;
            this.arrTransSales = arrTransSales;
            this.arrSalesTerm = arrSalesTerm;
        }

        _export.getDataSourceResult = function() {
            let arrResult = [];

            let params = this.parameters;
            let arrTransSales = this.arrTransSales;
            let arrSalesTerm = this.arrSalesTerm;

            let date_YYYY = constFormat.getYYYY(params.custpage_date);
            let date_MM = constFormat.getMM(params.custpage_date);

            let arrResTransSales = arrTransSales.map(objTransSales =>{
                let objResTransSales = {
                    year: objTransSales["3:year"],
                    month: objTransSales["4:month"],
                    customerid: objTransSales["8:customerid"],
                    customercode: objTransSales["9:customercode"],
                    customername: objTransSales["10:customername"],
                    customergroup_display: objTransSales["6:customergroup_display"],
                    itemgroup1_display: objTransSales["11:itemgroup1_display"],
                    itemgroup2: objTransSales["12:itemgroup2"],
                    itemgroup2_display: objTransSales["12:itemgroup2_display"],
                    amount: objTransSales["13:amount"] * 1,
                };
                return objResTransSales;
            });

            let arrKeyGroup = ["customerid", "customercode", "customername", "customergroup_display"];
            if(params.custpage_splitresult == "T"){
                arrKeyGroup.push("itemgroup2", "itemgroup2_display");
            }
            else{
                arrKeyGroup.push("itemgroup1_display");
            }

            let arrResTransSales_3Month = alasql(`SELECT ${arrKeyGroup.join(",")},
                SUM(amount) AS amount
            FROM ?
            GROUP BY ${arrKeyGroup.join(", ")}`, [arrResTransSales]);

            let arrResTransSales_thisMonth = alasql(`SELECT ${arrKeyGroup.join(",")},
                SUM(amount) AS amount
            FROM ?
            WHERE month = '${date_MM}' AND year = '${date_YYYY}'
            GROUP BY ${arrKeyGroup.join(", ")}`, [arrResTransSales]);

            for(let i = 0; i < arrResTransSales_3Month.length; i++){
                let objResTransSales_3Month = arrResTransSales_3Month[i];
                
                let objRes = {
                    checked: true,
                    stt: i + 1,
                    customer_code: objResTransSales_3Month.customercode,
                    customer_name: objResTransSales_3Month.customername,
                    customergroup_display: objResTransSales_3Month.customergroup_display,
                    amount_avg_3month: 0,
                    amount: 0,
                    percent_fluctuation: 0,
                    percent_discount_month: 0,
                    percent_discount_next_month: 0,
                    note: "",
                    itemgroup_display: ""
                };

                objRes.amount_avg_3month = constFormat.roundNumber(objResTransSales_3Month.amount / 3, 0);

                let objResTransSales_thisMonth = arrResTransSales_thisMonth.find(e => e.customerid == objResTransSales_3Month.customerid);
                if(!!objResTransSales_thisMonth){
                    objRes.amount = objResTransSales_thisMonth.amount;
                }

                objRes.percent_fluctuation = constFormat.roundNumber((objRes.amount / objRes.amount_avg_3month) - 1, 2);

                let objSalesTerm = null;

                if(params.custpage_splitresult == "T"){
                    objSalesTerm = arrSalesTerm.find(e => e._4_customer_id == objResTransSales_3Month.customerid
                        && e._7_item_group == objResTransSales_3Month.itemgroup2
                    );
                }
                else{
                    objSalesTerm = arrSalesTerm.find(e => e._4_customer_id == objResTransSales_3Month.customerid);
                }

                if(!!objSalesTerm){
                    objRes.percent_discount_month = objSalesTerm["_8_support"];
                    
                    if(objRes.percent_discount_month.toString().includes("%")){
                        objRes.percent_discount_month = objRes.percent_discount_month.replace("%", "") / 100;
                    }
                    else{
                        objRes.percent_discount_month = objRes.percent_discount_month * 1;
                    }
                }

                objRes.percent_discount_next_month = objRes.percent_discount_month;

                if(params.custpage_splitresult == "T"){
                    objRes.itemgroup_display = objResTransSales_3Month.itemgroup2_display || "";
                }
                else{
                    objRes.itemgroup_display = objResTransSales_3Month.itemgroup1_display || "";
                }

                arrResult.push(objRes);
            }

            return arrResult;
        }

        _export.getColumns = function () {
            let maskFormatVND = constFormat.getMaskFormatNumber('VND');

            let arrColumns = [
                {dataField: 'checked', caption: 'Chọn', dataType: "boolean", allowEditing: true},
                {dataField: 'stt', caption: 'STT', dataType: "number", format: maskFormatVND, allowEditing: false},
                {dataField: 'customer_code', caption: 'Mã khách hàng', dataType: "string", allowEditing: false},
                {dataField: 'customer_name', caption: 'Khách hàng', dataType: "string", allowEditing: false},
                {dataField: 'amount_avg_3month', caption: `DS trung bình 3 tháng`, dataType: 'number', format: maskFormatVND, allowEditing: false},
                {dataField: 'amount', caption: `DS đến ngày hiện tại`, dataType: 'number', format: maskFormatVND, allowEditing: false},
                {dataField: 'percent_fluctuation', caption: "% Biến động", dataType: 'number', format: {type: "percent", precision: 0}, allowEditing: false},
                {dataField: 'percent_discount_month', caption: "Chiết khấu tháng hiện tại", dataType: 'number', format: {type: "percent", precision: 1}, allowEditing: false},
                {dataField: 'percent_discount_next_month', caption: "Chiết khấu tháng tiếp theo", dataType: 'number', format: {type: "percent", precision: 1}, allowEditing: false},
                {dataField: 'note', caption: 'Ghi chú', dataType: "string", allowEditing: true},
                {dataField: 'itemgroup_display', caption: 'Nhóm hàng hóa', dataType: "string", allowEditing: false},
            ];

            return arrColumns;
        }

        _export.getParameterLastSearch = function () {
            return {...this.parameters};
        }

        return _export;
    });
