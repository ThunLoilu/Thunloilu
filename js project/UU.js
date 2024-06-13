// ==UserScript==
// @name         催更打鸽机
// @author       冰红茶
// @version      1.0.0
// @description
// @timestamp    1718247758
// 2024-06-13 11:02:38
// @license      MIT
// @homepageURL  https://github.com/sealdice/javascript
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
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "") {
                seal.replyToSender(ctx, msg, `@${msg.sender.nickname} 在更了在更了`)
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['催更'] = cmdcuigeng;
