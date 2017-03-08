"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var request = require("request");
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
            var result = JSON.parse(payload);
        }
        catch (err) {
            return reject(new Error("parse json error!"));
        }
        if (result.error) {
            return reject(new Error(result.error_description));
        }
        else {
            return resolve(result);
        }
    });
}
var ShujuguanClient = (function () {
    function ShujuguanClient(token) {
        this._token = token;
    }
    ShujuguanClient.prototype.datatables = function () {
        var token = this._token;
        return new Promise(function (resolve, reject) {
            doRequest({
                url: "https://" + enterprise + ".shujuguan.cn/openapi/dtbatch/createdatatable",
                method: "POST",
                headers: {
                    "Authorization": "OAuth " + token,
                    "Content-Type": "application/json; charset=utf-8"
                },
                json: true,
                body: {
                    "batchDataColumns": [
                        {
                            "dataType": "STRING",
                            "length": -1,
                            "name": "a",
                            "type": "TEXT"
                        },
                        {
                            "dataType": "INTEGER",
                            "length": -1,
                            "name": "b",
                            "type": "INTEGER"
                        },
                        {
                            "dataType": "DATE",
                            "length": -1,
                            "name": "c",
                            "type": "DATE"
                        },
                        {
                            "dataType": "DOUBLE",
                            "length": -1,
                            "name": "d",
                            "type": "DECIMAL"
                        }
                    ],
                    "dataName": "数据集api创建"
                }
            }, resolve, reject);
        });
    };
    return ShujuguanClient;
}());
function create() {
    return new ShujuguanClient(token);
}
exports.create = create;
//# sourceMappingURL=shujuguanclient.js.map