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
                    seal.replyToSender(ctx, msg, `该插件更新已基本结束，有bug可反馈至作者邮箱：2865813065@qq.com`)
                }
                else if (val === "签到")
                {
                    seal.replyToSender(ctx, msg, `该插件更新已基本结束，有bug可反馈至作者邮箱：2865813065@qq.com`);
                }
                else if (val === "21点" || val === "24点")
                {
                    seal.replyToSender(ctx, msg, `该插件更新已基本结束，有bug可反馈至作者邮箱：2865813065@qq.com`);
                }
                else if (val === "sicbo" || val === "骰宝")
                {
                    seal.replyToSender(ctx, msg, `该插件更新已基本结束，有bug可反馈至作者邮箱：2865813065@qq.com`);
                }
                else if (val === "CCASusertool" || val === "ccasusertool" || val === "CCAS用户工具")
                {
                    seal.replyToSender(ctx, msg, `该插件组已完成随机NPC，有其他需求或bug可联系作者邮箱：2865813065@qq.com`);
                }
                else if (val === "修仙之路")
                {
                    seal.replyToSender(ctx, msg, `已经新建文件了，别急`);
                }
                else if (val === "underground")
                {
                    seal.replyToSender(ctx, msg, `已经新建文件了，别急`);
                }
                else if (val === "texasholdem")
                {
                    seal.replyToSender(ctx, msg, `还没新建文件，等卫星吧`);
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['催更'] = cmdcuigeng;
