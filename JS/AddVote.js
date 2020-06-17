var web3 = parent.web3;

function CreateVote()
{
    var name = parent.web3.utils.utf8ToHex(document.getElementById("name").value);
    var rTime = Local2Zero(document.getElementById("rTime").valueAsNumber / 1000);
    var sTime = Local2Zero(document.getElementById("sTime").valueAsNumber / 1000);
    var eTime = Local2Zero(document.getElementById("eTime").valueAsNumber / 1000);
    var isPrivate = voteType == 0;

    if(name == "0x"){
        alert("请输入投票名称");
        return;
    }

    if(isNaN(rTime) || isNaN(sTime) || isNaN(eTime)) {
        alert("请填写时间信息！");
        return;
    }

    var now = new Date().getTime() / 1000;
    if(rTime <now || sTime < rTime || eTime < sTime) {
        alert("请正确填写信息！")
        return;
    }

    if(parent.currPwd == undefined || !parent.currAccount)
    {
        alert("账号未解锁或账号不存在!");
        return;
    } 

    web3.eth.personal.unlockAccount(parent.currAccount, parent.currPwd, (error, result) => {
        if(error)
        {
            alert("账号出错");
        }
        else
        {
            var address = parent.currAccount;
            var voteFactory = parent.voteFactory;

            voteFactory.methods.CreateVote(name,rTime,sTime,eTime,isPrivate).send({from:address})
            .on('receipt',function(receipt){
                var value = receipt.events.CreateVoteSuccess.returnValues;
                
                var div = document.getElementById("result");
                var index = document.getElementById("voteIndex");
                var addr = document.getElementById("voteAddress");

                div.setAttribute("style","display:''");
                index.value = value[0];
                addr.value = value[1];
                alert(`创建成功！\n索引号:${value[0]}\n地址:${value[1]}`);
            })
            .on('error',function(error){
                alert('创建出错')
            })
        }
    })
    
}

var voteType = 0;
function ChooseType(index)
{
    voteType = index;

    var btn = document.getElementsByName("btnType")[index];
    var btnDefault = document.getElementsByName("btnType")[(index + 1)%2]

    btn.setAttribute("class","btnType-choose");
    btnDefault.setAttribute("class","btnType-default")
}

function ResetInfo()
{
    document.getElementById("name").value = "";
    document.getElementById("rTime").value = "";
    document.getElementById("sTime").value = "";
    document.getElementById("eTime").value = "";
    ChooseType(0);
}