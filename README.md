## 跑团用：

### 1.cg preparer

```
.cg help 帮助
.cgsave <cg名称> <cg内容> 储存一个cg（个人变量，可跨群使用）
.cgload <cg名称> 加载一个已储存的cg
.cgdelete <cg名称> 删除一个cg

特别提醒：不要让cg过于长，容易被海豹分段（一般几百字是没问题的）
```

### 2.CCASusertool

```
建议搭配CCAS使用，详见 https://github.com/Sheyiyuan/Dice_Plug-in.git
```

#### 2.1 random_npc

```
.npcrd help 帮助
.npcrd num name skill1 val1 skill2 val2…… 生成一定数量的同种npc单位
num：生成npc数量
name：npc名称
skill：npc技能
val：npc技能的属性值（可以是数字或数字范围，如70或50-80）
例如：.npcrd 10 村民 str 50-80 con 50-80 siz 60-85 dex 40-70 斗殴 25 手枪 20-50
返回结果可能如下：
/ 村民1 str 55 con 60 siz 65 dex 45 斗殴 25 手枪 40
/ 村民2 str 70 con 75 siz 70 dex 50 斗殴 25 手枪 25
/ 村民3 str 70 con 65 siz 70 dex 60 斗殴 25 手枪 50
/ 村民4 str 55 con 50 siz 80 dex 55 斗殴 25 手枪 25
/ 村民5 str 65 con 55 siz 65 dex 70 斗殴 25 手枪 30
/ 村民6 str 55 con 75 siz 70 dex 40 斗殴 25 手枪 35
/ 村民7 str 55 con 60 siz 65 dex 45 斗殴 25 手枪 40
/ 村民8 str 75 con 65 siz 65 dex 45 斗殴 25 手枪 45
/ 村民9 str 60 con 55 siz 80 dex 45 斗殴 25 手枪 35
/ 村民10 str 70 con 65 siz 65 dex 65 斗殴 25 手枪 30
该结果可以直接填入CCAS中的setnpc指令，具体详见CCAS
```

