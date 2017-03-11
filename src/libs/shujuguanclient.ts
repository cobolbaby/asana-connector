import * as Promise from 'bluebird';
import * as request from 'request';
import * as _ from "lodash";

var config = require("../../config/server.json");
var token = config.shujuguan.token;
var enterprise = config.shujuguan.enterprise;

function doRequest(params, resolve, reject) {
    request(params, function (err, res, payload) {
        if (err) {
            return reject(err);
        }
        if (res.statusCode !== 200) {
            return reject(payload);
        }
        try {
            var result = (typeof payload === "string") ? JSON.parse(payload) : payload;
        } catch (err) {
            console.log("parse json error!" , payload);
            return reject(new Error("parse json error!"))
        }
        if (result.error) {
            return reject(new Error(result.error_description));
        } else {
            return resolve(result);
        }
    });
}

var _propMap = {
    "columnType": "type",
}

function _getColumnPropForCreate(key: string): string {
    return _propMap[key] ? _propMap[key] : key;
}

function convertColumnToCreat (columns: Column[]): any[] {
    var results = [] , obj: any;
    _.each(columns , function (column: Column) {
        obj = {};
        for (var key in column) {
            obj[_getColumnPropForCreate(key)] = column[key];
        }
        results.push(obj);
    })
    return results;
}

export type Column = {
    columnType: string;
    dataType: string;
    name: string;
    length?: number;
}
export type DataTable = {
    columns: Column[];
    name: string;
    id?: string;
}

class DataTableAPI {
    private _datatable: DataTable;
    constructor (datatable?: DataTable) {
        datatable && (this._datatable = datatable);
    }
    me():DataTable {
        return this._datatable;
    }
    instance(datatable: DataTable): DataTableAPI {
        return new DataTableAPI(datatable);
    }
    findAll(): Promise<DataTable[]> {
        return new Promise(function (resolve, reject) {
            doRequest({
                url: `https://${enterprise}.shujuguan.cn/openapi/data`,
                method: "GET",
                headers: {
                    "Authorization": `OAuth ${token}`,
                    "Content-Type": "application/json; charset=utf-8"
                }
            }, resolve, reject);
        });
    }
    findById(dtid: string): Promise<DataTable> {
        return new Promise(function (resolve, reject) {
            doRequest({
                url: `https://${enterprise}.shujuguan.cn/openapi/data/${dtid}`,
                method: "GET",
                headers: {
                    "Authorization": `OAuth ${token}`,
                    "Content-Type": "application/json; charset=utf-8"
                }
            }, resolve, reject);
        });
    }
    create(data: DataTable): Promise<DataTableAPI> {
        var self = this;
        return new Promise(function (resolve, reject) {
            if (self._datatable) {
                return resolve(self._datatable);
            }
            doRequest({
                url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/createdatatable`,
                method: "POST",
                headers: {
                    "Authorization": `OAuth ${token}`,
                    "Content-Type": "application/json; charset=utf-8"
                },
                json: true,
                body: {
                    "batchDataColumns": convertColumnToCreat(data.columns),
                    "dataName": data.name
                }
            }, function (result: DataTable) {
                self._datatable = result;
                resolve(self);
            }, reject);
        });
    }
    append(data: any[]): Promise<DataTableAPI> {
        var self = this;
        return new Promise(function (resolve , reject) {
            if (!self._datatable) {
                reject();
            } else {
                doRequest({
                    url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/${self._datatable.id}/appenddatas`,
                    method: "POST",
                    headers: {
                        "Authorization": `OAuth ${token}`,
                        "Content-Type": "application/json; charset=utf-8"
                    },
                    json: true,
                    body: data
                }, resolve , reject);
            }
        })
    }
    commit(): Promise<DataTableAPI> {
        var self = this;
        return new Promise(function (resolve , reject) {
            if (!self._datatable) {
                reject();
            } else {
                doRequest({
                    url: `https://${enterprise}.shujuguan.cn/openapi/dtbatch/${self._datatable.id}/commit`,
                    method: "GET",
                    headers: {
                        "Authorization": `OAuth ${token}`,
                        "Content-Type": "application/json; charset=utf-8"
                    }
                }, resolve , reject);
            }
        })
    }
}

export class ShujuguanClient {
    datatables: DataTableAPI;
    constructor(){
        this.datatables = new DataTableAPI();
    }
}

export function create(): ShujuguanClient {
    return new ShujuguanClient();
}