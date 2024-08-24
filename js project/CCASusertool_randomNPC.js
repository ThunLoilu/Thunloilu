// ==UserScript==
// @name         CCASusertool_randomNPC
// @author       冰红茶
// @version      1.0.0
// @description
// @timestamp    1724424019
// 2024-08-23 22:40:19
// @license      MIT
// @homepageURL  https://github.com/ThunLoilu/Thunloilu/tree/main/js%20project
// ==/UserScript==

function rand(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 首先检查是否已经存在
let ext = seal.ext.find('CCASusertool');
if (!ext) {
    // 不存在，那么建立扩展，名为CCASusertool'，作者“冰红茶”，版本1.0.0
    ext = seal.ext.new('CCASusertool' , '冰红茶', '1.0.0');
    // 注册扩展
    seal.ext.register(ext);
}
//.npcrand num name str 140-180 con 80-120 siz 120-165 dex 90-155
const cmdnpcrand = seal.ext.newCmdItemInfo();
cmdnpcrand.name = 'npcrd'; // 指令名字，可用中文
cmdnpcrand.help = `npcrd指令用于随机生成指定数量的npc
指令输入格式：
.npcrd num name skill1 val1 skill2 val2……
num：生成npc数量
name：npc名称
skill：npc技能
val：npc技能的属性值（可以是数字或数字范围，如70或50-80）`;
cmdnpcrand.solve = (ctx, msg, cmdArgs) => {
    let val = cmdArgs.getArgN(1);
    switch (val) {
        case 'help': {
            const ret = seal.ext.newCmdExecuteResult(true);
            ret.showHelp = true;
            return ret;
        }
        default: {
            if (!isNaN(val) && val > 0 && val <= 20)
            {
                let name = cmdArgs.getArgN(2);
                let inputcount = 2;
                let inputkey = cmdArgs.getArgN(++inputcount);
                let inputval = cmdArgs.getArgN(++inputcount);
                const npckeys = [];
                const npcvals = [];
                while (inputkey !== "" && inputval !== "")
                {
                    npckeys.push(inputkey);
                    npcvals.push(inputval);
                    inputkey = cmdArgs.getArgN(++inputcount);
                    inputval = cmdArgs.getArgN(++inputcount);
                }
                let replystr = "";
                for (let i = 0; i < val; i++)
                {
                    let namex = "\/ " + name + String(i + 1);
                    replystr += namex;
                    for (let j = 0; j < npckeys.length; j++)
                    {
                        // npckeys[i] => npcvals[i];
                        let key = npckeys[i];
                        let val = npcvals[i];
                        if (val.includes("-"))
                        {
                            let arr = val.split("-");
                            val = rand(parseInt(arr[0]), parseInt(arr[1]));
                        }
                        else
                        {
                            val = parseInt(val);
                        }
                        val -= val % 5; // 向下取整，保证npc属性值是5的倍数
                        replystr += " " + key + " " + val;
                    }
                    replystr += "\n";
                }
                seal.replyToSender(ctx, msg, replystr);
            }
            return seal.ext.newCmdExecuteResult(true);
        }
    }
};
// 将命令注册到扩展中
ext.cmdMap['npcrd'] = cmdnpcrand;   
ext.cmdMap['npcrand'] = cmdnpcrand;
