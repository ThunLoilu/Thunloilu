// ==UserScript==
// @name         催更打鸽机
// @author       冰红茶
// @version      1.0.0
// @description  仅用于用户催更
// @timestamp    1718247758
// 2024-06-13 11:02:38
// @license      MIT
// @homepageURL  https://github.com/ThunLoilu/Thunloilu/tree/main/js%20project
// ==/UserScript==

const ccasprocess = `追逐初步算法已完成，数据表格未新建文件夹，自动寡不敌众不可用`

// 首先检查是否已经存在
let ext = seal.ext.find('Urge for updates');
if (!ext) {
    // 不存在，那么建立扩展，名为Urge for updates，作者“冰红茶”，版本1.0.0
    ext = seal.ext.new('Urge for updates', '冰红茶', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
}

const cmdcuigeng = seal.ext.newCmdItemInfo();
cmdcuigeng.name = '催更'; // 指令名字，可用中文
cmdcuigeng.help = '';
cmdcuigeng.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val2 === "")
            {
                if (val === "") {
                    seal.replyToSender(ctx, msg, `@${msg.sender.nickname} 在更了在更了\n`)
                }
                else if (val.toLowerCase() === "ccas")
                {
                    seal.replyToSender(ctx,msg,`CCAS目前进度：${ccasprocess}`)
                }
                else if (val === "签到")
                {
                    seal.replyToSender(ctx, msg, `可以领低保了，应该结束了`);
                }
                else if (val === "21点")
                {
                    seal.replyToSender(ctx, msg, `规范完指令就完结啦，筹划新游戏中ing`);
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['催更'] = cmdcuigeng;
