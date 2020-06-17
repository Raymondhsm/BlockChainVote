var leftOption = 0;
var topOption = 0;
var currAddress = undefined;

function LeftOption(index)
{
    leftOption = index;

    var info = document.getElementById("infoPage");
    var read = document.getElementById("readPage");
    if(index == 0)
    {
        info.setAttribute("style","dispaly:'';");
        read.setAttribute("style","display:none;");
    }
    else
    {
        read.setAttribute("style","dispaly:'';");
        info.setAttribute("style","display:none;");
    }

    TopOption(0);
}

function OwnVote()
{
    var voteFactory = parent.voteFactory;
    if(voteFactory == undefined) return;
    var account = parent.currAccount;

    voteFactory.methods.GetOwnVote(account).call().then((result) => {
        console.log(result);
        var names = result[0];
        var offset = result[1];
        var address = result[2];

        var select = document.getElementById("voteSelect");
        for(var i=0; i<offset.length; i++)
        {
            var s = offset[i];
            var e = i == offset.length ? names.length : offset[i+1];
            var name = parent.web3.utils.hexToUtf8(names.substring(s,e));

            select.options.add(new Option(name,address[i]));
        }

        if(address.length > 0) OnSelectChange(address[0]);
    })

}

function TopOption(index)
{
    topOption = index;

    var btnTops = document.getElementsByName("btnTop");
    btnTops.forEach(btn => {
        btn.setAttribute("style","");
    });
    btnTops[index].setAttribute("style","border-bottom:3px solid skyblue;")

    SetPersonList(leftOption-1, index);
}

function OnSelectChange(addr)
{
    currAddress = addr;
    if(leftOption == 0)
        SetInfo();
    else
        SetPersonList(leftOption-1, topOption);
}

function ModifyInfo()
{
    var name = parent.web3.utils.utf8ToHex(document.getElementById("infoName").value);
    var rTime = Local2Zero(document.getElementById("infoRTime").valueAsNumber / 1000);
    var sTime = Local2Zero(document.getElementById("infoSTime").valueAsNumber / 1000);
    var eTime = Local2Zero(document.getElementById("infoETime").valueAsNumber / 1000);

    if(rTime == NaN || sTime == NaN || eTime == NaN) return;

    var now = new Date().getTime() / 1000;
    if(rTime != infoResult[2] && (rTime < now || sTime < now))return;
    if(sTime != infoResult[3] && (now > sTime || sTime > eTime))return;
    if(eTime != infoResult[4] && (eTime < sTime || eTime < rTime))return;

    if(parent.currPwd == undefined || !parent.currAccount)
    {
        alert("账号未解锁或账号不存在!");
        return;
    } 

    var web3 = parent.web3;
    web3.eth.personal.unlockAccount(parent.currAccount, parent.currPwd, (error, result) => {
        if(error)
        {
            alert("账号出错");
        }
        else
        {
            var address = parent.currAccount;
            var abi = parent.voteAbi;
            var voteContract = new web3.eth.Contract(abi,currAddress);

            voteContract.methods.SetVoteInfo(name,rTime,sTime,eTime).send({from:address,password:parent.currPwd})
            .on('receipt',function(receipt){
                
                // 修改key
                if(name != infoResult[0])
                {
                    web3.eth.personal.unlockAccount(parent.currAccount, parent.currPwd, (error, result) => {
                        if(error)
                        {
                            alert("账号出错");
                        }
                        else
                        {
                            parent.voteFactory.methods.UpdateKey(infoResult[0],name).send({from:address,password:parent.currPwd})
                            .on('receipt',function(re){
                                var select = document.getElementById("voteSelect");
                                select.options[select.selectedIndex].text = web3.utils.hexToUtf8(name);
                                alert('修改成功！');
                            })
                            .on('error',function(error){
                                alert('修改出错')
                            })
                        }
                    })
                    
                }
                else{
                    alert('修改成功！');
                }
            })
            .on('error',function(error){
                alert('修改出错')
            })
        }
    })
    
}

function ResetInfo()
{
    SetInfoHtml();
}

var infoResult;
function SetInfo()
{
    var web3 = parent.web3;
    var abi = parent.voteAbi;
    var voteContract = new web3.eth.Contract(abi,currAddress);
    voteContract.methods.GetVoteInfo().call().then((result) => {
        infoResult = result;
        SetInfoHtml();
    })
}

function SetInfoHtml()
{
    if(infoResult == undefined) return;
    document.getElementById("infoName").value = parent.web3.utils.hexToUtf8(infoResult[0]);
    document.getElementById("infoRTime").value = ParseTimeFormat(infoResult[2] * 1000);
    document.getElementById("infoSTime").value = ParseTimeFormat(infoResult[3] * 1000);
    document.getElementById("infoETime").value = ParseTimeFormat(infoResult[4] * 1000);
    document.getElementsByName("btnType")[0].setAttribute("class", !infoResult[5] ? "btnType-default" : "btnType-choose");
    document.getElementsByName("btnType")[1].setAttribute("class", infoResult[5] ? "btnType-default" : "btnType-choose");
    document.getElementById("infoIndex").value = infoResult[6];
    document.getElementById("infoAddr").value = currAddress;
}

var addressList = undefined;
var nameList = undefined;
var IDList = undefined;
var eachPage = 8;
var currPage = 1;
var totalPage = 0;
function SetPersonList(flag, status)
{
    var web3 = parent.web3;
    var abi = parent.voteAbi;
    var account = parent.currAccount;
    var voteContract = new web3.eth.Contract(abi,currAddress);

    document.getElementById("list-ul").innerHTML = "";
    voteContract.methods.GetPersonList(flag,status).call({from:account}).then((result) => {
        console.log(result);
        addressList = result[0];
        nameList = ParseNames(result[1],result[2],parent.web3);
        IDList = result[3];

        totalPage = Math.ceil(addressList.length / eachPage);
        document.getElementById("labelTP").innerText = `/ ${totalPage}`;
        currPage = 1;
        document.getElementById("txtCP").value = currPage;
        if(totalPage > 0)SetList(status);
    })
}

function SetList(status)
{
    var txtYes = status == 1 ? "已同意" : "同意";
    var txtNo = status == 2 ? "已拒绝" : "拒绝";
    var ul = document.getElementById("list-ul");

    var end = currPage == totalPage ? addressList.length : currPage*eachPage;
    for(var i=(currPage-1)*eachPage; i<end; i++)
    {
        var li = document.createElement("li");
        li.innerHTML = `<li class="list-li">
                <div class="label-div">
                    <label class="name-label">${nameList[i]}</label>
                    <label class="id-label">${IDList[i]}</label>
                    <label class="address-label">${addressList[i]}</label>
                </div>
                <div class="decide-div">
                    <button class="btnReject" name="btnReject" onclick="Reject(${i},this)" ${status==2?'disabled="true"':""}>${txtNo}</button>  
                    <button class="btnAccept" name="btnAccept" onclick="Agree(${i},this)" ${status==1?'disabled="true"':""}>${txtYes}</button>  
                </div>
            </li>`
        ul.appendChild(li);
    }

    document.getElementById("txtCP").value = currPage;
}

function Agree(i, btn)
{
    var address = addressList[(currPage - 1) + i];
    var web3 = parent.web3;
    var abi = parent.voteAbi;
    var account = parent.currAccount;
    var pwd = parent.currPwd;
    var voteContract = new web3.eth.Contract(abi,currAddress);

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
            voteContract.methods.StatusChange(leftOption-1, topOption, 1, address)
            .send({from:account,password:pwd})
            .on('receipt', function(receipt){
                console.log(receipt.events.Success.returnValues);
                if(receipt.events.Success.returnValues[0])
                {
                    btn.innerText = "已同意";
                    btn.disabled = true;
                }
            })
            .on('error',function(error){
                alert('处理出错')
            })
        }
    })
    
}

function Reject(i,btn)
{
    var address = addressList[(currPage - 1) + i];
    var web3 = parent.web3;
    var abi = parent.voteAbi;
    var account = parent.currAccount;
    var pwd = parent.currPwd;
    var voteContract = new web3.eth.Contract(abi,currAddress);

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
            voteContract.methods.StatusChange(leftOption-1, topOption, 2, address)
            .send({from:account,password:pwd})
            .on('receipt', function(receipt){
                console.log(receipt.events.Success.returnValues);
                if(receipt.events.Success.returnValues[0])
                {
                    btn.innerText = "已拒绝";
                    btn.disabled = true;
                }
            })
            .on('error',function(error){
                alert('处理出错')
            })
        }
    })
    
}

function NextPage()
{
    if(currPage != totalPage)
    {
        currPage++;
        SetPersonList(topOption);
    }
}

function PrePage()
{
    if(currPage != totalPage)
    {
        currPage--;
        SetPersonList(topOption);
    }
}

function ChooseType(index)
{
    alert("暂不支持修改投票类型！！");
}