
var path = [
    "HTML/AddVote.html",
    "HTML/ManageVote.html",
    "HTML/AttendVote.html",
    "HTML/ResultVote.html",
]

var web3;
var voteFactory;
var currAddress = defaultAddress;
var currAccount = undefined;
var currPwd = undefined;
var isConnected = false;
var isUnlock = false;

var currPage = -1;
function jump(index)
{
    document.getElementById('iframe').src = path[index];
    currPage = index;
}

function setWeb3()
{
    var button = document.getElementById("btnConnect");
    var addr = document.getElementById("address").value;
    var statusImg = document.getElementById("status");
    
    if(addr == currAddress) return;

    if(addr == "")
        addr = defaultAddress;

    web3 = new Web3(addr)
    button.innerText = "连接中...";
    statusImg.src = "./Image/loading.png";

    setTimeout(function(){
        isConnected = web3.currentProvider.connected
        if(isConnected)
        {
            button.innerText = "连接";
            statusImg.src = "./Image/right.png";
            currAddress = addr;
            document.getElementById("address").value = addr;

            // 获取投票工厂合约
            voteFactory = new web3.eth.Contract(voteFactoryAbi,voteFactoryAddress);
        }
        else
        {
            web3 = undefined;
            button.innerText = "连接";
            statusImg.src = "./Image/wrong.png";
            currAddress = addr;
        }
        setAccount();
    },3000)
}

function setAccount()
{
    var select = document.getElementById("account");
    if(!isConnected)
    {
        select.options.length = 0;
        return;
    }
    
    web3.eth.getAccounts().then((accounts) => {
        select.options.length = 0;
        accounts.forEach(account => {
            var text = account.substring(0,12) + "......" + account.substring(account.length-10,account.length);
            select.options.add(new Option(text,account));
        });
        select.options.add(new Option("添加","add"));

        currAccount = accounts[0];
        accountOnchange(document.getElementById("account"));
    });
}

function accountOnchange(select)
{
    text = document.getElementById("btnUnlockText");
    btn = document.getElementById("btnUnlock");
    img = document.getElementById("account-status");

    if(select.selectedIndex == select.length - 1)
    {
        btn.onclick = addAccount;
        btn.innerText = "添加";
    }
    else
    {
        btn.onclick = unlockAccount;
        btn.innerText = "解锁";
    }
    img.src = "";

    currAccount = select.options[select.selectedIndex].value;
    currPwd = undefined;
}

function addAccount()
{
    if(!isConnected) return;

    password = document.getElementById("password").value;
    img = document.getElementById("account-status");

    img.src = "./Image/loading.png"
    web3.eth.personal.newAccount(password).then((result) => {
       setAccount(); 
       img.src = "./Image/right.png";

       setTimeout(function(){
           img.src = "";
       }, 5000)
    });
}

function unlockAccount()
{
    if(!isConnected) return false;

    account = document.getElementById("account").value
    password = document.getElementById("password").value;
    img = document.getElementById("account-status");

    img.src = "./Image/loading.png";
    web3.eth.personal.unlockAccount(account,password, (error, result) => {
        if(error){
            img.src = "./Image/wrong.png";
            return false;
        }
        else if(result) 
        {
            currPwd = password;
            img.src = "./Image/right.png";
            return true;
        }
    })
}

var isManager = false
function ChooseType(index)
{
    isManager = index == 1;

    var btn = document.getElementsByName("btnType")[index];
    var btnDefault = document.getElementsByName("btnType")[(index + 1)%2]

    btn.setAttribute("class","btnType-choose");
    btnDefault.setAttribute("class","btnType-default")

    // 刷新界面
    if(currPage == 2)
    {
        jump(2);
    }
}

function SetVoteInfo(voteAddr)
{
    var voteContract = new web3.eth.Contract(voteAbi,voteAddr);
    voteContract.methods.GetVoteInfo().call().then((result) => {
        document.getElementById("voteName").innerText = `${web3.utils.hexToUtf8(result[0])} (${result[6]})`;
        document.getElementById("voteRTime").innerText = ParseTimeFormat(result[2] * 1000," - ");
        document.getElementById("voteSTime").innerText = ParseTimeFormat(result[3] * 1000," - ");
        document.getElementById("voteETime").innerText = ParseTimeFormat(result[4] * 1000," - ");
        document.getElementById("voteType").innerText = result[5] ? "私有" : "公开";
    })
}

function init()
{
    jump(0);
    setWeb3();
    setAccount();
}
