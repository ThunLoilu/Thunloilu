// ==UserScript==
// @name         24点-奖励副本
// @author       冰红茶
// @version      1.0.0
// @description
// @timestamp    1719727757
// 2024-06-30 14:09:17
// @license      MIT
// @homepageURL  https://github.com/ThunLoilu/Thunloilu/tree/main/js%20project
// ==/UserScript==

//随机数
function rand(x) {
    let randomNumber = Math.floor(Math.random() * x) + 1;
    return Number(randomNumber);
}

//计算器
function _calc(expr) {
    return Function('return (' + expr + ')')()
}

function calc(calstr) {
    let ans;
    try {
        ans = _calc(calstr);
    } catch (error) {
        ans = "表达式错误";
    }
    return ans;
}

//检查输入算式格式和所用数字（感谢AI的大力debug）
function checkSpecificDigitsNoConsecutive(s, digitFrequencies) {
    // 定义允许的运算符和括号
    const allowedOperators = ['+', '-', '*', '/', '(', ')'];

    // 正则表达式匹配所有数字（包括10）和运算符/括号
    const tokenRegex = /\b(10|[1-9])\b|[+\-*/()]/g;

    // 分割并提取表达式中的所有token（数字、运算符和括号）
    const tokens = s.match(tokenRegex);

    // 验证token是否都属于允许的集合
    if (!tokens || tokens.some(token => !allowedOperators.includes(token) && !digitFrequencies.includes(token))) {
        return false;
    }

    // 验证没有单独的0出现
    if (s.includes('0') && !s.includes('10')) {
        return false;
    }

    // 检查括号是否平衡
    const stack = [];
    for (const token of tokens) {
        if (token === '(') {
            stack.push(token);
        } else if (token === ')') {
            if (stack.length === 0) {
                return false; // 闭合括号多于开放括号
            }
            stack.pop();
        }
    }
    if (stack.length > 0) {
        return false; // 开放括号多于闭合括号
    }

    // 创建一个映射来跟踪每个数字的出现次数，特别处理1和10
    const digitOccurrences = new Map();
    for (const token of tokens) {
        if (['1', '10'].includes(token)) {
            digitOccurrences.set(token, (digitOccurrences.get(token) || 0) + 1);
        } else if (!isNaN(token) && token !== '10') {
            digitOccurrences.set(token, (digitOccurrences.get(token) || 0) + 1);
        }
    }

    // 检查每个数字的出现次数是否与digitFrequencies中指定的次数相匹配
    for (const [digit, count] of digitOccurrences) {
        const expectedCount = digitFrequencies.filter(d => d === digit).length;
        if (count !== expectedCount) {
            return false;
        }
    }

    // 检查digitFrequencies中的所有数字是否都在表达式中出现过
    for (const digit of digitFrequencies) {
        if (!digitOccurrences.has(digit)) {
            return false;
        }
    }

    return true;
}

//判断24点
/*
(aib)j(ckd)
(aibjc)kd
ai(bjckd)
(aib)jckd
ai(bjc)kd
aibj(ckd)
aibjckd
*/
function cal24(c1, c2, c3, c4) {
    const oper = ['+', '-', '*', '/']
    const num = [Number(c1), Number(c2), Number(c3), Number(c4)]
    const order = ["(aib)j(ckd)","(aibjc)kd","ai(bjckd)","(aib)jckd","ai(bjc)kd","aibj(ckd)","aibjckd"]
    let ans = "";
    for (let i = 0; i < 24; i++)
    {
        let x1 = Number(Math.floor(i / 6));
        let x2 = Number(Math.floor(i % 6 / 2));
        let x3 = Number(Math.floor(i % 2));
        let x4 = Number(0)
        if (x1 <= x2) x2++;
        if (Math.min(x1,x2) <= x3) x3++;
        if (Math.max(x1,x2) <= x3) x3++;
        x2 %= 4;
        x3 %= 4;
        while (x4 === x1 || x4 === x2 || x4 === x3) x4 = (x4 + 1) % 4;
        //x1x2x3x4分别为0123中一个
        x1 = (num[x1])
        x2 = (num[x2])
        x3 = (num[x3])
        x4 = (num[x4])
        for (let j = 0; j < 64; j++)
        {
            let m1 = oper[Number(Math.floor(j / 16))]
            let m2 = oper[Number(Math.floor(j / 4 % 4))]
            let m3 = oper[Number(Math.floor(j % 4))]
            for (let k = 0; k < 7; k++)
            {
                let equstr = order[k]
                equstr = equstr.replace('a', String(x1))
                equstr = equstr.replace('b', String(x2))
                equstr = equstr.replace('c', String(x3))
                equstr = equstr.replace('d', String(x4))
                equstr = equstr.replace('i', String(m1))
                equstr = equstr.replace('j', String(m2))
                equstr = equstr.replace('k', String(m3))
                let t = calc(equstr.trim())
                if (t === "表达式错误")
                    console.log(t + " " + equstr)
                else if (t === 24)
                    return equstr; 
            }
        }
    }
    return "uns";
}

// 首先检查是否已经存在
let ext = seal.ext.find('24点');
if (!ext) {
    // 不存在，那么建立扩展，名为24点，作者“”，版本1.0.0
    ext = seal.ext.new('24点', '冰红茶', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
}

const cmd24 = seal.ext.newCmdItemInfo();
cmd24.name = '24点'; // 指令名字，可用中文
cmd24.help = '';
cmd24.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    let val2 = cmdArgs.getArgN(2);
    let val3 = cmdArgs.getArgN(3);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if ((val === "开题" || val === "question") && val2 === "")
            {
                if (seal.vars.strGet(ctx, `$g24游戏阶段`)[0] === "")
                {
                    let c1 = rand(10), c2 = rand(10), c3 = rand(10), c4 = rand(10);
                    seal.vars.intSet(ctx, `$g群24点随机数1`, c1)
                    seal.vars.intSet(ctx, `$g群24点随机数2`, c2)
                    seal.vars.intSet(ctx, `$g群24点随机数3`, c3)
                    seal.vars.intSet(ctx, `$g群24点随机数4`, c4)
                    seal.replyToSender(ctx, msg, `本轮24点随机数为：\n${c1},${c2},${c3},${c4}\n可输入\".24点 答题 <回答>\"来抢答（特别提示：请使用英文括号）`);
                    let ans = cal24(c1, c2, c3, c4)
                    seal.vars.strSet(ctx, `$g答案`, ans);
                    seal.vars.strSet(ctx, `$g24游戏阶段`, "抢答")
                    console.log(ans);
                }
                else
                {
                    seal.replyToSender(ctx, msg, `当前不处于可开题阶段`);
                }
            }
            else if ((val === "答题" || val === "answer") && val3 === "")
            {
                const nums = [String(seal.vars.intGet(ctx, `$g群24点随机数1`)[0]),
                    String(seal.vars.intGet(ctx, `$g群24点随机数2`)[0]),
                    String(seal.vars.intGet(ctx, `$g群24点随机数3`)[0]),
                    String(seal.vars.intGet(ctx, `$g群24点随机数4`)[0])]
                if (seal.vars.strGet(ctx, `$g24游戏阶段`)[0] === "抢答")
                {
                    let ans = seal.vars.strGet(ctx, `$g答案`)[0];
                    console.log(ans);
                    if ( (val2.trim() === "无解" && ans === "uns") || (calc(val2) === 24 && checkSpecificDigitsNoConsecutive(val2, nums)) )
                    {
                        //玩家回答正确，给钱（连续答对获得奖励增加）
                        let id = String(ctx.player.userId);
                        let name = String(ctx.player.name);
                        let wealth = Number(seal.vars.intGet(ctx, `$m财富`)[0])
                        let lastpl = String(seal.vars.strGet(ctx, `$g上次答对玩家ID`)[0]);
                        let bouns = 500
                        let cnt = 0
                        if (lastpl === id)
                        {
                            cnt = seal.vars.intGet(ctx, `$g上次答对玩家次数`)[0]
                            bouns += 150 * cnt
                            if (cnt % 10 === 0)
                            {
                                bouns *= 20
                            }
                            seal.vars.intSet(ctx,`$g上次答对玩家次数`,++cnt)
                        }
                        else
                        {
                            seal.vars.intSet(ctx, `$g上次答对玩家次数`, 0)
                        }
                        wealth += bouns;
                        seal.vars.intSet(ctx, `$m财富`, wealth);
                        seal.vars.strSet(ctx, `$g上次答对玩家ID`, id);
                        seal.vars.strSet(ctx, `$g24游戏阶段`, "")
                        seal.replyToSender(ctx, msg, `${name}玩家回答正确，连续回答正确${cnt+1}次，获得奖励${bouns}刀乐\n${name}玩家目前共拥有${wealth}刀乐`);
                    }
                    else if (val2 === "答案")
                    {
                        seal.vars.intSet(ctx, `$g上次答对玩家次数`, 0);
                        seal.vars.strSet(ctx, `$g上次答对玩家ID`, "");
                        seal.vars.strSet(ctx, `$g24游戏阶段`, "")
                        seal.replyToSender(ctx, msg, `答案为:${ans}，本轮已重置`);
                    }
                    else if ((calc(val2) === "表达式错误" || !checkSpecificDigitsNoConsecutive(val2, nums)) && val2.trim() !== "无解")
                    {
                        //输入格式错误
                        let name = String(ctx.player.name);
                        seal.replyToSender(ctx, msg, `${name}玩家输入格式错误\n（特别提示：请使用英文括号）`);
                    }
                    else
                    {
                        //答案错误
                        let name = String(ctx.player.name);
                        seal.replyToSender(ctx, msg, `${name}玩家的答案错误`);
                    }
                }
                else {
                    seal.replyToSender(ctx, msg, `当前不处于可抢答阶段`);
                }
            }
            else if (val === "MANAGEclear")
            {
                seal.vars.intSet(ctx, `$g群24点随机数1`, 0)
                seal.vars.intSet(ctx, `$g群24点随机数2`, 0)
                seal.vars.intSet(ctx, `$g群24点随机数3`, 0)
                seal.vars.intSet(ctx, `$g群24点随机数4`, 0)
                seal.vars.strSet(ctx, `$g答案`, "");
                seal.vars.strSet(ctx, `$g24游戏阶段`, "")
                seal.vars.strSet(ctx, `$g上次答对玩家ID`, "");
                seal.vars.intSet(ctx, `$g上次答对玩家次数`, 0)
                seal.replyToSender(ctx, msg, `清空完成`);
            }
            
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['24点'] = cmd24;   
ext.cmdMap['24point'] = cmd24;

const cmdcal = seal.ext.newCmdItemInfo();
cmdcal.name = '表达式计算'; // 指令名字，可用中文
cmdcal.help = '';
cmdcal.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            seal.replyToSender(ctx, msg, calc(val));
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['表达式计算'] = cmdcal;   

// const cmd24_ = seal.ext.newCmdItemInfo();
// cmd24_.name = '24点计算'; // 指令名字，可用中文
// cmd24_.help = '';
// cmd24_.solve = (ctx, msg, cmdArgs) => {
//     let val = cmdArgs.getArgN(1);
//     let val2 = cmdArgs.getArgN(2);
//     let val3 = cmdArgs.getArgN(3);
//     let val4 = cmdArgs.getArgN(4);
//     switch (val) {
//         case 'help': {
//             const ret = seal.ext.newCmdExecuteResult(true);
//             ret.showHelp = true;
//             return ret;
//         }
//         default: {
//             seal.replyToSender(ctx, msg, cal24(val, val2, val3, val4));
//             return seal.ext.newCmdExecuteResult(true);
//         }
//     }
// };
// // 将命令注册到扩展中
// ext.cmdMap['24点计算'] = cmd24_;   
