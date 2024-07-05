// ==UserScript==
// @name         Sic_Bo
// @author       冰红茶
// @version      1.0.0
// @description  骰宝，您的赌骰子小助手
// @timestamp    1720168327
// 2024-07-05 16:32:07
// @license      MIT
// @homepageURL  https://github.com/ThunLoilu/Thunloilu/tree/main/js%20project
// ==/UserScript==

// 函数
function rand(x) {
    let randomNumber = Math.floor(Math.random() * x) + 1;
    return Number(randomNumber);
}

//计算区间概率，感谢AI的大力debug
function posibility(initialPositions, diceSides, rolls) {
    if (rolls === 0) return initialPositions;

    let newPositions = new Array(initialPositions.length + diceSides).fill(0);

    for (let i = 0; i < initialPositions.length; i++) {
        for (let j = 1; j <= diceSides; j++) {
            newPositions[i + j] += initialPositions[i] / diceSides;
        }
    }

    return posibility(newPositions, diceSides, rolls - 1);
}

function subsum(obj) {
    const arr = [obj[0]];
    for (let i = 1; i < obj.length; i++) {
        arr.push(arr[i - 1] + obj[i]);
    }
    return arr;
}

function price(posi)
{
    let t = 1 / posi;
    if (t < 2)
    {
        if (t >= 1.5) t = 2;
        else t = 1;
    }
    else
    {
        t = Math.floor(t);
    }
    return t;
}

// 首先检查是否已经存在
let ext = seal.ext.find('sicbo');
if (!ext) {
    // 不存在，那么建立扩展，名为DiceBet，作者“冰红茶”，版本1.0.0
    ext = seal.ext.new('sicbo', '冰红茶', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
}

const cmd = seal.ext.newCmdItemInfo();
cmd.name = 'sicbo'; // 指令名字，可用中文
cmd.help = `.sicbo join ::加入游戏
.sicbo exit ::退出游戏
.sicbo r xdy ::骰x个y面骰
.sicbo stake <类型> <数据> <筹码> ::下注
.sicbo conclude ::结算

当前可下注类型：
.sicbo stake range l r chip ::下注内容为骰点结果在[l,r]中，下注chip刀乐
.sicbo stake single/even chip ::下注内容为骰点结果为奇数/偶数，下注chip刀乐
.sicbo stake num chip ::下注内容为骰点结果为num，下注chip刀乐
（特别提醒：本游戏下注不支持all）

下注后赔率由下注者的获胜概率实时计算，以上指令均有中文版（可@开发者获取）`;
cmd.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (val === "加入" || val === "join")
            {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
                let patis = String(seal.vars.strGet(ctx, `$gsic参与名单ID`)[0])
                let wealth = Number(seal.vars.intGet(ctx, `$m财富`)[0])
                let parts = patis.trim().split("\n")
                let addok = 1;
                for (let i = 0; i < patis.length; i++) {
                    if (id === parts[i]) {
                        addok = 0;
                        break;
                    }
                }
                if (!addok) {
                    seal.replyToSender(ctx, msg, `${name}玩家已加入游戏，无法重复加入`);
                }
                else if (wealth === 0) {
                    seal.replyToSender(ctx, msg, `${name}玩家没有刀乐用来押注，无法上桌`);
                }
                else if (stage !== "") {
                    seal.replyToSender(ctx, msg, `游戏已经开始了，请在游戏结束后再加入`);
                }
                else {
                    patis += id + "\n"
                    seal.vars.strSet(ctx, `$gsic参与名单ID`, patis)
                    seal.vars.intSet(ctx, `$m筹码`, 0)
                    seal.replyToSender(ctx, msg, `${name}玩家加入成功，待本局所有玩家加入后可输入\".sicbo r xdy\"进行骰点`)
                }
            }
            else if (val === "退出" || val === "exit")
            {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let patis = String(seal.vars.strGet(ctx, `$gsic参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$gsic押注名单ID`)[0])
                let conpls = String(seal.vars.strGet(ctx, `$gsic结算名单ID`)[0])
                let patiparts = patis.trim().split("\n")
                let stakeparts = stakepls.trim().split("\n")
                let conparts = conpls.trim().split("\n")
                let newpati = ""
                let newstake = ""
                let newcon = ""
                for (let i = 0; i < patiparts.length; i++) {
                    if (patiparts[i] !== id) {
                        newpati += patiparts[i] + "\n"
                    }
                }
                for (let i = 0; i < stakeparts.length; i++) {
                    if (stakeparts[i] !== id) {
                        newstake += stakeparts[i] + "\n"
                    }
                }
                for (let i = 0; i < conparts.length; i++) {
                    if (conparts[i] !== id) {
                        newcon += conparts[i] + "\n"
                    }
                }
                seal.vars.strSet(ctx, `$gsic参与名单ID`, newpati)
                seal.vars.strSet(ctx, `$gsic押注名单ID`, newstake)
                seal.vars.strSet(ctx, `$gsic结算名单ID`, newcon)
                seal.vars.intSet(ctx, `$m筹码`, 0)
                seal.replyToSender(ctx, msg, `玩家${name}已离开游戏，桌上的筹码不会返还`);
            }
            else if (val === "骰" || val === "掷骰" || val === "r")
            {
                let val2 = cmdArgs.getArgN(2)
                if (val2.includes("d"))
                {
                    let id = String(ctx.player.userId)
                    let name = String(ctx.player.name)
                    let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0])
                    let patis = String(seal.vars.strGet(ctx, `$gsic参与名单ID`)[0])
                    let partdice = val2.split("d")
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
                        seal.replyToSender(ctx, msg, `${name}不在游戏中，无法掷骰哦`);
                    }
                    else if (stage !== "骰点" && stage !== "")
                    {
                        seal.replyToSender(ctx, msg, `当前不为可掷骰阶段`);
                    }
                    else if (partdice.length === 2 && !isNaN(partdice[0]) && !isNaN(partdice[1]))
                    {
                        if (partdice[0] > 10 || partdice[1] > 100)
                        {
                            seal.replyToSender(ctx, msg, `小安拿不出这些骰子来骰哦，少骰一点好吗？`);
                        }
                        else
                        {
                            const dicerate = [1];
                            const dice = [];
                            let sumdice = 0;
                            let randnum = 0;
                            for (let i = 0; i < partdice[0]; i++)
                            {
                                randnum = rand(partdice[1])
                                dice.push(randnum);
                                sumdice += randnum;
                            }
                            if(partdice[0] === 1) sumdice = randnum
                            console.log(sumdice)
                            const pos = posibility(dicerate, Number(partdice[1]), Number(partdice[0]));
                            const sub = subsum(pos);
                            seal.vars.strSet(ctx, `$gsic概率`, JSON.stringify(pos));//JSON.stringify()
                            seal.vars.strSet(ctx, `$gsic前缀和`, JSON.stringify(sub));
                            seal.vars.strSet(ctx, `$gsic骰子`, JSON.stringify(dice));
                            seal.vars.intSet(ctx, `$gsic总点数`, sumdice);
                            seal.vars.strSet(ctx, `$g游戏阶段`, "下注")
                            seal.replyToSender(ctx, msg, `骰点完成啦，可以下注了`);
                        }
                    }
                    else
                    {
                        seal.replyToSender(ctx, msg, `玩家${name}输入格式错误`);
                    }
                }
            }
            else if (val === "下注" || val === "押注" || val === "stake")
            {
                //.sicbo stake range left right chip
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let val2 = cmdArgs.getArgN(2)
                let x = cmdArgs.getArgN(3)
                let y = cmdArgs.getArgN(4)
                let z = cmdArgs.getArgN(5)
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0]);
                let patis = String(seal.vars.strGet(ctx, `$gsic参与名单ID`)[0]);
                let stakepls = String(seal.vars.strGet(ctx, `$gsic押注名单ID`)[0]);
                let wealth = Number(seal.vars.intGet(ctx, `$m财富`)[0]);
                let chipon = Number(seal.vars.intGet(ctx, `$m筹码`)[0]);
                let pos = JSON.parse(String(seal.vars.strGet(ctx, `$gsic概率`)[0]));
                let sub = JSON.parse(String(seal.vars.strGet(ctx, `$gsic前缀和`)[0]));
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
                if (val === "check")
                {
                    if (patis.trim().split("\n").length === stakepls.trim().split("\n").length) {
                        seal.vars.strSet(ctx, `$g游戏阶段`, "结算")
                        seal.replyToSender(ctx, msg, `所有玩家已完成下注，进入结算阶段`);
                    }
                }
                else if (stage !== "下注") {
                    seal.replyToSender(ctx, msg, `当前不为可下注阶段`);
                }
                else if (chipon !== 0) {
                    seal.replyToSender(ctx, msg, `${name}玩家已经下过注了哦`);
                }
                else if (val2 === "范围" || val2 === "range") {
                    let l = Math.min(Number(x), Number(y)), r = Math.max(Number(x), Number(y)), chip = Number(z);
                    if (chip > wealth) {
                        seal.replyToSender(ctx, msg, `你好像没有那么多刀乐，要不少押点？`)
                    }
                    else if (chip > 1000000) {
                        seal.replyToSender(ctx, msg, `你是不是押的太多了？桌上可摆不下这么多筹码哦`);
                    }
                    else {
                        let posi = sub[r] - sub[l - 1];
                        let rate = price(posi);
                        wealth -= chip;
                        const ch = ["range", l, r];
                        stakepls += id + "\n";
                        seal.vars.intSet(ctx, `$m赔率`, rate);
                        seal.vars.intSet(ctx, `$m筹码`, chip);
                        seal.vars.intSet(ctx, `$m财富`, wealth);
                        seal.vars.strSet(ctx, `$m目标点数`, JSON.stringify(ch));
                        seal.vars.strSet(ctx, `$gsic押注名单ID`, stakepls)
                        seal.replyToSender(ctx, msg, `${name}玩家下注完成，本次下注对应倍率为${rate}倍`);
                    }
                }
                else if (val2 === "奇数" || val2 === "single" || val2 === "单数")
                {
                    let chip = x;
                    if (chip > wealth) {
                        seal.replyToSender(ctx, msg, `你好像没有那么多刀乐，要不少押点？`)
                    }
                    else if (chip > 1000000) {
                        seal.replyToSender(ctx, msg, `你是不是押的太多了？桌上可摆不下这么多筹码哦`);
                    }
                    else {
                        let rate = 2;
                        seal.vars.intSet(ctx, `$m赔率`, rate);
                        seal.vars.intSet(ctx, `$m筹码`, chip);
                        const ch = ["single"];
                        wealth -= chip;
                        seal.vars.intSet(ctx, `$m财富`, wealth);
                        seal.vars.strSet(ctx, `$m目标点数`, JSON.stringify(ch));
                        stakepls += id + "\n";
                        seal.vars.strSet(ctx, `$gsic押注名单ID`, stakepls)
                        seal.replyToSender(ctx, msg, `${name}玩家下注完成，本次下注对应倍率为${rate}倍`);
                    }
                }
                else if (val2 === "偶数" || val2 === "even" || val2 === "双数")
                {
                    let chip = Number(x);
                    if (chip > wealth) {
                        seal.replyToSender(ctx, msg, `你好像没有那么多刀乐，要不少押点？`)
                    }
                    else if (chip > 1000000) {
                        seal.replyToSender(ctx, msg, `你是不是押的太多了？桌上可摆不下这么多筹码哦`);
                    }
                    else {
                        let rate = 2;
                        seal.vars.intSet(ctx, `$m赔率`, rate);
                        seal.vars.intSet(ctx, `$m筹码`, chip);
                        const ch = ["even"];
                        wealth -= chip;
                        seal.vars.intSet(ctx, `$m财富`, wealth);
                        seal.vars.strSet(ctx, `$m目标点数`, JSON.stringify(ch));
                        stakepls += id + "\n";
                        seal.vars.strSet(ctx, `$gsic押注名单ID`, stakepls)
                        seal.replyToSender(ctx, msg, `${name}玩家下注完成，本次下注对应倍率为${rate}倍`);
                    }
                }
                else if (!isNaN(val2))
                {
                    let chip = Number(x);
                    if (chip > wealth) {
                        seal.replyToSender(ctx, msg, `你好像没有那么多刀乐，要不少押点？`)
                    }
                    else if (chip > 1000000) {
                        seal.replyToSender(ctx, msg, `你是不是押的太多了？桌上可摆不下这么多筹码哦`);
                    }
                    else {
                        let rate = price(pos[Number(val2)])
                        seal.vars.intSet(ctx, `$m赔率`, rate);
                        seal.vars.intSet(ctx, `$m筹码`, chip);
                        const ch = ["number", Number(val2)];
                        wealth -= chip;
                        seal.vars.intSet(ctx, `$m财富`, wealth);
                        seal.vars.strSet(ctx, `$m目标点数`, JSON.stringify(ch));
                        stakepls += id + "\n";
                        seal.vars.strSet(ctx, `$gsic押注名单ID`, stakepls)
                        seal.replyToSender(ctx, msg, `${name}玩家下注完成，本次下注对应倍率为${rate}倍`);
                    }
                }
                if (patis.trim().split("\n").length === stakepls.trim().split("\n").length)
                {
                    seal.vars.strSet(ctx, `$g游戏阶段`, "结算")
                    seal.replyToSender(ctx, msg, `所有玩家已完成下注，进入结算阶段`);
                }
            }
            else if (val === "结算" || val.toLowerCase() === "conclude")
            {
                let id = String(ctx.player.userId)
                let name = String(ctx.player.name)
                let stage = String(seal.vars.strGet(ctx, `$g游戏阶段`)[0]);
                let patis = String(seal.vars.strGet(ctx, `$gsic参与名单ID`)[0]);
                let conpls = String(seal.vars.strGet(ctx, `$gsic结算名单ID`)[0]);
                let wealth = Number(seal.vars.intGet(ctx, `$m财富`)[0]);
                let chipon = Number(seal.vars.intGet(ctx, `$m筹码`)[0]);
                let rate = Number(seal.vars.intGet(ctx, `$m赔率`)[0]);
                let dice = JSON.parse(String(seal.vars.strGet(ctx, `$gsic骰子`)[0]));
                let sumnum = Number(seal.vars.intGet(ctx, `$gsic总点数`)[0])
                let ch = JSON.parse(String(seal.vars.strGet(ctx, `$m目标点数`)[0]));
                let patiparts = patis.trim().split("\n")
                let conparts = conpls.trim().split("\n")
                let addok = 1;
                let val2 = cmdArgs.getArgN(2);
                for (let i = 0; i < patiparts.length; i++) {
                    if (id === patiparts[i]) {
                        addok = 0;
                        break;
                    }
                }
                let conok = 1;
                for (let i = 0; i < conparts.length; i++) {
                    if (id === conparts[i]) {
                        conok = 0;
                        break;
                    }
                }
                console.log(sumnum)
                let dicestr = "";
                for (let i = 0; i < dice.length; i++)
                {
                    dicestr += dice[i] + ","
                }
                if (addok) {
                    seal.replyToSender(ctx, msg, `${name}不在游戏中，无法下注哦`);
                }
                else if (val2 === "check")
                {
                    if (patis.trim().split("\n").length === conpls.trim().split("\n").length) {
                        seal.vars.strSet(ctx, `$g游戏阶段`, "")
                        seal.vars.strSet(ctx, `$gsic押注名单ID`, "")
                        seal.vars.strSet(ctx, `$gsic结算名单ID`, "")
                        seal.replyToSender(ctx, msg, `所有玩家已完成结算，可以进行下一场游戏了`);
                    }
                }
                else if (!conok)
                {
                    seal.replyToSender(ctx, msg, `${name}玩家已经结算过了，不能重复结算`);
                }
                else if (stage !== "结算") {
                    seal.replyToSender(ctx, msg, `当前不为可结算阶段`);
                }
                else
                {
                    if (ch[0] === "number")
                    {
                        if (ch[1] === sumnum)
                        {
                            let get = Math.floor(chipon * rate);
                            wealth += get;
                            seal.vars.intSet(ctx, `$m赔率`, 0);
                            seal.vars.intSet(ctx, `$m筹码`, 0);
                            seal.vars.intSet(ctx, `$m财富`, wealth);
                            seal.replyToSender(ctx, msg, `本局骰点为：${dicestr}\n总点数：${sumnum}\n${name}玩家赢得筹码${get}刀乐，现共有${wealth}刀乐`);
                        }
                        else
                        {
                            seal.vars.intSet(ctx, `$m赔率`, 0);
                            seal.vars.intSet(ctx, `$m筹码`, 0);
                            seal.replyToSender(ctx, msg, `本局骰点为：${dicestr}\n总点数：${sumnum}\n${name}玩家的筹码被收走`);
                        }
                    }
                    if (ch[0] === "single" || ch[0] === "even")
                    {
                        if (!(sumnum&1))
                        {
                            if (ch[0] === "even")
                            {
                                let get = Math.floor(chipon * rate);
                                wealth += get;
                                seal.vars.intSet(ctx, `$m赔率`, 0);
                                seal.vars.intSet(ctx, `$m筹码`, 0);
                                seal.vars.intSet(ctx, `$m财富`, wealth);
                                seal.replyToSender(ctx, msg, `本局骰点为：${dicestr}\n总点数：${sumnum}\n${name}玩家赢得筹码${get}刀乐，现共有${wealth}刀乐`);
                            }
                            else {
                                seal.vars.intSet(ctx, `$m赔率`, 0);
                                seal.vars.intSet(ctx, `$m筹码`, 0);
                                seal.replyToSender(ctx, msg, `本局骰点为：${dicestr}\n总点数：${sumnum}\n${name}玩家的筹码被收走，现剩余${wealth}刀乐`);
                            }
                        }
                        else
                        {
                            if (ch[0] === "single")
                            {
                                let get = Math.floor(chipon * rate);
                                wealth += get;
                                seal.vars.intSet(ctx, `$m赔率`, 0);
                                seal.vars.intSet(ctx, `$m筹码`, 0);
                                seal.vars.intSet(ctx, `$m财富`, wealth);
                                seal.replyToSender(ctx, msg, `本局骰点为：${dicestr}\n总点数：${sumnum}\n${name}玩家赢得筹码${get}刀乐，现共有${wealth}刀乐`);
                            }
                            else {
                                seal.vars.intSet(ctx, `$m赔率`, 0);
                                seal.vars.intSet(ctx, `$m筹码`, 0);
                                seal.replyToSender(ctx, msg, `本局骰点为：${dicestr}\n总点数：${sumnum}\n${name}玩家的筹码被收走，现剩余${wealth}刀乐`);
                            }
                        }
                    }
                    if (ch[0] === "range")
                    {
                        if (sumnum >= ch[1] && sumnum <= ch[2])
                        {
                            let get = Math.floor(chipon * rate);
                            wealth += get;
                            seal.vars.intSet(ctx, `$m赔率`, 0);
                            seal.vars.intSet(ctx, `$m筹码`, 0);
                            seal.vars.intSet(ctx, `$m财富`, wealth);
                            seal.replyToSender(ctx, msg, `本局骰点为：${dicestr}\n总点数：${sumnum}\n${name}玩家赢得筹码${get}刀乐，现共有${wealth}刀乐`);
                        }
                        else {
                            seal.vars.intSet(ctx, `$m赔率`, 0);
                            seal.vars.intSet(ctx, `$m筹码`, 0);
                            seal.replyToSender(ctx, msg, `本局骰点为：${dicestr}\n总点数：${sumnum}\n${name}玩家的筹码被收走，现剩余${wealth}刀乐`);
                        }
                    }
                    conpls += id + "\n"
                    seal.vars.strSet(ctx, `$gsic结算名单ID`, conpls);
                    if (patis.trim().split("\n").length === conpls.trim().split("\n").length) {
                        seal.vars.strSet(ctx, `$g游戏阶段`, "")
                        seal.vars.strSet(ctx, `$gsic押注名单ID`, "")
                        seal.vars.strSet(ctx, `$gsic结算名单ID`, "")
                        seal.replyToSender(ctx, msg, `所有玩家已完成结算，可以进行下一场游戏了`);
                    }
                }
            }
            if (val === 'MANAGElist') {
                let patis = String(seal.vars.strGet(ctx, `$gsic参与名单ID`)[0])
                let stakepls = String(seal.vars.strGet(ctx, `$gsic押注名单ID`)[0])
                let conpls = String(seal.vars.strGet(ctx, `$gsic结算名单ID`)[0])
                seal.replyToSender(ctx, msg, "参与:\n" + patis);
                seal.replyToSender(ctx, msg, "押注:\n" + stakepls);
                seal.replyToSender(ctx, msg, "结算:\n" + conpls);
            }
            if (val === 'MANAGEclear') {
                seal.vars.strSet(ctx, `$g游戏阶段`, "")
                seal.vars.strSet(ctx, `$gsic参与名单ID`, "")
                seal.vars.strSet(ctx, `$gsic押注名单ID`, "")
                seal.vars.strSet(ctx, `$gsic结算名单ID`, "")
                seal.replyToSender(ctx, msg, `清空完成`);
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['sicbo'] = cmd;
ext.cmdMap['骰宝'] = cmd;
