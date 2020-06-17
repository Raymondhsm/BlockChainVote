var leftOption = 0;

function LeftOption(index)
{
    leftOption = index;

    var attend = document.getElementById("attendPage");
    var vote = document.getElementById("votePage");
    if(index == 0)
    {
        attend.setAttribute("style","dispaly:'';");
        vote.setAttribute("style","display:none;");
        document.getElementById("registerAccount").setAttribute("style",parent.isManager?"":"display:none");
    }
    else
    {
        vote.setAttribute("style","dispaly:'';");
        attend.setAttribute("style","display:none;");
        setVoteCandidate();
    }
}

var radioOption = -1;
function radio(index)
{
    radioOption = index;
    var radios = document.getElementsByName("radio");
    radios.forEach(btnRadio => {
        btnRadio.setAttribute("class","btnRadio");
    });
    radios[index].setAttribute("class","btnRadioClick");
}

var voteAddress = undefined;
function Search(value)
{
    var voteFactory = parent.voteFactory;

    var web3 = parent.web3;
    var index = document.getElementById("searchSelect").selectedIndex;
    var value = document.getElementById("SearchText").value;
    
    var name = undefined;
    switch(index)
    {
        case 0:
            voteFactory.methods.GetVoteAddressByIndex(value).call(function(error,result){
                if(error)
                {
                    console.log(error);
                    alert("投票索引不存在！")
                }
                else
                {
                    name = parent.web3.utils.hexToUtf8(result[0]);
                    voteAddress = result[1];
                    setVoteName(name);
                    SetTips();
                    if(leftOption == 1)setVoteCandidate();
                    parent.SetVoteInfo(voteAddress);
                }
            })
            break;

        case 1:
            if(!web3.utils.isAddress(value))
            {
                alert("非法地址");
                return;
            }
            voteContract = new web3.eth.Contract(parent.voteAbi,value);
            voteContract.methods.GetVoteInfo().call(function(error, result){
                if(error)
                {
                    console.log(error);
                    alert("投票地址不存在！")
                }
                else
                {
                    voteAddress = value;
                    name = parent.web3.utils.hexToUtf8(result[0]);
                    setVoteName(name);
                    SetTips();
                    if(leftOption == 1)setVoteCandidate();
                    parent.SetVoteInfo(voteAddress);
                }
            })
            break;

        case 2:
            voteFactory.methods.GetVoteAddressByName(parent.web3.utils.utf8ToHex(value)).call(function(error,result){
                if(error || result.length == 0)
                {
                    console.log(error);
                    alert("投票名称不存在！")
                }
                else{
                    name = value;
                    voteAddress = result[0];
                    setVoteName(name);
                    SetTips();
                    if(leftOption == 1)setVoteCandidate();
                    parent.SetVoteInfo(voteAddress);
                }
            })
            break;
    }
}

function setVoteName(name)
{
    var names = document.getElementsByName("voteName");
    names.forEach(n => {
        n.innerText = name;
    });
}

function SetTips()
{
    // 管理模式不显示
    if(parent.isManager) return;

    var pCan = document.getElementById("tipsCan");
    var pVoter = document.getElementById("tipsVoter");
    pCan.innerText = "";
    pVoter.innerText = "";

    voteContract = new parent.web3.eth.Contract(parent.voteAbi,voteAddress);
    voteContract.methods.GetOwnStatus().call({from:parent.currAccount}, function(error,result){
        if(error)
        {
            console.log(error)
        }
        else
        {
            var re = result[0] == 0 ? "申请" : result[0] == 1 ? "取得" : "被拒绝";
            var txtCan = `你已${re}候选人资格，重新申请请慎重`;
            re = result[1] == 0 ? "申请" : result[1] == 1 ? "取得" : "被拒绝";
            var txtVoter = `你已${re}投票者资格，重新申请请慎重`
            if(result[0] != 3)pCan.innerText = txtCan;
            if(result[1] != 3)pVoter.innerText = txtVoter;
        }
    })

}

var candidateRadioAddress =undefined;
function setVoteCandidate()
{
    if(voteAddress == undefined)return;

    var account = parent.currAccount;
    var web3 = parent.web3;

    var voteContract = new web3.eth.Contract(parent.voteAbi,voteAddress);
    voteContract.methods.GetCandidateList().call({from:account},function(error,result){
        if(error)
        {
            console.log(error);
            alert("获取候选人列表出错,投票尚未开始！");
        }
        else
        {
            var address = result[0];
            var nameList = ParseNames(result[1],result[2],web3);
            candidateRadioAddress = address;
            SetRadioOption(nameList);

            voteContract.methods.GetMyCandidate().call({from:account},function(error,result){
                if(error)
                {
                    console.log(error)
                }
                else{
                    if(result[0] != 0)
                    {
                        radio(result[0]-1)
                    }
                }
            })
        }
    })

    radioOption = -1;
}

function SetRadioOption(nameList)
{
    var  div = document.getElementById("radioDiv");
    div.innerHTML = "";
    for(var i=0; i<nameList.length; i++){
        var option = `<button class="btnRadio" name="radio" onclick="radio(${i})">${nameList[i]}</button>`
        div.innerHTML += option;
    };
}

function Register(index)
{
    if(voteAddress == undefined) return;

    var web3 = parent.web3;
    var abi = parent.voteAbi;
    var account = parent.currAccount;
    if(account == undefined) return;

    var name = parent.web3.utils.utf8ToHex(document.getElementById("voterName").value);
    var id = document.getElementById("voterID").value;

    var voteContract = new web3.eth.Contract(abi,voteAddress);

    voteContract.methods.GetVoteInfo().call(function(error,info){
        if(info[2]*1000 < new Date().getTime()){
            alert(`投票注册已结束\n\n结束时间：${ParseTimeFormat(info[2] * 1000, " - ")}`)
            return;
        }
        if(!info[5])
        {
            alert('公开投票无需申请投票资格!')
            return
        }
        if(parent.currPwd == undefined || !parent.currAccount)
        {
            alert("账号未解锁或账号不存在!");
            return;
        } 

        if(parent.isManager)
        {
            var addr = document.getElementById("voterAccount").value;
            if(!web3.utils.isAddress(addr))
            {
                alert("非法地址");
                return;
            }
            web3.eth.personal.unlockAccount(parent.currAccount, parent.currPwd, (error, result) => {
                if(error)
                {
                    alert("账号出错");
                }
                else
                {
                    voteContract.methods.Register(index,addr,name,id).send({from:account,password:parent.currPwd})
                    .on('receipt',function(receipt){
                        if(receipt.events.Success.returnValues)
                            alert("申请成功");
                    })
                    .on('error',function(error){
                        alert('申请出错')
                    })
                }
            })
            
        }
        else
        {
            web3.eth.personal.unlockAccount(parent.currAccount, parent.currPwd, (error, result) => {
                if(error)
                {
                    alert("账号出错");
                }
                else
                {
                    voteContract.methods.RegisterSelf(index,name,id).send({from:account,password:parent.currPwd})
                    .on('receipt',function(receipt){
                        if(receipt.events.Success.returnValues)
                            alert("申请成功");
                    })
                    .on('error',function(error){
                        alert('申请出错')
                    })
                }
            })
            
        }
    })

    

}

function Vote()
{
    if(voteAddress == undefined || radioOption == -1) return;

    var web3 = parent.web3;
    var abi = parent.voteAbi;
    var account = parent.currAccount;
    if(account == undefined) return;

    var voteContract = new web3.eth.Contract(abi,voteAddress);
    voteContract.methods.GetVoteInfo().call(function(error,info){
        if(error)
        {
            console.log(error);
        }

        if(info[3]*1000 > new Date().getTime()){
            alert(`投票尚未开始，请稍等！\n开始时间：${ParseTimeFormat(info[3] * 1000," - ")}\n结束时间：${ParseTimeFormat(info[4] * 1000, " - ")}`)
            return;
        }
        if(info[4] * 1000 < new Date().getTime()){
            alert(`投票已经结束！\n开始时间：${ParseTimeFormat(info[3] * 1000," - ")}\n结束时间：${ParseTimeFormat(info[4] * 1000, " - ")}`)
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
                voteContract.methods.ToVote(radioOption).send({from:account,password:parent.currPwd})
                .on('receipt',function(receipt){
                    if(receipt.events.Success.returnValues[0])
                        alert("投票成功");
                })
                .on('error',function(error){
                    alert('投票出错')
                })
            }
        })
    })
    
}

function SearchBaseChange(index)
{
    var text = index == 0 ? "请输入投票索引号..." : (index == 1 ? "请输入投票地址..." : "请输入投票名称...");
    document.getElementById("SearchText").setAttribute("placeholder", text);
}

