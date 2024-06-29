// ==UserScript==
// @name         来玩玩21点吗？
// @author       冰红茶
// @version      1.0.0
// @description  21点，大表哥同款（差点，保险注还没写）
// @timestamp    1719152205
// 2024-06-23 22:16:45
// @license      MIT
// @homepageURL  https://github.com/ThunLoilu/Thunloilu/tree/main/js%20project
// ==/UserScript==

const points = [['黑桃A', '黑桃2', '黑桃3', '黑桃4', '黑桃5', '黑桃6', '黑桃7', '黑桃8', '黑桃9', '黑桃10', '黑桃J', '黑桃Q', '黑桃K'],
    ['红桃A', '红桃2', '红桃3', '红桃4', '红桃5', '红桃6', '红桃7', '红桃8', '红桃9', '红桃10', '红桃J', '红桃Q', '红桃K'],
    ['黑桃A', '黑桃2', '黑桃3', '黑桃4', '黑桃5', '黑桃6', '黑桃7', '黑桃8', '黑桃9', '黑桃10', '黑桃J', '黑桃Q', '黑桃K'],
    ['方片A', '方片2', '方片3', '方片4', '方片5', '方片6', '方片7', '方片8', '方片9', '方片10', '方片J', '方片Q', '方片K'],]

//随机数
function rand(x) {
    let randomNumber = Math.floor(Math.random() * x) + 1;
    return Number(randomNumber);
}

function AnalyseStr(cardstr)
{
    //A23456789TTTT
    //1111111111111
    const part1 = cardstr.split("\n")
    const part = []
    for (let i = 0; i < 4; i++)
    {
        const part2 = part1[i].split("")
        part.push(part2)
    }
    return part
}

function AntiStr(cards)
{
    let str = "";
    for (let i = 0; i < 4; i++)
    {
        for (let j = 0; j < 13; j++)
        {
            str += String(cards[i][j])
        }
        str += "\n"
    }
    return str
}

function randomcard(cards)
{
    let c1 = rand(4), c2 = rand(13)
    while (Number(cards[c1 - 1][c2 - 1]) === 0)
    {
        c1 = rand(4)
        c2 = rand(13)
    }
    let c3 = Number(c2);
    if (c3 > 10)
        c3 = Number(10)
    if (c3 === 1)
        c3 = 11
    const cget = [c1,c2,c3]
    return cget;
}

// 首先检查是否已经存在
let ext = seal.ext.find('21points');
if (!ext) {
    // 不存在，那么建立扩展，名为21points，作者“”，版本1.0.0
    ext = seal.ext.new('21points', '', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
}

/*
需要记录的数据：
群状态 (游戏阶段，参与名单，押注名单，停牌名单，庄家明牌，庄家暗牌)
玩家状态（参与状态，现有牌，A的个数，是否停牌，筹码）
*/

const cmd21 = seal.ext.newCmdItemInfo();
cmd21.name = '21points'; // 指令名字，可用中文
cmd21.help = '';
cmd21.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === `join` || val === '加入')
            {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
                let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
                let wealth = Number(seal.vars.intGet(ctx, `$m财富`)[0])
                let parts = patis.trim().split("\n")
                let addok = 1;
                for (let i = 0; i < patis.length; i++) {
                    if (id === parts[i])
                    {
                        addok = 0;
                        break;
                    }
                }
                if (!addok)
                {
                    seal.replyToSender(ctx, msg, `${name}玩家已加入游戏，无法重复加入`);
                }
                else if (wealth === 0)
                {
                    seal.replyToSender(ctx, msg, `${name}玩家没有刀乐用来押注，无法上桌`);
                }
                else if(stage !== "")
                {
                    seal.replyToSender(ctx, msg, `游戏已经开始了，请在游戏结束后再加入`);
                }
                else
                {
                    patis += id + "\n"
                    seal.vars.strSet(ctx, `$g参与名单ID`, patis)
                    seal.vars.intSet(ctx, `$m筹码`, 0)
                    seal.replyToSender(ctx, msg, `${name}玩家加入成功，待本局所有玩家加入后可输入\".下注 金额\"进行下注`)
                }
            }
            if (val === 'exit' || val === '退出')
            {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$g押注名单ID`)[0])
                let stoppls = String(seal.vars.strGet(ctx, `$g停牌名单ID`)[0])
                let conpls = String(seal.vars.strGet(ctx, `$g结算名单ID`)[0])
                let patiparts = patis.trim().split("\n")
                let stakeparts = stakepls.trim().split("\n")
                let stopparts = stoppls.trim().split("\n")
                let conparts = conpls.trim().split("\n")
                let newpati = ""
                let newstake = ""
                let newstop = ""
                let newcon = ""
                for (let i = 0; i < patiparts.length; i++) {
                    if (patiparts[i] !== id)
                    {
                        newpati += patiparts[i] + "\n"
                    }
                }
                for (let i = 0; i < stakeparts.length; i++) {
                    if (stakeparts[i] !== id) {
                        newstake += stakeparts[i] + "\n"
                    }
                }
                for (let i = 0; i < stopparts.length; i++) {
                    if (stopparts[i] !== id) {
                        newstop += stopparts[i] + "\n"
                    }
                }
                for (let i = 0; i < conparts.length; i++) {
                    if (conparts[i] !== id) {
                        newcon += conparts[i] + "\n"
                    }
                }
                seal.vars.strSet(ctx, `$g参与名单ID`, newpati)
                seal.vars.strSet(ctx, `$g押注名单ID`, newstake)
                seal.vars.strSet(ctx, `$g停牌名单ID`, newstop)
                seal.vars.strSet(ctx, `$g结算名单ID`, newcon)
                seal.vars.intSet(ctx, `$m筹码`, 0)
                seal.replyToSender(ctx, msg, `玩家${name}已离开游戏，桌上的筹码不会返还`);
                //在所有名单中去掉这个玩家
            }
            if (val === 'MANAGElist')
            {
                let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$g押注名单ID`)[0])
                let stoppls = String(seal.vars.strGet(ctx, `$g停牌名单ID`)[0])
                let conpls = String(seal.vars.strGet(ctx, `$g结算名单ID`)[0])
                seal.replyToSender(ctx, msg, "参与:\n" + patis);
                seal.replyToSender(ctx, msg, "押注:\n" + stakepls);
                seal.replyToSender(ctx, msg, "停牌:\n" + stoppls);
                seal.replyToSender(ctx, msg, "结算:\n" + conpls);
            }
            if (val === 'MANAGEclear')
            {
                const cardstr = "1111111111111\n1111111111111\n1111111111111\n1111111111111\n";
                seal.vars.strSet(ctx, `$g游戏阶段`, "")
                seal.vars.strSet(ctx, `$g参与名单ID`, "")
                seal.vars.strSet(ctx, `$g押注名单ID`, "")
                seal.vars.strSet(ctx, `$g停牌名单ID`, "")
                seal.vars.strSet(ctx, `$g结算名单ID`, "")
                seal.vars.strSet(ctx, `$g牌组`, cardstr);
                seal.replyToSender(ctx, msg, `清空完成`);
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['21points'] = cmd21;
ext.cmdMap['21点'] = cmd21;

//押注部分(stake)
// .押注 x
const cmdstake = seal.ext.newCmdItemInfo();
cmdstake.name = 'stake'; // 指令名字，可用中文
cmdstake.help = '';
cmdstake.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if ((!isNaN(val) && val !== 0 && val2 === "") || (val === "all" && val2 === "")) {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
                let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$g押注名单ID`)[0])
                let wealth = Number(seal.vars.intGet(ctx, `$m财富`)[0])
                let chipon = Number(seal.vars.intGet(ctx, `$m筹码`)[0])
                let chip = Number(cmdArgs.getArgN(1))
                if (val === "all")
                {
                    chip = wealth;
                }
                let patiparts = patis.split("\n")
                //不在游戏中的玩家无法押注
                let addok = 1;
                for (let i = 0; i < patis.length; i++) {
                    if (id === patiparts[i]) {
                        addok = 0;
                        break;
                    }
                }
                if (addok) {
                    seal.replyToSender(ctx, msg, `${name}不在游戏中，无法下注哦`);
                }
                else if (stage !== "" && stage !== "押注") {
                    seal.replyToSender(ctx, msg, `当前不处于可押注阶段`);
                }
                else if (chipon !== 0) {
                    seal.replyToSender(ctx, msg, `${name}玩家已经下过注了哦`);
                }
                else if (chip > wealth) {
                    seal.replyToSender(ctx, msg, `你好像没有那么多刀乐，要不少押点？`)
                }
                else if (chip > 10000) {
                    seal.replyToSender(ctx, msg, `你是不是押的太多了？少点，慢慢来`);
                }
                else {
                    //押注成功，返回数据
                    stakepls += id + "\n"
                    seal.vars.intSet(ctx, `$m筹码`, chip)
                    wealth -= chip;
                    seal.vars.intSet(ctx, `$m财富`, wealth)
                    seal.vars.strSet(ctx, `$g游戏阶段`, "押注")
                    seal.vars.strSet(ctx, `$g押注名单ID`, stakepls)
                    seal.vars.intSet(ctx, `$m停牌`, 0)
                    seal.vars.intSet(ctx, `$m结算`, 0)
                    seal.vars.strSet(ctx, `$m手牌`, "")
                    seal.vars.intSet(ctx, `$m总点数`, 0)
                    seal.replyToSender(ctx, msg, `${name}玩家已下注${chip}刀乐，剩余${wealth}刀乐`);
                    let patiparts = patis.trim().split("\n")
                    let stakeparts = stakepls.trim().split("\n")
                    if (patiparts.length === stakeparts.length) {
                        seal.vars.strSet(ctx, `$g游戏阶段`, "要牌")
                        seal.vars.strSet(ctx, `$g结算名单ID`, "")
                        let cardan = ""
                        let suman = Number(0);
                        let cardstr = "1111111111111\n1111111111111\n1111111111111\n1111111111111\n";
                        let cards = AnalyseStr(cardstr)
                        let c1 = randomcard(cards)
                        let num1 = 0
                        suman += c1[2];
                        if (c1[1] === 1) num1++;
                        cards[c1[0] - 1][c1[1] - 1] = "0";
                        cardan += `${points[c1[0] - 1][c1[1] - 1]} `
                        while (suman <= 16) {
                            // seal.replyToSender(ctx, msg, AntiStr(cards));
                            let cx = randomcard(cards)
                            cards[cx[0] - 1][cx[1] - 1] = "0"
                            suman += cx[2];
                            cardan += `${points[cx[0] - 1][cx[1] - 1]} `
                            if (cx[1] === 1) num1++;
                            if (suman > 21 && num1)
                            {
                                num1--;
                                suman -= 10;
                            }
                        }
                        seal.vars.strSet(ctx, `$g庄家牌`, cardan)
                        seal.vars.strSet(ctx, `$g庄家明牌`, points[c1[0] - 1][c1[1] - 1])
                        seal.vars.intSet(ctx, `$g庄家点数`, suman)
                        cardstr = AntiStr(cards);
                        seal.vars.strSet(ctx, `$g牌组`, cardstr);
                        seal.replyToSender(ctx, msg, `所有玩家下注完成，进入要牌阶段\n庄家明牌：${points[c1[0] - 1][c1[1] - 1]}\n玩家可以输入\".叫牌\"进行叫牌`)
                    }
                }
            }
            else if (val === "") {
                seal.replyToSender(ctx, msg, `请输入下注金额`);
            }
            else if (val === "check") {
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
                let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$g押注名单ID`)[0])
                let patiparts = patis.trim().split("\n")
                let stakeparts = stakepls.trim().split("\n")
                if (patiparts.length === stakeparts.length && (stage === "押注" || stage === "")) {
                    seal.vars.strSet(ctx, `$g游戏阶段`, "要牌")
                    seal.vars.strSet(ctx, `$g结算名单ID`, "")
                    let cardan = ""
                    let suman = Number(0);
                    let cardstr = "1111111111111\n1111111111111\n1111111111111\n1111111111111\n";
                    let cards = AnalyseStr(cardstr)
                    let c1 = randomcard(cards)
                    let num1 = 0
                    suman += c1[2];
                    if (c1[1] === 1) num1++;
                    cards[c1[0] - 1][c1[1] - 1] = "0";
                    cardan += `${points[c1[0] - 1][c1[1] - 1]} `
                    while (suman <= 16) {
                        // seal.replyToSender(ctx, msg, AntiStr(cards));
                        let cx = randomcard(cards)
                        cards[cx[0] - 1][cx[1] - 1] = "0"
                        suman += cx[2];
                        cardan += `${points[cx[0] - 1][cx[1] - 1]} `
                        if (cx[1] === 1) num1++;
                        if (suman > 21 && num1) {
                            num1--;
                            suman -= 10;
                        }
                    }
                    seal.vars.strSet(ctx, `$g庄家牌`, cardan)
                    seal.vars.strSet(ctx, `$g庄家明牌`, points[c1[0] - 1][c1[1] - 1])
                    seal.vars.intSet(ctx, `$g庄家点数`, suman)
                    cardstr = AntiStr(cards);
                    seal.vars.strSet(ctx, `$g牌组`, cardstr);
                    seal.replyToSender(ctx, msg, `所有玩家下注完成，进入要牌阶段\n庄家明牌：${points[c1[0] - 1][c1[1] - 1]}\n玩家可以输入\".叫牌\"进行叫牌`)
                }
                else
                {
                    seal.replyToSender(ctx, msg, `检查完成`);
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['stake'] = cmdstake;   
ext.cmdMap['押注'] = cmdstake;  
ext.cmdMap['下注'] = cmdstake;


//要牌部分(ask)
// .要牌
const cmdask = seal.ext.newCmdItemInfo();
cmdask.name = 'ask'; // 指令名字，可用中文
cmdask.help = '';
cmdask.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "")
            {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
                let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$g押注名单ID`)[0])
                let patiparts = patis.split("\n")
                let stakeparts = stakepls.split("\n")
                let stoppls = String(seal.vars.strGet(ctx, `$g停牌名单ID`)[0])
                let cardstr = String(seal.vars.strGet(ctx, `$g牌组`)[0])
                let cards = AnalyseStr(cardstr)
                let hands = String(seal.vars.strGet(ctx, `$m手牌`)[0])
                let pointsum = Number(seal.vars.intGet(ctx, `$m总点数`)[0])
                let num1 = Number(seal.vars.intGet(ctx, `$mA个数`)[0])
                let stop = Number(seal.vars.intGet(ctx,`$m停牌`)[0])
                let addok = 1;
                for (let i = 0; i < patis.length; i++) {
                    if (id === patiparts[i]) {
                        addok = 0;
                        break;
                    }
                }
                if (stage !== "要牌")
                {
                    seal.replyToSender(ctx, msg, `当前不处于可要牌阶段`);
                }
                else if (stop === 1)
                {
                    seal.replyToSender(ctx, msg, `${name}玩家已处于停牌阶段，无法继续要牌`);
                }
                else if (addok)
                {
                    seal.replyToSender(ctx, msg, `${name}不在此次游戏中`);
                }
                else if (points >= 21)
                {
                    seal.replyToSender(ctx, msg, `${name}玩家的总点数为${points}，无法进行要牌`);
                }
                else if (hands === "")
                {
                    //首次要牌，直接给两张
                    let cget = randomcard(cards)
                    pointsum += cget[2];
                    hands += ` ${points[cget[0] - 1][cget[1] - 1]}`;
                    cards[cget[0] - 1][cget[1] - 1] = "0"
                    if (cget[1] === 1)
                    {
                        num1++;
                    }
                    //重复
                    cget = randomcard(cards)
                    pointsum += cget[2];
                    hands += ` ${points[cget[0] - 1][cget[1] - 1]}`;
                    cards[cget[0] - 1][cget[1] - 1] = "0"
                    if (cget[1] === 1) {
                        num1++;
                    }
                    //
                    if (pointsum > 21) {
                        num1--;
                        pointsum -= 10;
                    }
                    cardstr = AntiStr(cards)
                    seal.vars.strSet(ctx, `$m手牌`, hands)
                    seal.vars.intSet(ctx, `$m总点数`, pointsum)
                    seal.vars.intSet(ctx, `$mA个数`, num1)
                    seal.replyToSender(ctx, msg, `${name}玩家要牌完成，现有手牌:\n${hands}\n总点数${pointsum}\n玩家可输入\".叫牌\"继续叫牌，输入\".双倍\"进行双倍下注，输入\".停牌\"进行停牌`);
                }
                else
                {
                    let replystr = ""
                    let cget = randomcard(cards)
                    pointsum += cget[2];
                    hands += ` ${points[cget[0] - 1][cget[1] - 1]}`;
                    cards[cget[0] - 1][cget[1] - 1] = "0"
                    if (cget[1] === 1) {
                        num1++;
                    }
                    if (pointsum > 21 && num1) {
                        num1--;
                        pointsum -= 10;
                    }
                    cardstr = AntiStr(cards)
                    seal.vars.strSet(ctx, `$m手牌`, hands)
                    seal.vars.intSet(ctx, `$m总点数`, pointsum)
                    seal.vars.intSet(ctx, `$mA个数`, num1)
                    replystr += `${name}玩家要牌完成，现有手牌:\n${hands}\n总点数${pointsum}`
                    if (pointsum > 21)
                    {
                        stoppls += `${id}\n`
                        seal.vars.intSet(ctx, `$m停牌`, 1)
                        seal.vars.strSet(ctx, `$g停牌名单ID`, stoppls)
                        replystr += `\n${name}玩家点数已超过21点，爆牌，已自动停牌\n待所有玩家停牌后，可输入\".结算\"结算本局游戏`
                    }
                    if (pointsum === 21) {
                        stoppls += `${id}\n`
                        seal.vars.intSet(ctx, `$m停牌`, 1)
                        seal.vars.strSet(ctx, `$g停牌名单ID`, stoppls)
                        replystr += `\n${name}玩家点数达到21点，已自动停牌\n待所有玩家停牌后，可输入\".结算\"结算本局游戏`
                    }
                    seal.replyToSender(ctx, msg, replystr);
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['ask'] = cmdask;
ext.cmdMap['要牌'] = cmdask;
ext.cmdMap['叫牌'] = cmdask;

//双倍下注(double)
// .双倍下注
const cmddb = seal.ext.newCmdItemInfo();
cmddb.name = 'double'; // 指令名字，可用中文
cmddb.help = '';
cmddb.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "") {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
                let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$g押注名单ID`)[0])
                let patiparts = patis.split("\n")
                let stakeparts = stakepls.split("\n")
                let stoppls = String(seal.vars.strGet(ctx, `$g停牌名单ID`)[0])
                let cardstr = String(seal.vars.strGet(ctx, `$g牌组`)[0])
                let cards = AnalyseStr(cardstr)
                let hands = String(seal.vars.strGet(ctx, `$m手牌`)[0])
                let pointsum = Number(seal.vars.intGet(ctx, `$m总点数`)[0])
                let stop = Number(seal.vars.intGet(ctx, `$m停牌`)[0])
                let wealth = Number(seal.vars.intGet(ctx, `$m财富`)[0])
                let chipon = Number(seal.vars.intGet(ctx, `$m筹码`)[0])
                let addok = 1;
                for (let i = 0; i < patis.length; i++) {
                    if (id === patiparts[i]) {
                        addok = 0;
                        break;
                    }
                }
                if (stage !== "要牌") {
                    seal.replyToSender(ctx, msg, `当前不处于可要牌阶段`);
                }
                else if (stop === 1) {
                    seal.replyToSender(ctx, msg, `${name}玩家已处于停牌阶段，无法继续要牌`);
                }
                else if (addok) {
                    seal.replyToSender(ctx, msg, `${name}不在此次游戏中`);
                }
                else if (points >= 21) {
                    seal.replyToSender(ctx, msg, `${name}玩家的总点数为${points}，无法进行要牌`);
                }
                else if (hands.split(" ").length !== 3)
                {
                    seal.replyToSender(ctx, msg, `${name}玩家未进行首次要牌或已二次要牌，无法双倍下注`);
                }
                else if (wealth < chipon)
                {
                    seal.replyToSender(ctx, msg, `${name}玩家没有足够的刀乐来双倍下注`);
                }
                else {
                    let cget = randomcard(cards)
                    pointsum += cget[1];
                    stoppls += `${id}\n`
                    hands += ` ${points[cget[0] - 1][cget[1] - 1]}`;
                    cards[cget[0] - 1][cget[1] - 1] = 0
                    cardstr = AntiStr(cards)
                    wealth -= chipon;
                    chipon *= 2;
                    seal.vars.strSet(ctx, `$m手牌`, hands)
                    seal.vars.intSet(ctx, `$m总点数`, pointsum)
                    seal.vars.strSet(ctx, `$g停牌名单ID`, stoppls)
                    seal.vars.intSet(ctx, `$m停牌`, 1)
                    seal.vars.intSet(ctx, `$m财富`, wealth)
                    seal.vars.intSet(ctx, `$m筹码`, chipon)
                    seal.replyToSender(ctx, msg, `${name}玩家已进行双倍下注并停牌，现有手牌:\n${hands}\n总点数${pointsum}\n${name}玩家下注增加至${chipon}刀乐，剩余${wealth}刀乐\n待所有玩家停牌后，可输入\".结算\"结算本局游戏`);
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['double'] = cmddb;   
ext.cmdMap['双倍'] = cmddb;
ext.cmdMap['双倍下注'] = cmddb;

//停牌部分(stop)
// .停牌
const cmdstop = seal.ext.newCmdItemInfo();
cmdstop.name = 'stop'; // 指令名字，可用中文
cmdstop.help = '';
cmdstop.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "") {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
                let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$g押注名单ID`)[0])
                let patiparts = patis.split("\n")
                let stakeparts = stakepls.split("\n")
                let stoppls = String(seal.vars.strGet(ctx, `$g停牌名单ID`)[0])
                let cardstr = String(seal.vars.strGet(ctx, `$g牌组`)[0])
                let cards = AnalyseStr(cardstr)
                let hands = String(seal.vars.strGet(ctx, `$m手牌`)[0])
                let pointsum = Number(seal.vars.intGet(ctx, `$m总点数`)[0])
                let stop = Number(seal.vars.intGet(ctx, `$m停牌`)[0])
                let addok = 1;
                for (let i = 0; i < patis.length; i++) {
                    if (id === patiparts[i]) {
                        addok = 0;
                        break;
                    }
                }
                if (stage !== "要牌") {
                    seal.replyToSender(ctx, msg, `当前不处于可要牌阶段`);
                }
                else if (stop === 1) {
                    seal.replyToSender(ctx, msg, `${name}玩家已处于停牌阶段，无法再次停牌`);
                }
                else if (addok) {
                    seal.replyToSender(ctx, msg, `${name}不在此次游戏中`);
                }
                else if (points >= 21) {
                    seal.replyToSender(ctx, msg, `${name}玩家的总点数为${points}，无法进行要牌`);
                }
                else {
                    seal.vars.intSet(ctx, `$m停牌`, 1)
                    stoppls += `${id}\n`
                    seal.vars.strSet(ctx, `$g停牌名单ID`, stoppls)
                    seal.replyToSender(ctx, msg, `${name}玩家已停牌，现有手牌:\n${hands}\n总点数${pointsum}\n待所有玩家停牌后，可输入\".结算\"结算本局游戏`);
                }
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['stop'] = cmdstop;   
ext.cmdMap['停牌'] = cmdstop;

//结算部分(conclude)
// .结算
const cmdconclude = seal.ext.newCmdItemInfo();
cmdconclude.name = 'conclude'; // 指令名字，可用中文
cmdconclude.help = '';
cmdconclude.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            let id = String(ctx.player.userId)
            let name = String(ctx.player.name)
            let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
            let patis = String(seal.vars.strGet(ctx, `$g参与名单ID`)[0])
            let stakepls = String(seal.vars.strGet(ctx, `$g押注名单ID`)[0])
            let stoppls = String(seal.vars.strGet(ctx, `$g停牌名单ID`)[0])
            let conpls = String(seal.vars.strGet(ctx, `$g结算名单ID`)[0])
            let hands = String(seal.vars.strGet(ctx, `$m手牌`)[0])
            let pointsum = Number(seal.vars.intGet(ctx, `$m总点数`)[0])
            let stop = Number(seal.vars.intGet(ctx, `$m停牌`)[0])
            let conc = Number(seal.vars.intGet(ctx, `$m结算`)[0])
            let cardan = String(seal.vars.strGet(ctx, `$g庄家牌`)[0])
            let pointan = Number(seal.vars.intGet(ctx, `$g庄家点数`)[0])
            let wealth = Number(seal.vars.intGet(ctx, `$m财富`)[0])
            let chipon = Number(seal.vars.intGet(ctx, `$m筹码`)[0])
            let patiparts = patis.trim().split("\n")
            let stakeparts = stakepls.trim().split("\n")
            let stopparts = stoppls.trim().split("\n")
            let addok = 1;
            for (let i = 0; i < patis.length; i++) {
                if (id === patiparts[i]) {
                    addok = 0;
                    break;
                }
            }
            if (addok) {
                seal.replyToSender(ctx, msg, `${name}不在游戏中`);
            }
            else if (val === "check") {
                let conparts = conpls.trim().split("\n")
                if (patiparts.length === conparts.length) {
                    let cardstr = "1111111111111\n1111111111111\n1111111111111\n1111111111111\n"
                    seal.vars.strSet(ctx, `$g牌组`, cardstr)
                    seal.vars.strSet(ctx, `$g游戏阶段`, "")
                    seal.vars.strSet(ctx, `$g押注名单ID`, "")
                    seal.vars.strSet(ctx, `$g停牌名单ID`, "")
                    seal.vars.strSet(ctx, `$g结算名单ID`, "")
                    seal.replyToSender(ctx, msg, "所有玩家均已结算，已自动洗牌，可以开始下一局游戏了");
                }
            }
            else if (stage !== "要牌") {
                seal.replyToSender(ctx, msg, `当前不处于可结算阶段`);
            }
            else if (stop !== 1)
            {
                seal.replyToSender(ctx, msg, `${name}玩家还没有停牌，请停牌并等待所有玩家停牌完毕后再进行结算`);
            }
            else if (conc === 1)
            {
                seal.replyToSender(ctx, msg, `${name}玩家已经结算过了，不能重复结算`);
            }
            else if (stakeparts.length > stopparts.length)
            {
                seal.replyToSender(ctx, msg, `有玩家还没停牌，请耐心等等哦`);
            }
            else {
                let replystr = ""
                replystr += `庄家牌：${cardan}总点数${pointan}\n`
                replystr += `${name}玩家牌：${hands}，总点数${pointsum}\n`
                conpls += `${id}\n`
                let conparts = conpls.trim().split("\n")
                seal.vars.intSet(ctx, `$m结算`, 1)
                seal.vars.strSet(ctx, `$m手牌`, "")
                seal.vars.intSet(ctx, `$m总点数`, 0)
                seal.vars.intSet(ctx, `$m筹码`, 0)
                seal.vars.intSet(ctx, `$mA个数`, 0)
                seal.vars.strSet(ctx, `$g结算名单ID`, conpls)
                if ((pointan <= 21 && pointan > pointsum) || pointsum > 21)
                {
                    replystr += `庄家获胜，收走筹码，玩家剩余${wealth}刀乐`
                }
                else if (pointan === pointsum)
                {
                    wealth += chipon
                    seal.vars.intSet(ctx, `$m财富`, wealth)
                    replystr += `双方平局，玩家收回筹码，当前拥有${wealth}刀乐`
                }
                else
                {
                    wealth += chipon * 2
                    seal.vars.intSet(ctx, `$m财富`, wealth)
                    replystr += `${name}玩家获胜\n`
                    replystr += `${name}玩家本次游戏下注为${chipon}刀乐，获胜后总计拥有${wealth}刀乐`
                }
                if (patiparts.length === conparts.length)
                {
                    let cardstr = "1111111111111\n1111111111111\n1111111111111\n1111111111111\n"
                    seal.vars.strSet(ctx, `$g牌组`, cardstr)
                    seal.vars.strSet(ctx, `$g游戏阶段`, "")
                    seal.vars.strSet(ctx, `$g押注名单ID`, "")
                    seal.vars.strSet(ctx, `$g停牌名单ID`, "")
                    seal.vars.strSet(ctx, `$g结算名单ID`, "")
                    replystr += `\n所有玩家均已结算，已自动洗牌，可以开始下一局游戏了\n`
                }
                seal.replyToSender(ctx, msg, replystr);
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['conclude'] = cmdconclude;  
ext.cmdMap['结算'] = cmdconclude
