"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var Logger = require("../libs/logger");
var progress = require("./progress");
var log = Logger.getLogger("asana2shujuguan");
function any2any(v) {
    return v;
}
function number2string(v) {
    return "" + v;
}
function boolean2number(bool) {
    return !!bool ? 1 : 0;
}
function obj2id(obj) {
    return obj ? "" + obj.id : null;
}
function obj2name(obj) {
    return obj ? obj.name : null;
}
function array2id(obj) {
    if (!obj || !obj.length) {
        return "";
    }
    var ids = [];
    for (var i = 0; i < obj.length; i++) {
        ids.push(obj[i].id);
    }
    return ids.join(",");
}
function array2name(obj) {
    if (!obj || !obj.length) {
        return "";
    }
    var names = [];
    for (var i = 0; i < obj.length; i++) {
        names.push(obj[i].name);
    }
    return names.join(",");
}
function array2count(obj) {
    return (obj && obj.length) ? obj.length : 0;
}
function ISO2datestring(str) {
    if (str) {
        return str.replace("T", " ").replace("Z", "").split(".")[0];
    }
    return null;
}
function fillnow() {
    var isoStr = (new Date()).toISOString();
    return isoStr.split("T")[0];
}
function fillnull() {
    return null;
}
function subtasks2count(task) {
    return (task.subtasks && task.subtasks.length) ? task.subtasks.length : 1;
}
function subtasks2completed(task) {
    var subtasks = task.subtasks || [];
    if (!subtasks.length) {
        return task.completed ? 1 : 0;
    }
    else {
        var ret = 0;
        for (var i = 0; i < subtasks.length; i++) {
            subtasks[i] && subtasks[i].completed && (ret++);
        }
        return ret;
    }
}
var taskTableHeader = [
    { property: "id", name: "id", dataType: "STRING", columnType: "ID", valueConverter: number2string },
    { property: null, name: "_upload_at_", dataType: "STRING", columnType: "TEXT", valueConverter: fillnow },
    { property: "name", name: "name", dataType: "STRING", columnType: "TEXT", valueConverter: any2any },
    { property: "notes", name: "notes", dataType: "STRING", columnType: "TEXT", valueConverter: any2any },
    { property: "workspace", name: "workspace", dataType: "STRING", columnType: "TEXT", valueConverter: obj2name },
    { property: "workspace", name: "workspace_id", dataType: "STRING", columnType: "TEXT", valueConverter: obj2id },
    { property: "num_hearts", name: "num_hearts", dataType: "INTEGER", columnType: "INTEGER", valueConverter: any2any },
    { property: "parent", name: "parent", dataType: "STRING", columnType: "TEXT", valueConverter: obj2name },
    { property: "parent", name: "parent_id", dataType: "STRING", columnType: "TEXT", valueConverter: obj2id },
    { property: "projects", name: "projects", dataType: "STRING", columnType: "TEXT", valueConverter: array2name },
    { property: "projects", name: "projects_id", dataType: "STRING", columnType: "TEXT", valueConverter: array2id },
    { property: "projects", name: "projects_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: array2count },
    { property: "assignee", name: "assignee", dataType: "STRING", columnType: "TEXT", valueConverter: obj2name },
    { property: "assignee", name: "assignee_id", dataType: "STRING", columnType: "TEXT", valueConverter: obj2id },
    { property: "assignee_status", name: "assignee_status", dataType: "STRING", columnType: "TEXT", valueConverter: any2any },
    { property: "completed", name: "completed", dataType: "INTEGER", columnType: "INTEGER", valueConverter: boolean2number },
    { property: "completed_at", name: "completed_at", dataType: "STRING", columnType: "TEXT", valueConverter: ISO2datestring },
    { property: "created_at", name: "created_at", dataType: "STRING", columnType: "TEXT", valueConverter: ISO2datestring },
    { property: "modified_at", name: "modified_at", dataType: "STRING", columnType: "TEXT", valueConverter: ISO2datestring },
    { property: "due_at", name: "due_at", dataType: "STRING", columnType: "TEXT", valueConverter: ISO2datestring },
    { property: "due_on", name: "due_on", dataType: "STRING", columnType: "TEXT", valueConverter: ISO2datestring },
    { property: "followers", name: "followers", dataType: "STRING", columnType: "TEXT", valueConverter: array2name },
    { property: "followers", name: "followers_id", dataType: "STRING", columnType: "TEXT", valueConverter: array2id },
    { property: "followers", name: "followers_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: array2count },
    { property: "hearted", name: "hearted", dataType: "INTEGER", columnType: "INTEGER", valueConverter: boolean2number },
    { property: "hearts", name: "hearts", dataType: "STRING", columnType: "TEXT", valueConverter: array2name },
    { property: "hearts", name: "hearts_id", dataType: "STRING", columnType: "TEXT", valueConverter: array2id },
    { property: "hearts", name: "hearts_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: array2count },
    { property: "tags", name: "tags", dataType: "STRING", columnType: "TEXT", valueConverter: array2name },
    { property: "tags", name: "tags_id", dataType: "STRING", columnType: "TEXT", valueConverter: array2id },
    { property: "tags", name: "tags_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: array2count },
    { property: null, name: "subtasks_count", dataType: "INTEGER", columnType: "INTEGER", valueConverter: subtasks2count },
    { property: null, name: "subtasks_completed", dataType: "INTEGER", columnType: "INTEGER", valueConverter: subtasks2completed },
];
function convertFieldType2DataType(type) {
    if (type === "number") {
        return "DOUBLE";
    }
    else if (type === "date") {
        return "DATE";
    }
    else {
        return "STRING";
    }
}
function convertFieldType2ColumnType(type) {
    if (type === "number") {
        return "DECIMAL";
    }
    else if (type === "date") {
        return "DATETIME";
    }
    else {
        return "TEXT";
    }
}
function getTaskDataValue(header, task) {
    var property = header.property;
    if (!property || !(property in task)) {
        return header.valueConverter ? header.valueConverter(task) : null;
    }
    else {
        return header.valueConverter ? header.valueConverter(task ? task[property] : null) : null;
    }
}
function getCustomFieldValue(field) {
    if (field.type === "number") {
        return field.number_value;
    }
    else if (field.type === "enum") {
        return field.enum_value ? field.enum_value.name : null;
    }
    else if (field.type === "text") {
        return field.text_value;
    }
    else {
        return null;
    }
}
function appendCustomFieldValue(columns, rowdata, project, task) {
    columns = columns || [];
    rowdata = rowdata || [];
    var map = {};
    if (task.custom_fields && task.custom_fields.length) {
        for (var i = 0; i < task.custom_fields.length; i++) {
            var custom_field = task.custom_fields[i];
            map["field_" + custom_field.name] = custom_field;
        }
    }
    for (var i = rowdata.length; i < columns.length; i++) {
        var column = columns[i];
        if (column) {
            if (map[column.name]) {
                rowdata.push(getCustomFieldValue(map[column.name]));
            }
            else {
                rowdata.push(null);
            }
        }
    }
}
function getTaskTableName(project, type) {
    if (type === void 0) { type = "uptodate"; }
    return project.name + "-" + project.workspace.name + "-" + type;
}
function getTaskTablePrivateAttrs(project, type) {
    if (type === void 0) { type = "uptodate"; }
    return {
        "tableType": type,
        "projectId": "" + project.id
    };
}
function createTaskTableColumns(project) {
    var columns = [];
    columns.push({
        name: "project_id",
        dataType: "STRING",
        columnType: "TEXT",
        length: -1
    });
    columns.push({
        name: "project_name",
        dataType: 'STRING',
        columnType: 'TEXT',
        length: -1
    });
    for (var i = 0; i < taskTableHeader.length; i++) {
        var item = taskTableHeader[i];
        columns.push({
            name: item.name,
            dataType: item.dataType,
            columnType: item.columnType,
            length: -1
        });
    }
    if (project.custom_field_settings && project.custom_field_settings.length) {
        for (var j = 0; j < project.custom_field_settings.length; j++) {
            var element = project.custom_field_settings[j];
            columns.push({
                name: "field_" + element.custom_field.name,
                dataType: convertFieldType2DataType(element.custom_field.type),
                columnType: convertFieldType2ColumnType(element.custom_field.type),
                length: -1
            });
        }
    }
    return columns;
}
function createTaskTableRowData(columns, task, project) {
    var rowdata = [];
    rowdata.push("" + project.id);
    rowdata.push(project.name);
    for (var i = 0; i < taskTableHeader.length; i++) {
        rowdata.push(getTaskDataValue(taskTableHeader[i], task));
    }
    appendCustomFieldValue(columns, rowdata, project, task);
    return rowdata;
}
function createTaskTableByProject(project, type) {
    if (type === void 0) { type = 'uptodate'; }
    var name = getTaskTableName(project, type);
    var dt = {
        columns: createTaskTableColumns(project),
        name: "Asana Tasks in " + name,
        dataConfig: {
            attrs: getTaskTablePrivateAttrs(project, type)
        }
    };
    return dt;
}
function isTableByType(dt, project, type) {
    return dt && dt.dataConfig && dt.dataConfig.attrs && (dt.dataConfig.attrs.projectId === "" + project.id && dt.dataConfig.attrs.tableType === type);
}
function uploadTasksTableWithProjectAsync(asana, shujuguan, projectId, dtid) {
    dtid = dtid || "__invalid table id__";
    log.log("uploadTasksTableWithProjectAsync[" + projectId + "] start ...");
    var progressMessage = "upload tasks to shujuguan (1/3) : fetch tasks by project[" + projectId + "] from asana";
    var token = progress.create(3, {
        method: "asana2shujuguan.uploadTasksTableWithProjectAsync",
        type: "tasks",
        name: progressMessage
    });
    log.log(progressMessage);
    asana.tasksInProject(projectId, { opt_fields: "completed" }).then(function (project) {
        var columns = createTaskTableColumns(project);
        var rowdatas = [];
        return Promise.each(project.tasks, function (task, index, length) {
            rowdatas.push(createTaskTableRowData(columns, task, project));
        }).then(function () {
            progressMessage = "upload tasks to shujuguan (2/3) : fetch datatables from shujuguan";
            log.log(progressMessage);
            token.loaded++;
            token.info.name = progressMessage;
            return shujuguan.datatables.findAll().then(function (datatables) {
                datatables = datatables || [];
                var uptodateTable;
                var daytodayTable;
                for (var i = 0; i < datatables.length; i++) {
                    isTableByType(datatables[i], project, "uptodate") && (uptodateTable = datatables[i]);
                    isTableByType(datatables[i], project, "daytoday") && (daytodayTable = datatables[i]);
                }
                progressMessage = "upload tasks to shujuguan (3/3) : upload to shujuguan";
                log.log(progressMessage);
                token.loaded++;
                token.info.name = progressMessage;
                return Promise.all([
                    Promise.resolve(uptodateTable).then(function (dt) {
                        if (!dt) {
                            return shujuguan.datatables.create(createTaskTableByProject(project, 'uptodate')).then(function (datatable) {
                                log.log("created uptodate table to shujuguan");
                                return Promise.resolve(datatable);
                            });
                        }
                        else {
                            return Promise.resolve(dt);
                        }
                    }).then(function (datatable) {
                        return shujuguan.datatables.update(datatable, rowdatas, false);
                    }),
                    Promise.resolve(daytodayTable).then(function (dt) {
                        if (!dt) {
                            return shujuguan.datatables.create(createTaskTableByProject(project, 'daytoday')).then(function (datatable) {
                                log.log("created daytoday table to shujuguan");
                                return Promise.resolve(datatable);
                            });
                        }
                        else {
                            return Promise.resolve(dt);
                        }
                    }).then(function (datatable) {
                        return shujuguan.datatables.update(datatable, rowdatas, true);
                    })
                ]);
            });
        });
    }).then(function () {
        log.log("uploadTasksTableWithProjectAsync[" + projectId + "] completed!");
        progress.end(token.id);
        return Promise.resolve();
    }).catch(function (err) {
        log.log("uploadTasksTableWithProjectAsync[" + projectId + "] error! ", err);
        progress.end(token.id);
        return Promise.reject(err);
    });
    return token.id;
}
exports.uploadTasksTableWithProjectAsync = uploadTasksTableWithProjectAsync;
//# sourceMappingURL=asana2shujuguan.js.map