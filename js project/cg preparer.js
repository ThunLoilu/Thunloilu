// ==UserScript==
// @name         CG准备
// @author       冰红茶
// @version      1.0.0
// @description  用于提前准备CG，包括保存、加载、删除CG的功能。
// @timestamp    1723825213
// 2024-08-17 00:20:13
// @license      MIT
// @homepageURL  https://github.com/ThunLoilu/Thunloilu/tree/main/js%20project
// ==/UserScript==

// 首先检查是否已经存在
let ext = seal.ext.find('cg preparer');
if (!ext) {
    // 不存在，那么建立扩展，名为cg preparer，作者“冰红茶”，版本1.0.0
    ext = seal.ext.new('cg preparer', '冰红茶', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
}

const cmdcg = seal.ext.newCmdItemInfo();
cmdcg.name = 'cg'; // 指令名字，可用中文
cmdcg.help = `该插件用于提前准备CG，包括保存、加载、删除CG的功能：
.cgsave <cgname> <cgcontent> 保存CG，cgname为CG名称，cgcontent为CG内容
.cgload <cgname> 加载CG，cgname为CG名称
.cgdelete <cgname> 删除CG，cgname为CG名称`;
cmdcg.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {

            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['cg'] = cmdcg;

const cmdcgload = seal.ext.newCmdItemInfo();
cmdcgload.name = 'cgsave'; // 指令名字，可用中文
cmdcgload.help = '';
cmdcgload.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            console.log(msg.message);
            let namelen = val.length;
            let input = (msg.message).slice(9 + namelen);
            seal.vars.strSet(ctx, "$mcg" + val,input)
            seal.replyToSender(ctx, msg, "已记录CG：" + val);
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['cgsave'] = cmdcgload;

const cmdcgsave = seal.ext.newCmdItemInfo();
cmdcgsave.name = 'cgload'; // 指令名字，可用中文
cmdcgsave.help = '';
cmdcgsave.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            let findcg = seal.vars.strGet(ctx, "$mcg" + val)[0];
            if (findcg) {
                seal.replyToSender(ctx, msg, findcg);
            } else {
                seal.replyToSender(ctx, msg, "未找到CG：" + val);
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['cgload'] = cmdcgsave;   

const cmdcgdelete = seal.ext.newCmdItemInfo();
cmdcgdelete.name = 'cgdelete'; // 指令名字，可用中文
cmdcgdelete.help = '';
cmdcgdelete.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            seal.vars.strSet(ctx,"$mcg" + val, "");
            seal.replyToSender(ctx, msg, "已删除CG：" + val);
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['cgdelete'] = cmdcgdelete;   
