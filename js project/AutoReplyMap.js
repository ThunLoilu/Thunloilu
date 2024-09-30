// ==UserScript==
// @name         AutoReplyMap
// @author       冰红茶
// @version      1.0.0
// @description
// @timestamp    1727626688
// 2024-09-30 00:18:08
// @license      MIT
// @homepageURL  https://github.com/ThunLoilu/Thunloilu/tree/main/js%20project
// ==/UserScript==

function strtoobj(str) {
    let obj = {};
    let arr = str.split('\n');
    for (let i = 0; i < arr.length; i++) {
        let item = arr[i].split('->');
        if (item.length === 2) {
            obj[item[0].trim()] = item[1].trim();
        }
    }
    return obj;
}

function objtostr(obj) {
    let str = '';
    for (const key in obj) {
        str += `${key} -> ${obj[key]}\n`;
    }
    return str;
}

function deletekey(str, key) {
    let obj = strtoobj(str);
    delete obj[key];
    return objtostr(obj);
}

function addkey(str, key, value) {
    str += `${key} -> ${value}\n`;
    return str;
}

function clear() {
    return '';
}

// 首先检查是否已经存在
let ext = seal.ext.find('autoreplymap');
if (!ext) {
    // 不存在，那么建立扩展，名为autoreplymap，作者“冰红茶”，版本1.0.0
    ext = seal.ext.new('autoreplymap', '冰红茶', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
}

const cmdreplyadd = seal.ext.newCmdItemInfo();
cmdreplyadd.name = 'sdrep'; // 指令名字，可用中文
cmdreplyadd.help = `该命令用于管理群内自动回复。
.sdrep add [关键字] [回复内容]  添加自动回复
.sdrep del [关键字]  删除自动回复
.sdrep list  查看自动回复列表
.sdrep clear  清空自动回复列表
.sdrep help  查看帮助`;
cmdreplyadd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val1 = cmdArgs.getArgN(2);
    let val2 = cmdArgs.getArgN(3);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            let autorep = seal.vars.strGet(ctx, '$gautorep')[0];
            if (val === 'add' && val1 && val2) {
                autorep = addkey(autorep, val1, val2);
                seal.vars.strSet(ctx, '$gautorep', autorep);
                seal.replyToSender(ctx, msg, `添加成功：${val1} -> ${val2}`);
            }
            else if (val === 'del' && val1 && !val2) {
                autorep = deletekey(autorep, val1);
                seal.vars.strSet(ctx, '$gautorep', autorep);
                seal.replyToSender(ctx, msg, `删除成功：${val1}`);
            }
            else if (val === 'list') {
                autorep = autorep.trim();
                if (autorep) {
                    seal.replyToSender(ctx, msg, autorep);
                }
                else {
                    seal.replyToSender(ctx, msg, '没有自动回复');
                }
            }
            else if (val === 'clear') {
                autorep = clear();
                seal.vars.strSet(ctx, '$gautorep', autorep);
                seal.replyToSender(ctx, msg, '自动回复已清空');
            }
            else {
                seal.replyToSender(ctx, msg, '参数错误，请使用.sdrep help查看帮助');
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['sdrep'] = cmdreplyadd;

ext.onNotCommandReceived = (ctx, msg) => {
    let autorep = seal.vars.strGet(ctx, '$gautorep')[0];
    if (autorep) {
        let arr = strtoobj(autorep);
        let key = msg.message.trim();
        if (arr[key]) {
            seal.replyToSender(ctx, msg, arr[key]);
        }
    }
}
