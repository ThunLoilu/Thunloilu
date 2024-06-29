// ==UserScript==
// @name         每日签到
// @author       冰红茶
// @version      1.0.0
// @description
// @timestamp    1719158729
// 2024-06-24 00:05:29
// @license      MIT
// @homepageURL  https://github.com/ThunLoilu/Thunloilu/tree/main/js%20project
// ==/UserScript==

//函数

//查询日期
function today() {
    var now = new Date()
    let year = Number(now.getFullYear())
    let month = Number(now.getMonth())
    let day = Number(now.getDate())
    return year * 10000 + month * 100 + day;
}

//骰子模拟器
function D(n, x, k = 1, p = 0, c = 0) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
        let randomNumber = Math.floor(Math.random() * x) + 1;
        sum += randomNumber;
    }
    sum += p;
    sumPlus = sum * k + c;
    return sumPlus;
}

// 首先检查是否已经存在
let ext = seal.ext.find('daily每日签到1.0');
if (!ext) {
    // 不存在，那么建立扩展，名为daily每日签到1.0，作者“”，版本1.0.0
    ext = seal.ext.new('daily每日签到1.0', '冰红茶', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
}

const cmdhi = seal.ext.newCmdItemInfo();
cmdhi.name = '签到'; // 指令名字，可用中文
cmdhi.help = '';
cmdhi.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "") {
                //'$m财富''$m上次签到日期'
                //检查该玩家是否已签到
                if (seal.vars.intGet(ctx, `$m上次签到日期`)[0] === today()) {
                    seal.replyToSender(ctx, msg, `${ctx.player.name}今天已经签过到啦`);
                }
                else {
                    let bonus = Number(D(3, 6, 100))
                    let wealth = seal.vars.intGet(ctx, `$m财富`)[0] + bonus
                    let date = today()
                    seal.vars.intSet(ctx, `$m财富`, wealth)
                    seal.vars.intSet(ctx, `$m上次签到日期`, date)
                    seal.replyToSender(ctx, msg, `小安来骰个骰子：3d6=${bonus / 100},那就送${ctx.player.name}${bonus}刀乐吧\n你现在共有${wealth}刀乐`)
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['签到'] = cmdhi;

const cmdquery = seal.ext.newCmdItemInfo();
cmdquery.name = '查询余额'; // 指令名字，可用中文
cmdquery.help = '';
cmdquery.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "") {
                let wealth = seal.vars.intGet(ctx, `$m财富`)[0]
                seal.replyToSender(ctx, msg, `${ctx.player.name}的账户余额为${wealth}刀乐`);
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['查询余额'] = cmdquery;

const cmdlw = seal.ext.newCmdItemInfo();
cmdlw.name = '领低保'; // 指令名字，可用中文
cmdlw.help = '';
cmdlw.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "") {
                //'$m财富''$m上次签到日期'
                //检查该玩家是否已签到
                if (seal.vars.intGet(ctx, `$m上次签到日期`)[0] === today() && seal.vars.intGet(ctx, `$m财富`)[0] < 200) {
                    let bonus = Number(D(3, 6, 10))
                    let wealth = seal.vars.intGet(ctx, `$m财富`)[0] + bonus
                    seal.vars.intSet(ctx, `$m财富`, wealth)
                    seal.replyToSender(ctx, msg, `小安来骰个骰子：3d6=${bonus / 10},那就给${ctx.player.name}${bonus}刀乐吧\n你现在共有${wealth}刀乐`)
                }
                else if (seal.vars.intGet(ctx, `$m上次签到日期`)[0] !== today()) {
                    seal.replyToSender(ctx, msg, `${ctx.player.name}今天还没签过到哦`);
                }
                else {
                    seal.replyToSender(ctx, msg, `${ctx.player.name}还有这么多钱，低保可不是为你准备的哦`);
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['领低保'] = cmdlw;

const cmd = seal.ext.newCmdItemInfo();
cmd.name = '财富clear'; // 指令名字，可用中文
cmd.help = '';
cmd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "") {
                seal.vars.intSet(ctx, `$m财富`, 0)
                seal.vars.intSet(ctx, `$m上次签到日期`, 0)
                seal.replyToSender(ctx, msg, `信息已清空`)
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['财富clear'] = cmd; 
