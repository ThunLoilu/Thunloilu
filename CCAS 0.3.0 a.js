// ==UserScript==
// @name         Combat&Chases Assist System
// @author       社亦园 冰红茶
// @version      0.3.0
// @description  一款COC战斗与追逐辅助系统
// @timestamp    1717474718
// 2024-06-04 12:18:38
// @license      MIT
// @homepageURL  https://github.com/Sheyiyuan/Dice_Plug-in.git
// ==/UserScript==
/*

主要功能
1. 通用基本功能 v
  1.1 判定建立战斗与追逐
  1.2 NPC 数据录入
2. 战斗辅助系统 v
  2.1 自动敏捷排序
    2.1.1 直接排序
    2.1.2 含有突袭的排序
    2.1.3 含有先攻检定的排序
  2.2 自动计算伤害
  2.3 自动计算战技
3. 追逐辅助系统
  3.1 辅助建立追逐
    3.1.1 自动判定追逐
    3.1.2 自动排序与行动点计算
  3.2 追逐实况报表
    3.2.1 自动更新打点计时器
    3.2.2 实时行动点显示
    3.2.3 险境与障碍标注（含随机险境与障碍）
*/


//
//                       _oo0oo_
//                      o8888888o
//                      88" . "88
//                      (| -_- |)
//                      0\  =  /0
//                    ___/`---'\___
//                  .' \\|     |// '.
//                 / \\|||  :  |||// \
//                / _||||| -:- |||||- \
//               |   | \\\  -  /// |   |
//               | \_|  ''\---/''  |_/ |
//               \  .-\__  '-'  ___/-. /
//             ___'. .'  /--.--\  `. .'___
//          ."" '<  `.___\_<|>_/___.' >' "".
//         | | :  `- \`.;`\ _ /`;.`/ - ` : | |
//         \  \ `_.   \_ __\ /__ _/   .-` /  /
//     =====`-.____`.___ \_____/___.-`___.-'=====
//                       `=---='
//
//
//     ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//
//               佛祖保佑         永无BUG

//函数库

//计算mov
function movCompute(str, siz, dex, age = 30) {
  let mov = 8;
  if (str > siz && dex > siz) {
    mov = 9;
  } else {
    if (str < siz && dex < siz) {
      mov = 7;
    } else {
      mov = 8;
    }
  }
  if (age >= 40) {
    mov -= 1;
  }
  if (age >= 50) {
    mov -= 1;
  }
  if (age >= 60) {
    mov -= 1;
  }
  if (age >= 70) {
    mov -= 1;
  }
  if (age >= 80) {
    mov -= 1;
  }
  return mov;
}
//计算BUILD
function buildCompute(str, siz) {
  sum = str + siz;
  if (sum >= 2 && sum < 65) {
    build = -2;
  }
  if (sum >= 65 && sum < 85) {
    build = -1;
  }
  if (sum >= 85 && sum < 125) {
    build = 0;
  }
  if (sum >= 125 && sum < 165) {
    build = 1;
  }
  if (sum >= 165 && sum < 205) {
    build = 2;
  }
  if (sum >= 205) {
    let standard = 205;
    let delta = 0;
    do {
      standard += 80;
      delta++;
    } while (standard <= sum);
    build = 2 + delta;
  }
  return build;
}
//计算DB
function dbCompute(build) {
  let db = [0, 0]
  if (build < 1) {
    db[0] = build;
    db[1] = 1;
  }
  if (build === 1) {
    db[0] = build;
    db[1] = 4;
  }
  if (build > 1) {
    db[0] = build - 1;
    db[1] = 6;
  }
  return db;
  //db含义：伤害加值为`${db[0]}d${db[1]}`
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

//检定
const successdiscription = ["大失败", "失败", "成功", "困难成功", "极难成功", "大成功"]
//参数说明：检定规则，检定值，奖励/惩罚骰（奖励骰为正，惩罚骰为负），需求难度（successdiscription[]中对应的索引）
function Roll(ruleCOC, checkValue, BP = 0, difficulty = 1) {
  let geww = D(1, 10, 1, -1);
  let uiww = D(1, 10, 10, -1);
  n = Math.abs(BP);
  const Dice = [];
  if (geww + uiww !== 0) {
    Dice[0] = Number(geww + uiww)
  } else {
    Dice[0] = 100
  }
  let mindice = Dice[0]
  let maxdice = Dice[0]
  for (let i = 0; i < n; i++) {
    result = D(1, 10, 10, -1) + geww
    if (result === 0) {
      result = 100
    }
    mindice = Math.min(mindice, result)
    maxdice = Math.max(maxdice, result)
    //Dice.push(Number(result));
  }
  if (BP >= 0) {
    result = mindice
    //result = Math.min(Dice);
  } else {
    result = maxdice
    //result = Math.max(Dice);
  }
  let criticalSuccessValue, fumbleValue;
  if (ruleCOC === 0) {
    criticalSuccessValue = 1;
    if (checkValue >= 50) {
      fumbleValue = 100;
    } else {
      fumbleValue = 96;
    }
  }
  if (ruleCOC === 1) {
    if (checkValue >= 50) {
      criticalSuccessValue = 5;
    } else {
      criticalSuccessValue = 1;
    }
    if (checkValue >= 50) {
      fumbleValue = 100;
    } else {
      fumbleValue = 96;
    }
  }
  if (ruleCOC === 2) {
    if (checkValue >= 5) {
      criticalSuccessValue = 5;
    } else {
      criticalSuccessValue = checkValue;
    }
    if (checkValue >= 96) {
      fumbleValue = checkValue + 1;
      if (fumbleValue > 100) {
        fumbleValue = 100;
      } else {
        fumbleValue = 96;
      }
    }
  }
  if (ruleCOC === 3) {
    criticalSuccessValue = 5;
    fumbleValue === 96;
  }
  if (ruleCOC === 4) {
    oneOfTen = Math.floor(checkValue / 10);
    if (oneOfTen >= 5) {
      criticalSuccessValue = 5;
    } else {
      criticalSuccessValue = oneOfTen;
    }
    if (checkValue >= 50) {
      fumbleValue = 100;
    } else {
      fumbleValue = 96 + oneOfTen;
    }
  }
  if (ruleCOC === 5) {
    oneOfFive = Math.floor(checkValue / 5);
    if (oneOfFive >= 2) {
      criticalSuccessValue = 2;
    } else {
      criticalSuccessValue = oneOfFive
    }
    if (checkValue >= 50) {
      fumbleValue = 100;
    } else {
      fumbleValue = 96;
    }
  }
  if (result <= checkValue) {
    successRank = 2;
  } else {
    successRank = 1;
  }
  // 成功判定
  if (successRank == 2) {
    // 区分大成功、困难成功、极难成功等
    if (result <= checkValue / 2) {
      //suffix = "成功(困难)"
      successRank = 3;
    }
    if (result <= checkValue / 5) {
      //suffix = "成功(极难)"
      successRank = 4;
    }
    if (result <= criticalSuccessValue) {
      //suffix = "大成功！"
      successRank = 5;
    }
  }
  if (result >= fumbleValue) {
    //suffix = "大失败！"
    successRank = 0;
  }
  const rollResult = [result, checkValue, successRank];
  if (successRank > difficulty) {
    rollResult.push(1);
  } else {
    rollResult.push(0);
  }
  rollResult.push(`检定结果为: D100=${result}/${checkValue},${successdiscription[successRank]}`)
  return rollResult
}

//骰点字符串分解骰点器
//ndx
function dividedice(dicestring) {
  let dividedicenum = dicestring.split("d")
  return D(dividedicenum[0], dividedicenum[1])
}

function dividemut(dicestring) {
  let dividedicenum = dicestring.split("d")
  return dividedicenum[0] * dividedicenum[1]
}

//string-objectArray transformer （数据录入函数）
function parseUserData(input) {
  // 默认对象
  const standardObj = {
    '闪避': 25,
    '斗殴': 25,
    '手枪': 20,
    '弓': 15,
    '机枪': 10,
    '冲锋枪': 15,
    '步枪': 25,
    '火焰喷射器': 10,
    '重武器': 10,
    '斧': 15,
    '剑术': 20,
    '链锯': 10,
    '连枷': 10,
    '绞索': 15,
    '鞭': 5,
    '矛': 20,
    '投掷': 20,
    //0-邪神 1-人类 2-神话生物
    humanity: 1,
    //每回合攻击 atk per round
    apr: 1,
    //当前回合攻击次数 atk this round
    atr: 0,
    //当前回合受击次数 targeted this round
    ttr: 0,
    //追逐轮中的位置
    pos: 0,
    //追逐轮中的行动点
    acp: 0,
  };
  const defaultObj = {
    cname: '张三',
    str: 50,
    con: 50,
    siz: 65,
    dex: 50,
    '闪避': 25,
    '斗殴': 25,
    '手枪': 20,
    '弓': 15,
    '机枪': 10,
    '冲锋枪': 15,
    '步枪': 25,
    '火焰喷射器': 10,
    '重武器': 10,
    '斧': 15,
    '剑术': 20,
    '链锯': 10,
    '连枷': 10,
    '绞索': 15,
    '鞭': 5,
    '矛': 20,
    '投掷': 20,
    age: 30,
    //0-邪神 1-人类 2-神话生物
    humanity: 1,
    //每回合攻击 atk per round
    apr: 1,
    //当前回合攻击次数 atk this round
    atr: 0,
    //当前回合受击次数 targeted this round
    ttr: 0,
    //追逐轮中的位置
    pos: 0,
    //追逐轮中的行动点
    acp: 0,
  };

  // 分割输入数据按行处理
  const lines = input.split('\n');
  const result = [];

  for (const line of lines) {
    // 分割每行数据
    const parts = line.trim().split(' ');
    if (parts.length < 3) continue;
    // 创建默认对象
    const characteristics = { ...defaultObj };
    characteristics.cname = parts[0];
    // 处理HP属性
    let HPfinded = false;
    // 处理属性赋值
    for (let i = 1; i < parts.length; i += 2) {
      const key = parts[i];
      //如果这里没有给HP赋值，就在下面赋值
      if (key === "HP")
        HPfinded = true;
      const value = parseInt(parts[i + 1], 10);
      characteristics[key] = isNaN(value) ? parts[i + 1] : value; // 如果是数字则转换，否则保持原样
    }
    // 计算衍生属性
    characteristics.HPM = Math.floor((characteristics.con + characteristics.siz) / 10)
    if (!HPfinded)
      characteristics.HP = Math.floor((characteristics.con + characteristics.siz) / 10)
    if (characteristics.humanity === 1) {
      characteristics.MOV = movCompute(characteristics.str, characteristics.siz, characteristics.dex, characteristics.age);
    }
    characteristics.BUILD = buildCompute(characteristics.str, characteristics.siz);
    characteristics.DB = dbCompute(characteristics.BUILD);
    //人类技能下限校准
    if (characteristics.humanity) {
      for (const key in standardObj) {
        characteristics[key] <= standardObj[key] ? characteristics[key] = standardObj[key] : characteristics[key];
      }
      if (characteristics['闪避'] <= 25) {
        characteristics['闪避'] = Math.floor(characteristics.dex / 2) - 1;
      }
    }
    result.push(characteristics);
  }

  return result;
};

//objectArray-string transformer（数据回传函数）
function antiParseUserData(objectArrayInput = []) {
  let oatext = ''
  for (let i = 0; i < objectArrayInput.length; i++) {
    oatext += '\n'
    oatext += objectArrayInput[i].cname + ' ';
    for (const key in objectArrayInput[i]) {
      if (key !== `cname`) {
        oatext += key + ' ' + objectArrayInput[i][key] + ' ';
      }
    }
  }
  return oatext
}

//地图转换函数
/*
地图字符串格式：
起始位置 结束位置
玩家数量n
玩家1 位置1
玩家2 位置2
………………
玩家n 位置n
险境数量n
险境1 位置1
险境2 位置2
………………
险境n 位置n
*/
function mapStrToObj(mapstr) {
  let strpart = mapstr.split("\n");
  let plnums = Number(strpart[1])
  let hanums = Number(strpart[2 + plnums])
  const map = {
    mapbegin: Number(strpart[0].split(" ")[0]),
    mapend: Number(strpart[0].split(" ")[1]),
    playernum: plnums,
    hazardnum: hanums,
  };
  const players = [];
  const hazards = [];

  for (let i = 2; i < 2 + map.playernum; i++) {
    players.push({
      cname: strpart[i].split(" ")[0],
      pos: Number(strpart[i].split(" ")[1]),
    });
  }
  for (let i = 3 + map.playernum; i < 3 + map.playernum + map.hazardnum; i++) {
    hazards.push({
      hname: strpart[i].split(" ")[0],
      pos: Number(strpart[i].split(" ")[1]),
      skill: strpart[i].split(" ")[2],
      diff: Number(strpart[i].split(" ")[3]),
    });
  }

  map.players = players;
  map.hazards = hazards;
  return map;
}

function mapObjTOStr(mapobj) {
  let str = "";
  str += `${mapobj.mapbegin} ${mapobj.mapend}\n`;
  str += `${mapobj.playernum}\n`;
  for (let i = 0; i < mapobj.players.length; i++) {
    str += `${mapobj.players[i].cname} ${mapobj.players[i].pos}\n`;
  }
  str += `${mapobj.hazardnum}\n`;
  for (let i = 0; i < mapobj.hazards.length; i++) {
    str += `${mapobj.hazards[i].hname} ${mapobj.hazards[i].pos} ${mapobj.hazards[i].skill} ${[mapobj.hazards[i].diff]}\n`;
  }
  return str;
}

function mapObjToChart(mapobj) {
  let chart = ""
  let begin = mapobj.mapbegin
  let end = mapobj.mapend
  //第一行：数据
  let line1 = `|`
  for (let i = begin; i < end; i++) {
    line1 += `${i}| |`
  }
  line1 += `${end}|\n`

  //第二行：险境（需保证每个位置只有1个险境，险境的位置用其左侧的数表示）
  let line2 = `|`
  for (let i = begin; i < end; i++) {
    let hazardthis = " "
    for (let j = 0; j < mapobj.hazards.length; j++) {
      if (mapobj.hazards[j].pos === i)
        hazardthis = mapobj.hazards[j].hname
    }
    line2 += ` |${hazardthis}|`
  }
  line2 += ` |\n`

  // //第三行开始是角色
  let linech = ""
  let arrpl = []
  let maxsize = 0
  for (let i = begin; i <= end; i++) {
    let arrpli = []
    let sizei = 0
    for (let j = 0; j < mapobj.playernum; j++) {
      if (mapobj.players[j].pos === i) {
        arrpli.push(mapobj.players[j].cname)
        sizei++
      }
    }
    arrpl.push(arrpli)
    maxsize = Math.max(maxsize, sizei)
  }
  for (let i = 0; i < maxsize; i++) {
    for (let j = 0; j <= end - begin; j++) {
      let block
      if (arrpl[j][i] === undefined)
        block = " "
      else
        block = arrpl[j][i]
      linech += `|${block}|`
    }
    linech += `\n`
  }

  //返回表格字符串
  chart = line1 + line2 + linech
  return chart
}

function mapCheck(mapobj) {
  let l = 0x3f3f3f3f, r = -0x3f3f3f3f, sumpl = 0, sumhaz = 0;
  for (let i = 0; i < mapobj.players.length; i++) {
    if (l > mapobj.players[i].pos)
      l = mapobj.players[i].pos
    if (r < mapobj.players[i].pos)
      r = mapobj.players[i].pos
    sumpl++;
  }
  for (let i = 0; i < mapobj.hazards.length; i++) {
    if (l > mapobj.hazards[i].pos)
      l = mapobj.hazards[i].pos
    if (r < mapobj.hazards[i].pos + 1)
      r = mapobj.hazards[i].pos + 1
    sumhaz++;
  }
  mapobj.mapbegin = l;
  mapobj.mapend = r;
  mapobj.playernum = sumpl;
  mapobj.hazardnum = sumhaz;
  return mapobj;
}

// 普通排序
function qsort(data) {
  data.sort(function cmp(a, b) {
    if (a.dex === b.dex)
      return b.斗殴 - a.斗殴;
    return b.dex - a.dex;
  })
}

//首位突袭的情况
function sfind(data, point = "") {
  let pointpart = []
  // qsort(data, 0, data.length - 1)
  for (let i = 0; i < data.length; i++) {
    if (data[i].cname === point) {
      pointpart.push(data[i]);
    }
  }
  for (let i = 0; i < data.length; i++) {
    pointpart.push(data[i]);
  }
  return pointpart;
}

//使用先攻检定的行动排序
function qsortRoll(data) {
  let dex, dice;
  for (let i = 0; i < data.length; i++) {
    dex = data[i].dex;
    dice = Roll(2, dex);
    data[i].检定结果 = dice;
    data[i].检定结果文本 = dice[4];
  }
  data.sort(function cmp(a, b) {
    if (b.检定结果[2] === a.检定结果[2]) {
      if (b.dex === a.dex) {
        return b.斗殴 - a.斗殴;
      }
      return b.dex - a.dex;
    }
    return b.检定结果[2] - a.检定结果[2];
  })
}

//排序结果
function ranks(arr) {
  let rankList = "\n";
  for (let i = 0; i < arr.length; i++) {
    rankList += arr[i].cname + "    hp：" + arr[i].HP + "/" + arr[i].HPM + "\n";
    rankList += "敏捷：" + arr[i].dex + "    力量：" + arr[i].str + "    体型：" + arr[i].siz + "\n";
    rankList += "体格：" + arr[i].BUILD + "    db：" + arr[i].DB[0];
    if (arr[i].DB[1] !== 1) rankList += "d" + arr[i].DB[1];
    rankList += "\n" + "斗殴：" + arr[i].斗殴 + "    闪避：" + arr[i].闪避 + "    手枪：" + arr[i].手枪 + "\n==========================\n";
  }
  return rankList;
}

//排序结果（先攻）
function ranksRoll(arr) {
  let rankList = "\n";
  for (let i = 0; i < arr.length; i++) {
    rankList += arr[i].cname + "    hp：" + arr[i].HP + "/" + arr[i].HPM + "\n";
    rankList += "敏捷：" + arr[i].dex + "    力量：" + arr[i].str + "    体型：" + arr[i].siz + "\n";
    rankList += "体格：" + arr[i].BUILD + "    db：" + arr[i].DB[0];
    if (arr[i].DB[1] !== 1) rankList += "d" + arr[i].DB[1];
    rankList += "\n" + "斗殴：" + arr[i].斗殴 + "    闪避：" + arr[i].闪避 + "    手枪：" + arr[i].手枪 + "\n敏捷检定：" + arr[i].检定结果文本 + "\n==========================\n";
  }
  return rankList;
}

//轻量简化排序输出
function simple_ranks(arr) {
  let rankList = "";
  for (let i = 0; i < arr.length; i++) {
    //rankList += "\n" + arr[i].cname + "    敏捷：" + arr[i].dex + "    斗殴：" + arr[i].斗殴;
    rankList += `\n${arr[i].cname}    HP：${arr[i].HP}/${arr[i].HPM}    敏捷：${arr[i].dex}    斗殴：${arr[i].斗殴}`
  }
  return rankList;
}

//轻量简化排序输出(先攻)
function simple_ranksRoll(arr) {
  let rankList = "";
  const successdiscription = ["大失败", "失败", "成功", "困难成功", "极难成功", "大成功"];
  for (let i = 0; i < arr.length; i++) {
    successRank = successdiscription[arr[i].检定结果[2]];
    rankList += "\n" + arr[i].cname + "    HP：" + arr[i].HP + "/" + arr[i].HPM + "    敏捷：" + arr[i].dex + "    检定结果：" + successRank + "    斗殴：" + arr[i].斗殴;
  }
  return rankList;
}

//单位列表
function list(arr) {
  let cnameList = "\n";
  for (let i = 0; i < arr.length; i++) {
    cnameList += arr[i].cname + "\n";
  }
  return cnameList;
}

// 修复后的伤害计算函数 感谢AI的大力debug
function damagecal(damagestring, db, successrank = 2) {
  let throughout = 0;
  if (damagestring.includes('*')) { // 使用正确的转义字符
    throughout = 1;
  }
  // 移除字符串中的'*'符号以方便计算
  let damagetext = damagestring.replace(/\*/g, ''); // 使用正则表达式替换

  let damageparts = damagetext.split('+'); // 更改变量名为damageparts以避免与循环变量混淆
  let totalDamage = 0;

  for (let i = 0; i < damageparts.length; i++) {
    let partDamage = 0;
    let damagePart = damageparts[i].split('-');

    if (damagePart[0] === 'db') {
      if (successrank < 4) {
        partDamage += Number(D(db[0], db[1]));
      } else {
        if (throughout === 0) {
          partDamage += Number(db[0] * db[1]);
        } else {
          partDamage += Number(db[0] * db[1]) + Number(D(db[0], db[1]));
        }
      }
    } else if (damagePart[0] === '半db') {
      if (successrank < 4) {
        partDamage += Math.floor(Number(D(db[0], db[1])) / 2);
      } else {
        if (throughout === 0) {
          partDamage += Math.floor(Number(db[0] * db[1]) / 2);
        } else {
          partDamage += Math.floor((Number(db[0] * db[1]) + Number(D(db[0], db[1]))) / 2);
        }
      }
    } else if (!isNaN(damagePart[0]) && damagePart[0] >= 0 && damagePart[0] <= 100) { // 添加缺失的条件判断开始括号，并处理数字直接伤害
      partDamage += Number(damagePart[0]);
    } else if (damagePart[0].includes('d')) {
      let diceParts = damagePart[0].split('d');
      diceParts[0] = Number(diceParts[0]);
      diceParts[1] = Number(diceParts[1]);

      if (successrank < 4) {
        partDamage += Number(D(diceParts[0], diceParts[1]));
      } else {
        if (throughout === 0) {
          partDamage += Number(diceParts[0] * diceParts[1]);
        } else {
          partDamage += Number(diceParts[0] * diceParts[1]) + Number(D(diceParts[0], diceParts[1]));
        }
      }
    }

    // 应用减伤部分
    for (let j = 1; j < damagePart.length; j++) {
      partDamage -= Number(damagePart[j]);
    }

    totalDamage += partDamage;
  }

  // 确保总伤害不为负数
  if (totalDamage < 0) {
    totalDamage = 0;
  }

  return totalDamage;
}

// // 引入marked和html2canvas库
// import marked from 'marked'
// import html2canvas from 'html2canvas'

// // 定义一个异步函数，用于将Markdown文本转换为图片
// async function markdownToImage(markdownContent) {
//   // 第一步：使用marked将Markdown文本转换为HTML
//   const html = marked(markdownContent);

//   // 第二步：使用html2canvas将生成的HTML渲染到canvas上
//   const canvas = await html2canvas(html, {
//     logging: true,          // 开启日志记录
//     allowTaint: true,       // 允许canvas被污染，这对于跨域图像很重要
//     useCORS: true           // 使用CORS来加载跨源图像
//   });

//   // 第三步：从canvas生成图片数据URL
//   const imageDataUrl = canvas.toDataURL();

//   // 返回生成的图片数据URL
//   return imageDataUrl;
// }

//============================================================================================//

// 首先检查是否已经存在
let ext = seal.ext.find('Combat&Chases Assist System');
if (!ext) {
  // 不存在，那么建立扩展，名为，作者“”，版本1.0.0
  ext = seal.ext.new('Combat&Chases Assist System', '社亦园 冰红茶', '0.2.5');
  // 注册扩展
  seal.ext.register(ext);
}
//============================================================================================//

//NPC 数据录入
let arrCharacter = []
const cmdSetNpc = seal.ext.newCmdItemInfo();
cmdSetNpc.name = 'setnpc'; // 指令名字，可用中文
cmdSetNpc.help = '功能：批量添加NPC（非玩家角色）至战斗或追逐中。\n使用格式：\n.setnpc [NPC数量]\n /NPC名称1 属性1 属性2 ... \n/NPC名称2 ...\n参数说明：\n[NPC数量]：1到20的整数，表示要添加的NPC数量。\n/NPC名称 属性...：每组NPC信息间以 / 分隔，信息内属性用空格分隔。最后一个NPC信息后可省略结尾的 /';
cmdSetNpc.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      let inputcount = 1;
      if (val >= 1 && val <= 20) {
        let input = '';
        let transfer = "";
        input = cmdArgs.getArgN(++inputcount);
        while (val--) {
          if (input === '/') {
            input = cmdArgs.getArgN(++inputcount);
            while (input !== '/' && input !== "") {
              transfer += input;
              transfer += " ";
              input = cmdArgs.getArgN(++inputcount);
            }
            transfer += "\n";
          }
        }
        let CCCharactersNew = parseUserData(transfer);
        let transferTemp = seal.vars.strGet(ctx, `$gCCAS单位数据录入`);
        transfer += '\n' + transferTemp[0];
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, transfer);
        let CCCharacters = parseUserData(transfer);
        console.log(transfer);
        seal.replyToSender(ctx, msg, `录入成功，${CCCharactersNew.length}名NPC已加入本次战斗。本次战斗目前共有${CCCharacters.length}名参与者。`);
        return seal.ext.newCmdExecuteResult(true);
      } else {
        seal.replyToSender(ctx, msg, `指令错误，请使用“help”查看正确指令。`)
      }
    }
  };
}
// 将命令注册到扩展中
ext.cmdMap['setnpc'] = cmdSetNpc;

//============================================================================================//

//指定NPC数据删除
const cmdDeleteNPC = seal.ext.newCmdItemInfo();
cmdDeleteNPC.name = 'deletenpc'; // 指令名字，可用中文
cmdDeleteNPC.help = `删除指定数量的单位（1到20之间）:
.deletenpc 数量 单位名称1 单位名称2 ...单位名称N
其中“数量”是一个1到20之间的整数，后面可以跟多个单位名称，每个名称之间以空格分隔。例如，删除3个单位：
.deletenpc 3 单位A 单位B 单位C
或者，如果只删除一个特定单位，且该单位名称中不含空格，可以直接输入单位名称作为第一个参数：单位名称
例如，仅删除一个名为“单位D”的单位：
.deletenpc 单位D`
cmdDeleteNPC.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if ((val >= 1 && val <= 20) || cmdArgs.getArgN(2) === "") {
        //确认要删去的单位的数量与名称
        let inputcount = 1;
        const bin = []
        if (val >= 1 && val <= 20) {
          for (let putnum = 0; putnum < val; putnum++) {
            let input = cmdArgs.getArgN(++inputcount)
            bin.push(input)
          }
        }
        else {
          bin.push(val)
        }
        //从线上读取已储存的参战单位数据到本地
        let textOL = seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]
        let pls = parseUserData(textOL)
        let backtext = textOL.trim().split("\n")
        const leavetext = []
        for (let plnum = 0; plnum < pls.length; plnum++) {
          let leaveline = 1
          for (let binnum = 0; binnum < bin.length; binnum++) {
            if (pls[plnum].cname === bin[binnum]) {
              leaveline = 0
            }
          }
          leavetext.push(leaveline)
        }
        let transtext = ""
        for (let plnum = 0; plnum < pls.length; plnum++) {
          if (leavetext[plnum]) {
            transtext += pls[plnum].cname + ` `
            for (var key in pls[plnum]) {
              transtext += key + ` ` + pls[plnum][key] + ` `
            }
            transtext += `\n`
          }
        }
        let textNew = transtext;
        // combat new
        const sora = [];
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, JSON.stringify(sora))
        // setnpc
        //textNew += "\n" + "\n[]";
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, textNew);
        seal.replyToSender(ctx, msg, `已删除${bin}共${bin.length}名NPC`)
        return seal.ext.newCmdExecuteResult(true);
      }
      else {
        seal.replyToSender(ctx, msg, `指令错误，请使用“help”查看正确指令。`);
      }
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['deletenpc'] = cmdDeleteNPC;

//============================================================================================//

//单点属性修改
//.modify player attribute value
//.modify map player/hazard pos
const cmdModify = seal.ext.newCmdItemInfo();
cmdModify.name = 'modify'; // 指令名字，可用中文
cmdModify.help = `.modify指令用于修改npc属性
输入格式：.modify 单位名称 属性名称 属性值
特别注意：体格，DB，最大生命值无法修改，修改生命值时属性名称请填写HP（大写）
修改其他基础属性时请填写属性的英文简称（例如力量是str）（小写）
（如果不满可以@开发者催更）`;
cmdModify.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if (val === "map")
      {
        let mapobj = mapCheck(mapStrToObj(seal.vars.strGet(ctx, `$gChaseMap`)[0]))
        let xname = cmdArgs.getArgN(2);
        let pos = cmdArgs.getArgN(3);
        for (let i = 0; i < mapobj.playernum; i++)
        {
          if (mapobj.players[i].cname === xname)
          {
            mapobj.players[i].pos = pos;
          }
        }
        for (let i = 0; i < mapobj.hazardnum; i++)
        {
          if (mapobj.hazards[i].hname === xname)
          {
            mapobj.hazards[i].pos = pos;
          }
        }
        seal.vars.strSet(ctx, `$gChaseMap`, mapObjTOStr(mapobj))
        seal.replyToSender(ctx, msg, `${xname}的位置已修改为${pos}`)
      } else {
        let plname = cmdArgs.getArgN(1)
        let plskill = cmdArgs.getArgN(2)
        let plvalue = cmdArgs.getArgN(3)
        let textOL = seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]
        let pls = parseUserData(textOL)
        for (let plnum = 0; plnum < pls.length; plnum++) {
          if (pls[plnum].cname === plname) {
            pls[plnum][plskill] = plvalue
          }
        }
        let transtext = ""
        for (let plnum = 0; plnum < pls.length; plnum++) {
          transtext += pls[plnum].cname + ` `
          for (var key in pls[plnum]) {
            transtext += key + ` ` + pls[plnum][key] + ` `
          }
          transtext += `\n`
        }
        let textNew = transtext;
        // combat new
        const sora = [];
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, JSON.stringify(sora))
        // setnpc
        // textNew += "\n" + "\n[]";
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, textNew);
        seal.replyToSender(ctx, msg, `${plname}的属性${plskill}已修改为${plvalue}`)
      }
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['modify'] = cmdModify;

//============================================================================================//
const cmdClear = seal.ext.newCmdItemInfo();
cmdClear.name = 'ccasclear'; // 指令名字，可用中文
cmdClear.help = '';
cmdClear.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      const sora = [];
      seal.vars.strSet(ctx, `$gCCAS单位数据录入`, JSON.stringify(sora));
      seal.replyToSender(ctx, msg, `数据已清空`);
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['ccasclear'] = cmdClear;
//============================================================================================//

//设置默认战斗规则
let ruleCombat = 1
//规则设置指令
const cmdCombat = seal.ext.newCmdItemInfo();
cmdCombat.name = 'combat'; // 指令名字，可用中文
cmdCombat.help = `a. 设置战斗规则
格式: .combat < 规则编号 >
描述: 更改当前战斗规则。规则编号必须是1至3之间的整数，每个编号代表一种不同的战斗规则配置:
       1: 直接依照敏捷排序
       2: 含有先发制人（突袭）的战斗排序，参考setnpc与setpc指令
       3: 含有先攻检定的战斗排序
       
       b.排序行动顺序
       格式: .combat rank
       描述: 根据当前存储的参战单位数据，自动排序并显示行动顺序。
       
       c.列出参战单位
       格式: .combat list
       描述: 列出所有已加入战斗的单位列表。`
cmdCombat.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if (val >= 1 && val <= 3) {

        ruleCombat = val;
        seal.replyToSender(ctx, msg, `战斗规则${ruleCombat}已启用。`);
        seal.vars.strSet(ctx, '$gCCAS战斗规则录入', val);
      } else {
        if (val === 'new') {
          let combatRound = 1
          seal.vars.intSet(ctx, '$gCombatRound', combatRound)
          seal.replyToSender(ctx, msg, `新的战斗已开启，当前回合数：1`);
          for (let i = 0; i < CCCharacters.length; i++) {
            CCCharacters[i].tpr = 0
          }
        } else {
          if (val === '++' || val === '+') {
            seal.vars.intGet(ctx, '$gCombatRound')
            let CCCharacters = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]);
            for (let i = 0; i < CCCharacters.length; i++) {
              CCCharacters[i].ttr = 0
              CCCharacters[i].atr = 0
            }
          } else {
            if (val === 'rank') {
              let rankCCCharacters = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]);
              let ranktype = JSON.parse(seal.vars.strGet(ctx, '$gCCAS战斗规则录入')[0]);
              let ruleCOC = ctx.group.cocRuleIndex;
              let rank_method = cmdArgs.getArgN(2);
              if (ranktype === 3) {
                qsortRoll(rankCCCharacters, 0, rankCCCharacters.length - 1);
                let resultRank;
                if (rank_method === "simple") {
                  resultRank = simple_ranksRoll(rankCCCharacters);
                }
                else {
                  resultRank = ranksRoll(rankCCCharacters);
                }
                seal.replyToSender(ctx, msg, `行动顺序：\n${resultRank}`);
              }
              else if (ranktype === 1 || rank_method === "simple" || rank_method === "") {
                qsort(rankCCCharacters, 0, rankCCCharacters.length - 1);
                let resultRank;
                if (rank_method === "simple") {
                  resultRank = simple_ranks(rankCCCharacters);
                }
                else {
                  resultRank = ranks(rankCCCharacters);
                }
                seal.vars.strSet(ctx, `$g当前排序`, resultRank)
                seal.replyToSender(ctx, msg, `行动顺序：\n${resultRank}`);
              }
              // 带突袭的检定，格式为.combat rank 张三(cname) 50(成功率)
              else if (ranktype === 2) {
                if (rank_method >= 1 && rank_method <= 20) {
                  let inputcount = 2;
                  let membercount = rank_method;
                  let checklist = "";
                  qsort(rankCCCharacters, 0, rankCCCharacters.length - 1);
                  while (1) {
                    let nowinput = cmdArgs.getArgN(++inputcount);
                    if (nowinput === "" || nowinput === "simple") {
                      rank_method = nowinput;
                      break;
                    }
                    else {
                      let checkname = nowinput;
                      let checkpossiblity;
                      if (cmdArgs.getArgN(inputcount + 1) >= 1 && cmdArgs.getArgN(inputcount + 1) <= 100)
                        checkpossiblity = cmdArgs.getArgN(++inputcount);
                      else
                        checkpossiblity = 100;
                      let checkrollresult = Roll(ruleCOC, checkpossiblity);
                      checklist += `${checkname}的突袭检定结果${checkrollresult[0]}/${checkrollresult[1]}${successdiscription[checkrollresult[2]]}\n`;
                      if (checkrollresult[3] === 1) {
                        rankCCCharacters = sfind(rankCCCharacters, checkname);
                      }
                    }
                  }
                  if (rank_method === "simple")
                    resultRank = simple_ranks(rankCCCharacters);
                  else
                    resultRank = ranks(rankCCCharacters);
                  seal.vars.strSet(ctx, `$g当前排序`, resultRank)
                  seal.replyToSender(ctx, msg, `${checklist}行动顺序：\n${resultRank}`);
                }
                else {
                  let sup_name = cmdArgs.getArgN(2);
                  let sup_rate = cmdArgs.getArgN(3);
                  rank_method = cmdArgs.getArgN(3);
                  if (sup_rate === "" || rank_method === "simple")
                    sup_rate = 100;
                  if (rank_method !== "simple")
                    rank_method = cmdArgs.getArgN(4);
                  let sup_level = Roll(ruleCOC, sup_rate);
                  if (sup_level[3] === 0) {
                    //失败
                    qsort(rankCCCharacters, 0, rankCCCharacters.length - 1);
                    let resultRank;
                    if (rank_method === "simple")
                      resultRank = simple_ranks(rankCCCharacters);
                    else
                      resultRank = ranks(rankCCCharacters);
                    seal.replyToSender(ctx, msg, `突袭检定${sup_level[0]}\/${sup_level[1]}${successdiscription[sup_level[2]]}\n行动顺序：\n${resultRank}`);
                  }
                  else {
                    //成功
                    qsort(rankCCCharacters, 0, rankCCCharacters.length - 1);
                    rankCCCharacters = sfind(rankCCCharacters, sup_name);
                    let resultRank;
                    if (rank_method === "simple")
                      resultRank = simple_ranks(rankCCCharacters);
                    else
                      resultRank = ranks(rankCCCharacters);
                    seal.vars.strSet(ctx, `$g当前排序`, resultRank)
                    seal.replyToSender(ctx, msg, `突袭检定${sup_level[0]}\/${sup_level[1]}${successdiscription[sup_level[2]]}\n行动顺序：\n${resultRank}`);
                  }
                }
              }
            } else {
              if (val == 'list') {
                let rankCCCharacters = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]);
                let resultList = list(rankCCCharacters);
                seal.replyToSender(ctx, msg, `参战单位列表：\n${resultList}`);
              } else {
                seal.replyToSender(ctx, msg, `指令错误，请使用“help”查看正确指令。`);
              }
            }
          }
        }
      }
    }
      return seal.ext.newCmdExecuteResult(true);
  }
}
  ;
// 将命令注册到扩展中
ext.cmdMap['combat'] = cmdCombat;

//============================================================================================//

// const cmdChase = seal.ext.newCmdItemInfo();
// cmdChase.name = 'chase'; // 指令名字，可用中文
// cmdChase.help = '';
// cmdChase.solve = (ctx, msg, cmdArgs) => {
//   let val = cmdArgs.getArgN(1);
//   switch (val) {
//     case 'help': {
//       const ret = seal.ext.newCmdExecuteResult(true);
//       ret.showHelp = true;
//       return ret;
//     }
//     default: {
//       if (val === 'new') {
//         let combatRound = 1
//         seal.vars.intSet(ctx, '$gCombatRound', combatRound)
//         seal.replyToSender(ctx, msg, `新的追逐已开启，当前回合数：1`);
//         for (let i = 0; i < CCCharacters.length; i++) {
//           CCCharacters[i].ttr = 0
//         }
//       } else if (val === '++' || val === '+' || val === 'next') {
//         seal.vars.intGet(ctx, '$gCombatRound')
//         let CCCharacters = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]);
//         for (let i = 0; i < CCCharacters.length; i++) {
//           CCCharacters[i].ttr = 0
//           CCCharacters[i].atr = 0
//         }
//       } else if (val === 'rank') {
//         let rankCCCharacters = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]);
//         let ruleCOC = ctx.group.cocRuleIndex;
//         let rank_method = cmdArgs.getArgN(2);
//         qsortRoll(rankCCCharacters, 0, rankCCCharacters.length - 1);
//         let resultRank;
//         if (rank_method === "simple") {
//           resultRank = simple_ranksRoll(rankCCCharacters);
//         }
//         else {
//           resultRank = ranksRoll(rankCCCharacters);
//         }
//         seal.vars.strSet(ctx, `$g当前排序`, resultRank)
//         seal.replyToSender(ctx, msg, `行动顺序：\n${resultRank}`);
//       } else if (val == 'list') {
//         let rankCCCharacters = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]);
//         let resultList = list(rankCCCharacters);
//         seal.replyToSender(ctx, msg, `参战单位列表：\n${resultList}`);
//       } else {
//         seal.replyToSender(ctx, msg, `指令错误，请使用“help”查看正确指令。`);
//       }

//       return seal.ext.newCmdExecuteResult(true);
//     }
//   }
// };
// // 将命令注册到扩展中
// ext.cmdMap['chase'] = cmdChase;

//============================================================================================//

const cmdJoin = seal.ext.newCmdItemInfo();
cmdJoin.name = 'join'; // 指令名字，可用中文
cmdJoin.help = '';
cmdJoin.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      //获取pc数据
      const pc = {}
      pc.cname = ctx.player.name;
      pc.str = seal.vars.intGet(ctx, `力量`)[0];
      pc.con = seal.vars.intGet(ctx, `体质`)[0];
      pc.siz = seal.vars.intGet(ctx, `体型`)[0];
      pc.dex = seal.vars.intGet(ctx, `敏捷`)[0];
      pc.闪避 = seal.vars.intGet(ctx, `闪避`)[0];
      pc.斗殴 = seal.vars.intGet(ctx, `斗殴`)[0];
      pc.斧 = seal.vars.intGet(ctx, `斧`)[0];
      pc.剑术 = seal.vars.intGet(ctx, `剑术`)[0];
      pc.矛 = seal.vars.intGet(ctx, `矛`)[0];
      pc.绞索 = seal.vars.intGet(ctx, `绞索`)[0];
      pc.鞭 = seal.vars.intGet(ctx, `鞭`)[0];
      pc.连枷 = seal.vars.intGet(ctx, `连枷`)[0];
      pc.链锯 = seal.vars.intGet(ctx, `链锯`)[0];
      pc.手枪 = seal.vars.intGet(ctx, `手枪`)[0];
      pc.步枪 = seal.vars.intGet(ctx, `步枪`)[0];
      pc.弓 = seal.vars.intGet(ctx, `弓`)[0];
      pc.机枪 = seal.vars.intGet(ctx, `机枪`)[0];
      pc.重武器 = seal.vars.intGet(ctx, `重武器`)[0];
      pc.火焰喷射器 = seal.vars.intGet(ctx, `火焰喷射器`)[0];
      pc.冲锋枪 = seal.vars.intGet(ctx, `冲锋枪`)[0];
      pc.投掷 = seal.vars.intGet(ctx, `投掷`)[0];
      pc.age = seal.vars.intGet(ctx, `年龄`)[0];
      let CCCharacters = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]);
      CCCharacters.push(pc)
      seal.vars.strSet(ctx, `$gCCAS单位数据录入`, antiParseUserData(CCCharacters));
      seal.replyToSender(ctx, msg, `录入成功，${ctx.player.name}已加入本次战斗。本次战斗目前共有${CCCharacters.length}名参与者。`);
    }
      return seal.ext.newCmdExecuteResult(true);
  }
};
// 将命令注册到扩展中
ext.cmdMap['join'] = cmdJoin;
//============================================================================================//

//伤害计算
//.atk # atker skill damege aim1 infect aim2 infect aim3 infect etc.
//.atk % atker skill damege aim1 aim2 aim3 etc.
//.atk skill damege aim1 infect aim2 infect aim3 infect etc.
const cmdAtk = seal.ext.newCmdItemInfo();
cmdAtk.name = 'atk'; // 指令名字，可用中文
cmdAtk.help = `.atk指令可用于计算伤害
  使用方法：.atk 模式 攻击者 技能 伤害 攻击目标1 攻击目标2 攻击目标3 etc.

  模式为\`#\`时，攻击目标可以闪避或反击，此时填写的攻击目标部分应形如\`张三 闪避\`或\`张三 反击 1d4\`
  此处使用反击默认对对方斗殴技能进行检定，可填写技能名称以更改所用技能，如\`张三 手枪 1d8\`
  模式为\`%\`时，攻击目标无法闪避或反击，此时填写的攻击目标部分应只包含攻击目标的名字
  除此之外，当不填写模式时，指令将变为.atk 技能 伤害 攻击目标1 攻击目标2 攻击目标3 etc.
  此时将把指令发出者作为攻击者，除此之外的部分和模式\`#\`一致
  
  描述贯穿伤害时，请在伤害串中加入\`\*\`号，例如\`\*1d4+db\`
  需要奖励\/惩罚骰时，请在攻击者/攻击目标的名字上加上+\/-号，例如\`张三+\``;
cmdAtk.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if (val === '#') {
        // # 标记 受击方允许反击/闪避，适用于斗殴等
        // % 标记 受击方无法反击/闪避，适用于射击等(还没写)
        let atkername = cmdArgs.getArgN(2)
        let atkerskill = cmdArgs.getArgN(3)
        let atkerdamage = cmdArgs.getArgN(4)
        let atkerbp = 0
        atkerbp = (atkername.match(/\+/g) || []).length - (atkername.match(/-/g) || []).length;
        atkername = atkername.replace(/[+-]/g, '');
        const aim = []
        const infect = []
        const conteratk = []
        const aimbp = []
        let inputcount = 4
        let inputpl = cmdArgs.getArgN(++inputcount)
        while (inputpl !== "") {
          let inputinfect = cmdArgs.getArgN(++inputcount)
          aim.push(inputpl)
          infect.push(inputinfect)
          if (inputinfect !== "闪避") {
            inputconter = cmdArgs.getArgN(++inputcount)
            conteratk.push(inputconter)
          }
          else {
            conteratk.push(0)
          }
          inputpl = cmdArgs.getArgN(++inputcount)
        }
        for (let i = 0; i < aim.length; i++) {
          aimbp.push((aim[i].match(/\+/g) || []).length - (aim[i].match(/-/g) || []).length)
          aim[i] = aim[i].replace(/[+-]/g, '')
        }
        let combatpldata = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        let ruleCOC = ctx.group.cocRuleIndex
        //暴力O(n^3)算法，直接遍历找到攻击者和反击者，或许可以优化成二分O(n*logn*logn)但我不会
        for (let atkerfinder = 0; atkerfinder < combatpldata.length; atkerfinder++) {
          if (combatpldata[atkerfinder].cname === atkername) {
            let atkerskilldata = combatpldata[atkerfinder][atkerskill];
            let atkreply = ""
            //骰点在这里
            let atkerroll = Roll(ruleCOC, atkerskilldata, atkerbp)
            //for (let aimfinder = 0; aimfinder < combatpldata.length; aimfinder++) {
            for (let aimerfinder = 0; aimerfinder < aim.length; aimerfinder++) {
              //for (let aimerfinder = 0; aimerfinder < aim.length; aimerfinder++) {
              for (let aimfinder = 0; aimfinder < combatpldata.length; aimfinder++) {

                if (combatpldata[aimfinder].cname === aim[aimerfinder]) {
                  if (infect[aimerfinder] === "闪避") {
                    //骰闪避
                    let aimerroll = Roll(ruleCOC, combatpldata[aimfinder].闪避, aimbp[aimerfinder])
                    if (atkerroll[2] > aimerroll[2] && atkerroll[2] >= 2) {
                      //闪避失败，计算伤害(贯穿写了)
                      let totaldamage = Number(damagecal(atkerdamage, combatpldata[atkerfinder].DB, atkerroll[2]))

                      combatpldata[aimfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的闪避${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},闪避失败，受到伤害${totaldamage}\n`
                      if (combatpldata[aimfinder].HP < 0) {
                        combatpldata[aimfinder].HP = 0
                        atkreply += `${aim[aimerfinder]}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[aimfinder].HPM) {
                        if (combatpldata[aimfinder].HP === 0)
                          atkreply += `${aim[aimerfinder]}受到重伤且生命值为0，陷入濒死状态\n`
                        else {
                          //重伤判定是否昏迷
                          let aimerconroll = Roll(ruleCOC, combatpldata[aimfinder].con)
                          if (aimerconroll[2] >= 2)
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},陷入昏迷`
                        }
                      }
                      atkreply += `\n`
                    }
                    else {
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的闪避${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},闪避成功\n\n`
                    }
                  }
                  else if (infect[aimerfinder] === "反击") {
                    //骰反击
                    let aimerroll = Roll(ruleCOC, combatpldata[aimfinder].斗殴, aimbp[aimerfinder])
                    if (atkerroll[2] >= aimerroll[2] && atkerroll[2] >= 2) {
                      //反击失败，效果和闪避一样
                      let totaldamage = Number(damagecal(atkerdamage, combatpldata[atkerfinder].DB, atkerroll[2]))

                      combatpldata[aimfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击失败，受到伤害${totaldamage}\n`
                      if (combatpldata[aimfinder].HP < 0) {
                        combatpldata[aimfinder].HP = 0
                        atkreply += `${aim[aimerfinder]}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[aimfinder].HPM) {
                        if (combatpldata[aimfinder].HP === 0)
                          atkreply += `${aim[aimerfinder]}受到重伤且生命值为0，陷入濒死状态`
                        else {
                          //重伤判定是否昏迷
                          let aimerconroll = Roll(ruleCOC, combatpldata[aimfinder].con)
                          if (aimerconroll[2] >= 2)
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},陷入昏迷`
                        }
                        atkreply += `\n`
                      }
                      atkreply += `\n`
                      // 此时反击未触发
                    }
                    else if (atkerroll[2] <= aimerroll[2] && aimerroll[2] >= 2) {
                      //伤害计算
                      let totaldamage = Number(damagecal(conteratk[aimerfinder], combatpldata[aimfinder].DB))
                      //反击成功造成伤害
                      combatpldata[atkerfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击成功，造成伤害${totaldamage}\n`
                      //判定重伤和昏迷
                      if (combatpldata[atkerfinder].HP < 0) {
                        combatpldata[atkerfinder].HP = 0
                        atkreply += `${atkername}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[atkerfinder].HPM) {
                        if (combatpldata[atkerfinder].HP === 0)
                          atkreply += `${atkername}受到重伤且生命值归零，陷入濒死状态\n`
                        else {
                          let atkerconroll = Roll(ruleCOC, combatpldata[atkerfinder].con)
                          if (atkerconroll[2] >= 2)
                            atkreply += `${atkername}受到重伤，体质检定${atkerconroll[0]}/${atkerconroll[1]}${successdiscription[atkerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${atkername}受到重伤，体质检定${atkerconroll[0]}/${atkerconroll[1]}${successdiscription[atkerconroll[2]]},陷入昏迷`
                        }
                      }
                      atkreply += `\n`
                    }
                    else {
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击失败\n\n`
                    }
                  }
                  else {
                    let aimkey = infect[aimerfinder]
                    //骰反击
                    let aimerroll = Roll(ruleCOC, combatpldata[aimfinder][aimkey], aimbp[aimerfinder])
                    if (atkerroll[2] >= aimerroll[2] && atkerroll[2] >= 2) {
                      //反击失败，效果和闪避一样
                      let totaldamage = Number(damagecal(atkerdamage, combatpldata[atkerfinder].DB, atkerroll[2]))

                      combatpldata[aimfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击失败，受到伤害${totaldamage}\n`
                      if (combatpldata[aimfinder].HP < 0) {
                        combatpldata[aimfinder].HP = 0
                        atkreply += `${aim[aimerfinder]}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[aimfinder].HPM) {
                        if (combatpldata[aimfinder].HP === 0)
                          atkreply += `${aim[aimerfinder]}受到重伤且生命值为0，陷入濒死状态`
                        else {
                          //重伤判定是否昏迷
                          let aimerconroll = Roll(ruleCOC, combatpldata[aimfinder].con)
                          if (aimerconroll[2] >= 2)
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},陷入昏迷`
                        }
                        atkreply += `\n`
                      }
                      atkreply += `\n`
                      // 此时反击未触发
                    }
                    else if (atkerroll[2] <= aimerroll[2] && aimerroll[2] >= 2) {
                      //伤害计算
                      let totaldamage = Number(damagecal(conteratk[aimerfinder], combatpldata[aimfinder].DB))
                      //反击成功造成伤害
                      combatpldata[atkerfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击成功，造成伤害${totaldamage}\n`
                      //判定重伤和昏迷
                      if (combatpldata[atkerfinder].HP < 0) {
                        combatpldata[atkerfinder].HP = 0
                        atkreply += `${atkername}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[atkerfinder].HPM) {
                        if (combatpldata[atkerfinder].HP === 0)
                          atkreply += `${atkername}受到重伤且生命值归零，陷入濒死状态\n`
                        else {
                          let atkerconroll = Roll(ruleCOC, combatpldata[atkerfinder].con)
                          if (atkerconroll[2] >= 2)
                            atkreply += `${atkername}受到重伤，体质检定${atkerconroll[0]}/${atkerconroll[1]}${successdiscription[atkerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${atkername}受到重伤，体质检定${atkerconroll[0]}/${atkerconroll[1]}${successdiscription[atkerconroll[2]]},陷入昏迷`
                        }
                      }
                      atkreply += `\n`
                    }
                    else {
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击失败\n\n`
                    }
                  }
                }

              }
            }
            seal.replyToSender(ctx, msg, atkreply)
          }
        }
        // 将受到伤害后的人物属性重新上传
        let atktrans = ""
        for (let atktransnum = 0; atktransnum < combatpldata.length; atktransnum++) {
          atktrans += combatpldata[atktransnum].cname + ` `
          for (var key in combatpldata[atktransnum]) {
            atktrans += key + ` ` + combatpldata[atktransnum][key] + ` `
          }
          atktrans += "\n"
        }
        // combat new
        const sora = [];
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, JSON.stringify(sora));
        // setnpc
        atktrans += "\n" + "\n[]";
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, atktrans);

      } else if (val === `%`) {
        // kp使用的不允许闪避/反击的部分
        let atkername = cmdArgs.getArgN(2)
        let atkerskill = cmdArgs.getArgN(3)
        let atkerdamage = cmdArgs.getArgN(4)
        let atkerbp = 0
        atkerbp = (atkername.match(/\+/g) || []).length - (atkername.match(/-/g) || []).length;
        atkername = atkername.replace(/[+-]/g, '');
        const aim = []
        let inputcount = 4
        let inputpl = cmdArgs.getArgN(++inputcount)
        while (inputpl !== "") {
          aim.push(inputpl)
          inputpl = cmdArgs.getArgN(++inputcount)
        }

        let combatpldata = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        let ruleCOC = ctx.group.cocRuleIndex
        //暴力O(n^3)算法，直接遍历找到攻击者和反击者，或许可以优化成二分O(n*logn*logn)但我不会
        for (let atkerfinder = 0; atkerfinder < combatpldata.length; atkerfinder++) {
          if (combatpldata[atkerfinder].cname === atkername) {
            let atkerskilldata = combatpldata[atkerfinder][atkerskill];
            let atkreply = ""
            //骰点在这里
            let atkerroll = Roll(ruleCOC, atkerskilldata, atkerbp)
            for (let aimerfinder = 0; aimerfinder < aim.length; aimerfinder++) {
              for (let aimfinder = 0; aimfinder < combatpldata.length; aimfinder++) {
                if (combatpldata[aimfinder].cname === aim[aimerfinder]) {
                  if (atkerroll[2] >= 2) {
                    //这里直接把闪避失败的贴过来了
                    let totaldamage = Number(damagecal(atkerdamage, combatpldata[atkerfinder].DB, atkerroll[2]))
                    //计算伤害后更新数据
                    combatpldata[aimfinder].HP -= totaldamage
                    atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                    atkreply += `${aim[aimerfinder]}受到伤害${totaldamage}\n`
                    if (combatpldata[aimfinder].HP < 0) {
                      combatpldata[aimfinder].HP = 0
                      atkreply += `${aim[aimerfinder]}生命值归零\n`
                    }
                    if (totaldamage * 2 >= combatpldata[aimfinder].HPM) {
                      if (combatpldata[aimfinder].HP === 0)
                        atkreply += `${aim[aimerfinder]}受到重伤且生命值为0，陷入濒死状态\n`
                      else {
                        //重伤判定是否昏迷
                        let aimerconroll = Roll(ruleCOC, combatpldata[aimfinder].con)
                        if (aimerconroll[2] >= 2)
                          atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},未陷入昏迷`
                        else
                          atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},陷入昏迷`
                      }
                    }
                    atkreply += `\n`
                  }
                  else {
                    atkreply += `${atkername}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                    atkreply += `本次攻击未造成伤害`
                  }
                }
              }
            }
            seal.replyToSender(ctx, msg, atkreply)
          }
        }
        //最后同样的更新数据
        let atktrans = ""
        for (let atktransnum = 0; atktransnum < combatpldata.length; atktransnum++) {
          atktrans += combatpldata[atktransnum].cname + ` `
          for (var key in combatpldata[atktransnum]) {
            atktrans += key + ` ` + combatpldata[atktransnum][key] + ` `
          }
          atktrans += "\n"
        }
        // combat new
        const sora = [];
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, JSON.stringify(sora));
        // setnpc
        atktrans += "\n" + "\n[]";
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, atktrans);
      } else {
        //pl使用的包含反击/闪避的伤害计算
        let atkername = ctx.player.name;
        let atkerskill = cmdArgs.getArgN(1)
        let atkerdamage = cmdArgs.getArgN(2)
        let combatpldata = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        let ruleCOC = ctx.group.cocRuleIndex
        let inputcount = 2
        const aim = []
        const infect = []
        const conteratk = []
        const aimbp = []
        for (let i = 0; i < aim.length; i++) {
          aimbp.push((aim[i].match(/\+/g) || []).length - (aim[i].match(/-/g) || []).length)
          aim[i] = aim[i].replace(/[+-]/g, '')
        }
        let inputpl = cmdArgs.getArgN(++inputcount)
        while (inputpl !== "") {
          let inputinfect = cmdArgs.getArgN(++inputcount)
          aim.push(inputpl)
          infect.push(inputinfect)
          if (inputinfect !== "闪避") {
            let inputconter = cmdArgs.getArgN(++inputcount)
            conteratk.push(inputconter)
          }
          else {
            conteratk.push(0)
          }
          inputpl = cmdArgs.getArgN(++inputcount)
        }
        //暴力O(n^3)算法，直接遍历找到攻击者和反击者，或许可以优化成二分O(n*logn*logn)但我不会
        for (let atkerfinder = 0; atkerfinder < combatpldata.length; atkerfinder++) {
          if (combatpldata[atkerfinder].cname === atkername) {
            let atkerskilldata = combatpldata[atkerfinder][atkerskill];
            let atkreply = ""
            //骰点在这里
            let atkerroll = Roll(ruleCOC, atkerskilldata)
            for (let aimerfinder = 0; aimerfinder < aim.length; aimerfinder++) {
              for (let aimfinder = 0; aimfinder < combatpldata.length; aimfinder++) {

                if (combatpldata[aimfinder].cname === aim[aimerfinder]) {
                  if (infect[aimerfinder] === "闪避") {
                    //骰闪避
                    let aimerroll = Roll(ruleCOC, combatpldata[aimfinder].闪避, aimbp[aimerfinder])
                    if (atkerroll[2] > aimerroll[2] && atkerroll[2] >= 2) {
                      //闪避失败，计算伤害
                      let totaldamage = Number(damagecal(atkerdamage, combatpldata[atkerfinder].DB, atkerroll[2]))
                      combatpldata[aimfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的闪避${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},闪避失败，受到伤害${totaldamage}\n`
                      if (combatpldata[aimfinder].HP < 0) {
                        combatpldata[aimfinder].HP = 0
                        atkreply += `${aim[aimerfinder]}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[aimfinder].HPM) {
                        if (combatpldata[aimfinder].HP === 0)
                          atkreply += `${aim[aimerfinder]}受到重伤且生命值为0，陷入濒死状态\n`
                        else {
                          //重伤判定是否昏迷
                          let aimerconroll = Roll(ruleCOC, combatpldata[aimfinder].con)
                          if (aimerconroll[2] >= 2)
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},陷入昏迷`
                        }
                      }
                      atkreply += `\n`
                    }
                    else {
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的闪避${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},闪避成功\n\n`
                    }
                  }
                  else if (infect[aimerfinder] === "反击") {
                    //骰反击
                    let aimerroll = Roll(ruleCOC, combatpldata[aimfinder].斗殴, aimbp[aimerfinder])
                    if (atkerroll[2] >= aimerroll[2] && atkerroll[2] >= 2) {
                      //反击失败，效果和闪避一样
                      let totaldamage = Number(damagecal(atkerdamage, combatpldata[atkerfinder].DB, atkerroll[2]))
                      combatpldata[aimfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击失败，受到伤害${totaldamage}\n`
                      if (combatpldata[aimfinder].HP < 0) {
                        combatpldata[aimfinder].HP = 0
                        atkreply += `${aim[aimerfinder]}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[aimfinder].HPM) {
                        if (combatpldata[aimfinder].HP === 0)
                          atkreply += `${aim[aimerfinder]}受到重伤且生命值为0，陷入濒死状态`
                        else {
                          //重伤判定是否昏迷
                          let aimerconroll = Roll(ruleCOC, combatpldata[aimfinder].con)
                          if (aimerconroll[2] >= 2)
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},陷入昏迷`
                        }
                        atkreply += `\n`
                      }
                      atkreply += `\n`
                      // 此时反击未触发
                    }
                    else if (atkerroll[2] <= aimerroll[2] && aimerroll[2] >= 2) {
                      let totaldamage = Number(damagecal(conteratk[aimerfinder], combatpldata[aimfinder].DB))
                      //反击成功造成伤害
                      combatpldata[atkerfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击成功，造成伤害${totaldamage}\n`
                      //判定重伤和昏迷
                      if (combatpldata[atkerfinder].HP < 0) {
                        combatpldata[atkerfinder].HP = 0
                        atkreply += `${atkername}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[atkerfinder].HPM) {
                        if (combatpldata[atkerfinder].HP === 0)
                          atkreply += `${atkername}受到重伤且生命值归零，陷入濒死状态\n`
                        else {
                          let atkerconroll = Roll(ruleCOC, combatpldata[atkerfinder].con)
                          if (atkerconroll[2] >= 2)
                            atkreply += `${atkername}受到重伤，体质检定${atkerconroll[0]}/${atkerconroll[1]}${successdiscription[atkerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${atkername}受到重伤，体质检定${atkerconroll[0]}/${atkerconroll[1]}${successdiscription[atkerconroll[2]]},陷入昏迷`
                        }
                      }
                      atkreply += `\n`
                    }
                    else {
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击失败\n\n`
                    }
                  }
                  else {
                    let aimkey = infect[aimerfinder]
                    //骰反击
                    let aimerroll = Roll(ruleCOC, combatpldata[aimfinder][aimkey], aimbp[aimerfinder])
                    if (atkerroll[2] >= aimerroll[2] && atkerroll[2] >= 2) {
                      //反击失败，效果和闪避一样
                      let totaldamage = Number(damagecal(atkerdamage, combatpldata[atkerfinder].DB, atkerroll[2]))

                      combatpldata[aimfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击失败，受到伤害${totaldamage}\n`
                      if (combatpldata[aimfinder].HP < 0) {
                        combatpldata[aimfinder].HP = 0
                        atkreply += `${aim[aimerfinder]}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[aimfinder].HPM) {
                        if (combatpldata[aimfinder].HP === 0)
                          atkreply += `${aim[aimerfinder]}受到重伤且生命值为0，陷入濒死状态`
                        else {
                          //重伤判定是否昏迷
                          let aimerconroll = Roll(ruleCOC, combatpldata[aimfinder].con)
                          if (aimerconroll[2] >= 2)
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${aim[aimerfinder]}受到重伤，体质检定${aimerconroll[0]}/${aimerconroll[1]}${successdiscription[aimerconroll[2]]},陷入昏迷`
                        }
                        atkreply += `\n`
                      }
                      atkreply += `\n`
                      // 此时反击未触发
                    }
                    else if (atkerroll[2] <= aimerroll[2] && aimerroll[2] >= 2) {
                      //伤害计算
                      let totaldamage = Number(damagecal(conteratk[aimerfinder], combatpldata[aimfinder].DB))
                      //反击成功造成伤害
                      combatpldata[atkerfinder].HP -= totaldamage
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击成功，造成伤害${totaldamage}\n`
                      //判定重伤和昏迷
                      if (combatpldata[atkerfinder].HP < 0) {
                        combatpldata[atkerfinder].HP = 0
                        atkreply += `${atkername}生命值归零\n`
                      }
                      if (totaldamage * 2 >= combatpldata[atkerfinder].HPM) {
                        if (combatpldata[atkerfinder].HP === 0)
                          atkreply += `${atkername}受到重伤且生命值归零，陷入濒死状态\n`
                        else {
                          let atkerconroll = Roll(ruleCOC, combatpldata[atkerfinder].con)
                          if (atkerconroll[2] >= 2)
                            atkreply += `${atkername}受到重伤，体质检定${atkerconroll[0]}/${atkerconroll[1]}${successdiscription[atkerconroll[2]]},未陷入昏迷`
                          else
                            atkreply += `${atkername}受到重伤，体质检定${atkerconroll[0]}/${atkerconroll[1]}${successdiscription[atkerconroll[2]]},陷入昏迷`
                        }
                      }
                      atkreply += `\n`
                    }
                    else {
                      atkreply += `${atkername}对${aim[aimerfinder]}的攻击${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n`
                      atkreply += `${aim[aimerfinder]}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]},反击失败\n\n`
                    }
                  }
                }

              }
            }
            seal.replyToSender(ctx, msg, atkreply)
          }
        }
        // 将受到伤害后的人物属性重新上传
        let atktrans = ""
        for (let atktransnum = 0; atktransnum < combatpldata.length; atktransnum++) {
          atktrans += combatpldata[atktransnum].cname + ` `
          for (var key in combatpldata[atktransnum]) {
            atktrans += key + ` ` + combatpldata[atktransnum][key] + ` `
          }
          atktrans += "\n"
        }
        // combat new
        const sora = [];
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, JSON.stringify(sora));
        // setnpc
        atktrans += "\n" + "\n[]";
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, atktrans);

      }
      // } else {
      //   seal.replyToSender(ctx, msg, `指令错误，请使用“.combat help”查看正确指令。`)
      // }
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['atk'] = cmdAtk;

//========================================================================================

//战技代骰
//.skill # atker skill aimer (infect)
//.skill skill aimer (infect) //(pl用)
const cmdSkill = seal.ext.newCmdItemInfo();
cmdSkill.name = 'skill'; // 指令名字，可用中文
cmdSkill.help = `.skill指令可用于代骰战技
  使用方法：.skill 模式 攻击者 技能 攻击目标

  模式为\`#\`时，攻击目标可以闪避或反击，此时填写的攻击目标部分应形如\`张三 闪避\`或\`张三 反击 1d4\`,此处使用反击默认对对方斗殴技能进行检定
  若省略攻击目标的应对方案，视为攻击目标不进行或无法进行闪避或反击，此时攻击目标部分值包含攻击目标的名称
  除此之外，当不填写模式时，指令将变为.skill 技能 攻击目标
  此时将把指令发出者作为攻击者，除此之外的部分和模式\`#\`一致

  描述贯穿伤害时，请在伤害串中加入\`\*\`号，例如\`\*1d4+db\
  需要奖励\/惩罚骰时，请在攻击者/攻击目标的名字上加上+\/-号，例如\`张三+\``;
cmdSkill.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if (val === '#') {
        let atkername = cmdArgs.getArgN(2)
        let atkerskill = cmdArgs.getArgN(3)
        let atkerbp = 0
        atkerbp = (atkername.match(/\+/g) || []).length - (atkername.match(/-/g) || []).length;
        atkername = atkername.replace(/[+-]/g, '');
        let aimername = cmdArgs.getArgN(4)
        let aimerinfect = cmdArgs.getArgN(5)
        let aimerdamage = cmdArgs.getArgN(6)
        let aimerbp = 0
        aimerbp = (aimername.match(/\+/g) || []).length - (aimername.match(/-/g) || []).length;
        aimername = aimername.replace(/[+-]/g, '');
        let combatpldata = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        let ruleCOC = ctx.group.cocRuleIndex
        for (let atkerfinder = 0; atkerfinder < combatpldata.length; atkerfinder++) {
          if (combatpldata[atkerfinder].cname === atkername) {
            for (let aimerfinder = 0; aimerfinder < combatpldata.length; aimerfinder++) {
              if (combatpldata[aimerfinder].cname === aimername) {
                let atkerskilldata = combatpldata[atkerfinder][atkerskill]
                let punishroll = Number(combatpldata[atkerfinder].BUILD - combatpldata[aimerfinder].BUILD) + Number(atkerbp)
                if (punishroll > 0)
                  punishroll = 0
                else if (punishroll <= -3) {
                  seal.replyToSender(ctx, msg, `体格差距过大，战技默认失败`)
                  break;
                }
                let atkerroll = Roll(ruleCOC, atkerskilldata, punishroll)
                if (aimerinfect === '闪避') {
                  let aimerskilldata = combatpldata[aimerfinder].闪避
                  let aimerroll = Roll(ruleCOC, aimerskilldata, aimerbp)
                  if (atkerroll[2] > aimerroll[2])
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的闪避${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n闪避失败，战技使用成功，请玩家自行修改效果`)
                  else
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的闪避${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n闪避成功，战技使用失败`)
                }
                else if (aimerinfect === '反击') {
                  let aimerskilldata = combatpldata[aimerfinder].斗殴
                  let aimerroll = Roll(ruleCOC, aimerskilldata, aimerbp)
                  if (atkerroll[2] >= aimerroll[2] && atkerroll[2] >= 2) {
                    // 反击失败，效果等同闪避
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的反击（斗殴）${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n反击失败，战技使用成功，请玩家自行修改效果`)
                  }
                  else if (aimerroll < 2) {
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的反击（斗殴）${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n战技使用和反击均失败\n`)
                  }
                  else {
                    let totaldamage = Number(damagecal(aimerdamage, combatpldata[aimerfinder].DB))
                    combatpldata[atkerfinder].HP -= totaldamage
                    if (combatpldata[atkerfinder].HP > 0)
                      seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n反击成功，造成${totaldamage}伤害，战技使用失败`)
                    else
                      seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n反击成功，造成${totaldamage}伤害\n${atkername}生命值归零，战技使用失败`)
                  }
                } else {
                  if (atkerroll[2] >= 2)
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n战技使用成功，请玩家自行修改效果`)
                  else
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n战技使用失败`)
                }
              }
            }
          }
        }
        // 将受到伤害后的人物属性重新上传
        let atktrans = ""
        for (let atktransnum = 0; atktransnum < combatpldata.length; atktransnum++) {
          atktrans += combatpldata[atktransnum].cname + ` `
          for (var key in combatpldata[atktransnum]) {
            atktrans += key + ` ` + combatpldata[atktransnum][key] + ` `
          }
          atktrans += "\n"
        }
        // combat new
        const sora = [];
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, JSON.stringify(sora));
        // setnpc
        atktrans += "\n" + "\n[]";
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, atktrans);
      } else if (val === "%") {
        let atkername = cmdArgs.getArgN(2)
        let atkerskill = cmdArgs.getArgN(3)
        let atkerbp = 0
        atkerbp = (atkername.match(/\+/g) || []).length - (atkername.match(/-/g) || []).length;
        atkername = atkername.replace(/[+-]/g, '');
        let aimername = cmdArgs.getArgN(4)
        let combatpldata = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        let ruleCOC = ctx.group.cocRuleIndex
        for (let atkerfinder = 0; atkerfinder < combatpldata.length; atkerfinder++) {
          if (combatpldata[atkerfinder].cname === atkername) {
            for (let aimerfinder = 0; aimerfinder < combatpldata.length; aimerfinder++) {
              if (combatpldata[aimerfinder].cname === aimername) {
                let atkerskilldata = combatpldata[atkerfinder][atkerskill]
                let punishroll = Number(combatpldata[atkerfinder].BUILD - combatpldata[aimerfinder].BUILD) + Number(atkerbp)
                if (punishroll > 0)
                  punishroll = 0
                else if (punishroll <= -3) {
                  seal.replyToSender(ctx, msg, `体格差距过大，战技默认失败`)
                  break;
                }
                let atkerroll = Roll(ruleCOC, atkerskilldata, punishroll)
                if (atkerroll[2] >= 2)
                  seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n战技使用成功`)
                else
                  seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n战技使用失败`)
              }
            }
          }
        }
      } else {
        let atkername = ctx.player.name
        let atkerskill = cmdArgs.getArgN(1)
        let aimername = cmdArgs.getArgN(2)
        let aimerinfect = cmdArgs.getArgN(3)
        let aimerdamage = cmdArgs.getArgN(4)
        let aimerbp = 0
        aimerbp = (aimername.match(/\+/g) || []).length - (aimername.match(/-/g) || []).length;
        aimername = aimername.replace(/[+-]/g, '');
        let combatpldata = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        let ruleCOC = ctx.group.cocRuleIndex
        for (let atkerfinder = 0; atkerfinder < combatpldata.length; atkerfinder++) {
          if (combatpldata[atkerfinder].cname === atkername) {
            for (let aimerfinder = 0; aimerfinder < combatpldata.length; aimerfinder++) {
              if (combatpldata[aimerfinder].cname === aimername) {
                let atkerskilldata = combatpldata[atkerfinder][atkerskill]
                let punishroll = Number(combatpldata[atkerfinder].BUILD - combatpldata[aimerfinder].BUILD)
                if (punishroll > 0)
                  punishroll = 0
                else if (punishroll <= -3) {
                  seal.replyToSender(ctx, msg, `体格差距过大，战技默认失败`)
                  break;
                }
                let atkerroll = Roll(ruleCOC, atkerskilldata, punishroll)
                if (aimerinfect === '闪避') {
                  let aimerskilldata = combatpldata[aimerfinder].闪避
                  let aimerroll = Roll(ruleCOC, aimerskilldata, aimerbp)
                  if (atkerroll[2] > aimerroll[2])
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的闪避${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n闪避失败，战技使用成功，请玩家自行修改效果`)
                  else
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的闪避${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n闪避成功，战技使用失败`)
                }
                else if (aimerinfect === '反击') {
                  let aimerskilldata = combatpldata[aimerfinder].斗殴
                  let aimerroll = Roll(ruleCOC, aimerskilldata, aimerbp)
                  if (atkerroll[2] >= aimerroll[2] && atkerroll[2] >= 2) {
                    // 反击失败，效果等同闪避
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的反击（斗殴）${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n反击失败，战技使用成功，请玩家自行修改效果`)
                  }
                  else if (aimerroll < 2) {
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的反击（斗殴）${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n战技使用和反击均失败\n`)
                  }
                  else {
                    let totaldamage = Number(damagecal(aimerdamage, combatpldata[aimerfinder].DB))
                    combatpldata[atkerfinder].HP -= totaldamage
                    if (combatpldata[atkerfinder].HP > 0)
                      seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n反击成功，造成${totaldamage}伤害，战技使用失败`)
                    else
                      seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n${aimername}的反击${aimerroll[0]}/${aimerroll[1]}${successdiscription[aimerroll[2]]}\n反击成功，造成${totaldamage}伤害\n${atkername}生命值归零，战技使用失败`)
                  }
                } else {
                  if (atkerroll[2] >= 2)
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n战技使用成功，请玩家自行修改效果`)
                  else
                    seal.replyToSender(ctx, msg, `${atkername}承受${punishroll}个惩罚骰，${atkerroll[0]}/${atkerroll[1]}${successdiscription[atkerroll[2]]}\n战技使用失败`)
                }
              }
            }
          }
        }
        // 将受到伤害后的人物属性重新上传
        let atktrans = ""
        for (let atktransnum = 0; atktransnum < combatpldata.length; atktransnum++) {
          atktrans += combatpldata[atktransnum].cname + ` `
          for (var key in combatpldata[atktransnum]) {
            atktrans += key + ` ` + combatpldata[atktransnum][key] + ` `
          }
          atktrans += "\n"
        }
        // combat new
        const sora = [];
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, JSON.stringify(sora));
        // setnpc
        atktrans += "\n" + "\n[]";
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, atktrans);
      }
      // else
      //   return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['skill'] = cmdSkill;


//========================================================================================

const cmdOutnumbered = seal.ext.newCmdItemInfo();
cmdOutnumbered.name = 'outnumbered'; // 指令名字，可用中文
cmdOutnumbered.help = '用于启用/禁用寡不敌众，0为禁用，1为启用，默认值为1。';
cmdOutnumbered.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if (val == 1 || val == 0) {
        seal.vars.intSet(ctx, `$goutnmubered`, val);
        let outnumberedText = '寡不敌众规则已'
        if (val) {
          outnumberedText += '启用。'
        } else {
          outnumberedText += '禁用。'
        }
        seal.replyToSender(ctx, msg, `${outnumberedText}`);
      } else {
        seal.replyToSender(ctx, msg, `指令错误，请使用“help”查看正确指令。`)
      }
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['outnumbered'] = cmdOutnumbered;

//追逐建立，初始化和报表
//.chase ……
/*
地图字符串格式：
起始位置 结束位置
玩家数量n
玩家1 位置1
玩家2 位置2
………………
玩家n 位置n
险境数量n
险境1 位置1 技能1 难度1(set中不支持)
险境2 位置2 技能2 难度2(set中不支持)
………………
险境n 位置n
*/
const cmdChase = seal.ext.newCmdItemInfo();
cmdChase.name = 'chase'; // 指令名字，可用中文
cmdChase.help = '';
cmdChase.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if (val === "new") {
        //new指令可以初始化回合数和地图
        let mapnew = `0 0\n0\n0`;
        // seal.vars.strSet(ctx, '$gCombatRound', `1`)
        seal.vars.strSet(ctx, `$gChaseMap`, mapnew)
        seal.replyToSender(ctx, msg, `地图数据已初始化`)
      }
      else if (val === "count") {
        let pldatas = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        //计算行动点
        let minMOV = 0x3f3f3f3f
        for (let i = 0; i < pldatas.length; i++) {
          if (pldatas[i].MOV < minMOV) {
            minMOV = pldatas[i].MOV
          }
        }
        for (let i = 0; i < pldatas.length; i++) {
          pldatas[i].acp = pldatas[i].MOV - minMOV
        }
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, antiParseUserData(pldatas))
        seal.replyToSender(ctx, msg, `玩家行动点计算完成`)
      }
      else if (val === "list") {
        let rankCCCharacters = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0]);
        let resultList = list(rankCCCharacters);
        seal.replyToSender(ctx, msg, `参战单位列表：\n${resultList}`);
      }
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['chase'] = cmdChase;

const cmdnewmap = seal.ext.newCmdItemInfo();
cmdnewmap.name = 'map'; // 指令名字，可用中文
cmdnewmap.help = '';
cmdnewmap.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if (val === `set`) {
        let l, r, m, n;
        let inputcount = 1
        let mapstring = ""
        l = cmdArgs.getArgN(++inputcount)
        r = cmdArgs.getArgN(++inputcount)
        m = cmdArgs.getArgN(++inputcount)
        let name, pos, skill
        mapstring += `${l} ${r}\n${m}\n`
        for (let i = 0; i < m; i++) {
          name = cmdArgs.getArgN(++inputcount)
          pos = cmdArgs.getArgN(++inputcount)
          mapstring += `${name} ${pos}\n`
        }
        n = cmdArgs.getArgN(++inputcount)
        mapstring += `${n}\n`
        for (let i = 0; i < n; i++) {
          name = cmdArgs.getArgN(++inputcount)
          pos = cmdArgs.getArgN(++inputcount)
          skill = cmdArgs.getArgN(++inputcount)
          mapstring += `${name} ${pos} ${skill} 2\n`
        }
        //为每个角色的pos赋值
        let mapobj = mapCheck(mapStrToObj(mapstring))
        let pldatas = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        for (let i = 0; i < mapobj.playernum; i++)
        {
          for (let j = 0; j < pldatas.length; j++)
          {
            if (mapobj.players[i].cname === pldatas[j].cname)
            {
              pldatas[j].pos = mapobj.players[i].pos;
            }
          }
        }
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, antiParseUserData(pldatas))
        //储存地图信息
        seal.replyToSender(ctx, msg, `地图设置完成`)
        seal.replyToSender(ctx, msg, mapObjToChart(mapobj))
        seal.vars.strSet(ctx, `$gChaseMap`, mapObjTOStr(mapobj))
      }
      if (val === `show`) {
        let mapstring = seal.vars.strGet(ctx, `$gChaseMap`)[0]
        let mapobj = mapCheck(mapStrToObj(mapstring))
        seal.replyToSender(ctx, msg, mapObjTOStr(mapobj))
        seal.replyToSender(ctx, msg, mapObjToChart(mapobj))
        seal.vars.strSet(ctx, `$gChaseMap`, mapObjTOStr(mapobj))
      }
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['map'] = cmdnewmap;

//险境创建
//.hazard name pos skill (difficulty)
const cmdnewhazard = seal.ext.newCmdItemInfo();
cmdnewhazard.name = 'newhazard'; // 指令名字，可用中文
cmdnewhazard.help = '';
cmdnewhazard.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      let hname = cmdArgs.getArgN(1);
      let hpos = cmdArgs.getArgN(2);
      let hskill = cmdArgs.getArgN(3);
      let hdlf = cmdArgs.getArgN(4);
      if (hdlf === `成功` || hdlf === `普通` || hdlf === "" || hdlf === `2`)
        hdlf = 2;
      else if (hdlf === `困难成功` || hdlf === `困难` || hdlf === `3`)
        hdlf = 3;
      else if (hdlf === `极难成功` || hdlf === `极难` || hdlf === `4`)
        hdlf = 4;
      else if (hdlf === `大成功` || hdlf === `5`)
        hdlf = 5;
      else {
        seal.replyToSender(ctx, msg, `难度设置错误`)
        return seal.ext.newCmdExecuteResult(true);
      }
      newhstr = `${hname} ${hpos} ${hskill} ${hdlf}\n`
      let mapobj = mapStrToObj(seal.vars.strGet(ctx, `$gChaseMap`)[0])
      mapobj.hazards.push({
        hname: hname,
        pos: Number(hpos),
        skill: hskill,
        diff: Number(hdlf),
      });
      mapobj.hazardnum++;
      seal.replyToSender(ctx, msg, `障碍设置完成`)
      seal.vars.strSet(ctx, `$gChaseMap`, mapObjTOStr(mapobj))
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['newhazard'] = cmdnewhazard;
ext.cmdMap['hazard'] = cmdnewhazard;


//移动
//.move # player distance(+x,-x) action(n)
// dis向右为正，向左为负，action处依次输入在对应险境处使用行动点的个数
const cmdmove = seal.ext.newCmdItemInfo();
cmdmove.name = 'move'; // 指令名字，可用中文
cmdmove.help = '';
cmdmove.solve = (ctx, msg, cmdArgs) => {
  let val = cmdArgs.getArgN(1);
  switch (val) {
    case 'help': {
      const ret = seal.ext.newCmdExecuteResult(true);
      ret.showHelp = true;
      return ret;
    }
    default: {
      if (val === `#`) {
        let mover = cmdArgs.getArgN(2)
        let dis = cmdArgs.getArgN(3)
        const act = []
        let inputcount = 3
        let aim = Number(0)
        if (dis === `to`) {
          aim = Number(cmdArgs.getArgN(4))
          inputcount++
        }
        else
        {
          dis = Number(dis)
        }
        /*如果角色选择谨慎行动，那么他可以花费行动点在用于越过险境的技能检定上获得奖励骰。*/
        let action = cmdArgs.getArgN(++inputcount)
        while (action != "") {
          act.push(action)
          action = cmdArgs.getArgN(++inputcount)
          if (action = '\/')
            action = 0;
        }
        let pldatas = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        // seal.replyToSender(ctx, msg, seal.vars.strGet(ctx, `$gChaseMap`)[0])
        let mapobj = mapStrToObj(seal.vars.strGet(ctx, `$gChaseMap`)[0])
        let ruleCOC = ctx.group.cocRuleIndex
        let replystr = ""
        let trans = Number(0); //移动距离
        let hazcount = Number(0); //障碍计数
        for (let i = 0; i < pldatas.length; i++) {
          if (mover === pldatas[i].cname) {
            if (dis === `to`) {
              dis = aim - pldatas[i].pos
            }
            else {
              aim = dis + pldatas[i].pos
            }
            //如果此时发现总行动点不足以支撑预期需要，则直接退出判定（等会写）
            if (dis > 0) {
              //考虑到会有行动点不足的情况出现，遍历路程中的每个点
              for (let loc = pldatas[i].pos; loc < aim; loc++) {
                if (pldatas[i].acp <= 0)
                  break;
                //遇到险境的特殊情况
                for (let j = 0; j < mapobj.hazardnum; j++) {
                  if (mapobj.hazards[j].pos === loc) {
                    hazcount++
                    if (act[hazcount] === undefined || act[hazcount] === `\/` || act[hazcount] === "")
                      act[hazcount] === 0
                    let actuse = Math.min(pldatas[i].acp, act[hazcount])
                    let hazroll = Roll(ruleCOC, pldatas[i][mapobj.hazards[j].skill], actuse, mapobj.hazards[j].diff - 1)
                    if (hazroll[3])
                      replystr += `${mover}在跨过险境 ${mapobj.hazards[j].hname} 时，${mapobj.hazards[j].skill}检定${hazroll[0]}/${hazroll[1]}${successdiscription[hazroll[2]]}，顺利跨过险境，${mover}的行动点剩余${pldatas[i].acp}个\n`
                    else {
                      let _act = Number(D(1, 3))
                      replystr += `${mover}在跨过险境 ${mapobj.hazards[j].hname} 时，${mapobj.hazards[j].skill}检定${hazroll[0]}/${hazroll[1]}${successdiscription[hazroll[2]]}，损失1d3=${_act}个行动点，${mover}的行动点剩余${pldatas[i].acp}个\n`
                      pldatas[i].acp -= _act
                    }
                  }
                }
                //险境结算完成后，进行移动
                trans++;
                pldatas[i].acp--;
                pldatas[i].pos++;
              }
            }
            else {
              //考虑到会有行动点不足的情况出现，遍历路程中的每个点
              for (let loc = pldatas[i].pos; loc > aim; loc--) {
                if (pldatas[i].acp <= 0)
                  break;
                //遇到险境的特殊情况
                for (let j = 0; j < mapobj.hazardnum; j++) {
                  if (mapobj.hazards[j].pos + 1 === loc) {
                    hazcount++
                    if (act[hazcount] === undefined || act[hazcount] === `\/` || act[hazcount] === "")
                      act[hazcount] === 0
                    let actuse = Math.min(pldatas[i].acp, act[hazcount])
                    let hazroll = Roll(ruleCOC, pldatas[i][mapobj.hazards[j].skill], actuse, mapobj.hazards[j].diff - 1)
                    if (hazroll[3])
                      replystr += `${mover}在跨过险境 ${mapobj.hazards[j].hname} 时，${mapobj.hazards[j].skill}检定${hazroll[0]}/${hazroll[1]}${successdiscription[hazroll[2]]}，顺利跨过险境，${mover}的行动点剩余${pldatas[i].acp}个\n`
                    else {
                      let _act = Number(D(1, 3))
                      replystr += `${mover}在跨过险境 ${mapobj.hazards[j].hname} 时，${mapobj.hazards[j].skill}检定${hazroll[0]}/${hazroll[1]}${successdiscription[hazroll[2]]}，损失1d3=${_act}个行动点，${mover}的行动点剩余${pldatas[i].acp}个\n`
                      pldatas[i].acp -= _act
                    }
                  }
                }
                //险境结算完成后，进行移动
                trans++;
                pldatas[i].acp--;
                pldatas[i].pos--;
              }
            }
            replystr += `${mover}共计移动了${trans}个单位，`
            replystr += `行动点剩余${pldatas[i].acp}个\n`
          }
        }
        for (let i = 0; i < mapobj.playernum; i++) {
          if (mapobj.players[i].cname === mover) {
            mapobj.players[i].pos += trans * dis / Math.abs(dis)
          }
        }
        seal.replyToSender(ctx, msg, replystr)
        mapobj = mapCheck(mapobj)
        seal.vars.strSet(ctx, `$gChaseMap`, mapObjTOStr(mapobj))
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, antiParseUserData(pldatas))
      }
      else {
        let mover = ctx.player.name
        let dis = cmdArgs.getArgN(1)
        const act = []
        let inputcount = 1
        let aim = Number(0)
        if (dis === `to`) {
          aim = Number(cmdArgs.getArgN(2))
          inputcount++
        }
        /*如果角色选择谨慎行动，那么他可以花费行动点在用于越过险境的技能检定上获得奖励骰。*/
        let action = cmdArgs.getArgN(++inputcount)
        while (action != "") {
          act.push(action)
          action = cmdArgs.getArgN(++inputcount)
          if (action = '\/')
            action = 0;
        }
        let pldatas = parseUserData(seal.vars.strGet(ctx, `$gCCAS单位数据录入`)[0])
        // seal.replyToSender(ctx, msg, seal.vars.strGet(ctx, `$gChaseMap`)[0])
        let mapobj = mapStrToObj(seal.vars.strGet(ctx, `$gChaseMap`)[0])
        let ruleCOC = ctx.group.cocRuleIndex
        let replystr = ""
        let trans = Number(0); //移动距离
        let hazcount = Number(0); //障碍计数
        for (let i = 0; i < pldatas.length; i++) {
          if (mover === pldatas[i].cname) {
            if (dis === `to`) {
              dis = aim - pldatas[i].pos
            }
            else {
              aim = dis + pldatas[i].pos
            }
            dis = Number(dis)
            //如果此时发现总行动点不足以支撑预期需要，则直接退出判定（等会写）
            if (dis > 0) {
              //考虑到会有行动点不足的情况出现，遍历路程中的每个点
              for (let loc = pldatas[i].pos; loc < aim; loc++) {
                if (pldatas[i].acp <= 0)
                  break;
                //遇到险境的特殊情况
                for (let j = 0; j < mapobj.hazardnum; j++) {
                  if (mapobj.hazards[j].pos === loc) {
                    hazcount++
                    if (act[hazcount] === undefined || act[hazcount] === `\/` || act[hazcount] === "")
                      act[hazcount] === 0
                    let actuse = Math.min(pldatas[i].acp, act[hazcount])
                    let hazroll = Roll(ruleCOC, pldatas[i][mapobj.hazards[j].skill], actuse, mapobj.hazards[j].diff - 1)
                    if (hazroll[3])
                      replystr += `${mover}在跨过险境 ${mapobj.hazards[j].hname} 时，${mapobj.hazards[j].skill}检定${hazroll[0]}/${hazroll[1]}${successdiscription[hazroll[2]]}，顺利跨过险境\n`
                    else {
                      let _act = Number(D(1, 3))
                      replystr += `${mover}在跨过险境 ${mapobj.hazards[j].hname} 时，${mapobj.hazards[j].skill}检定${hazroll[0]}/${hazroll[1]}${successdiscription[hazroll[2]]}，损失1d3=${_act}个行动点\n`
                      pldatas[i].acp -= _act
                    }
                  }
                }
                //险境结算完成后，进行移动
                trans++;
                pldatas[i].acp--;
                pldatas[i].pos++;
              }
            }
            else {
              //与向右移动的情况相似
              //考虑到会有行动点不足的情况出现，遍历路程中的每个点
              for (let loc = pldatas[i].pos; loc > aim; loc--) {
                if (pldatas[i].acp <= 0)
                  break;
                //遇到险境的特殊情况
                for (let j = 0; j < mapobj.hazardnum; j++) {
                  if (mapobj.hazards[j].pos + 1 === loc) {
                    hazcount++
                    if (act[hazcount] === undefined || act[hazcount] === `\/` || act[hazcount] === "")
                      act[hazcount] === 0
                    let actuse = Math.min(pldatas[i].acp, act[hazcount])
                    let hazroll = Roll(ruleCOC, pldatas[i][mapobj.hazards[j].skill], actuse, mapobj.hazards[j].diff - 1)
                    if (hazroll[3])
                      replystr += `${mover}在跨过险境 ${mapobj.hazards[j].hname} 时，${mapobj.hazards[j].skill}检定${hazroll[0]}/${hazroll[1]}${successdiscription[hazroll[2]]}，顺利跨过险境\n`
                    else {
                      let _act = Number(D(1, 3))
                      replystr += `${mover}在跨过险境 ${mapobj.hazards[j].hname} 时，${mapobj.hazards[j].skill}检定${hazroll[0]}/${hazroll[1]}${successdiscription[hazroll[2]]}，损失1d3=${_act}个行动点\n`
                      pldatas[i].acp -= _act
                    }
                  }
                }
                //险境结算完成后，进行移动
                trans++;
                pldatas[i].acp--;
                pldatas[i].pos--;
              }
            }
            replystr += `${mover}的行动点剩余${pldatas[i].acp}个\n`
          }
        }
        for (let i = 0; i < mapobj.playernum; i++) {
          if (mapobj.players[i].cname === mover) {
            mapobj.players[i].pos += trans * dis / Math.abs(dis)
          }
        }
        replystr += `${mover}共计移动了${trans}个单位`
        seal.replyToSender(ctx, msg, replystr)
        mapobj = mapCheck(mapobj)
        seal.vars.strSet(ctx, `$gChaseMap`, mapObjTOStr(mapobj))
        seal.vars.strSet(ctx, `$gCCAS单位数据录入`, antiParseUserData(pldatas))

      }
      return seal.ext.newCmdExecuteResult(true);
    }
  }
};
// 将命令注册到扩展中
ext.cmdMap['move'] = cmdmove;

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
