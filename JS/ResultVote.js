
function Search(value)
{
    var voteFactory = parent.voteFactory;

    var web3 = parent.web3;
    var index = document.getElementById("searchSelect").selectedIndex;
    var value = document.getElementById("SearchText").value;

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
                    var name = parent.web3.utils.hexToUtf8(result[0]);
                    setVoteName(name);
                    setVoteResult(result[1]);
                    parent.SetVoteInfo(result[1]);
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
                    var name = parent.web3.utils.hexToUtf8(result[0]);
                    setVoteName(name);
                    setVoteResult(value);
                    parent.SetVoteInfo(value);
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
                    setVoteName(value);
                    setVoteResult(result[0]);
                    parent.SetVoteInfo(result[0]);
                }
            })
            break;
    }
}

function SearchBaseChange(index)
{
    var text = index == 0 ? "请输入投票索引号..." : (index == 1 ? "请输入投票地址..." : "请输入投票名称...");
    document.getElementById("SearchText").setAttribute("placeholder", text);
}

function setVoteName(name)
{
    var txtName = document.getElementById("voteName");
    txtName.innerText = name;
}

function setVoteResult(addr)
{
    var web3 = parent.web3;
    var abi = parent.voteAbi;
    var account = parent.currAccount;

    var ul = document.getElementById("result-ul");
    ul.innerHTML = "";

    var voteContract = new web3.eth.Contract(abi,addr);
    voteContract.methods.CalculateVote().call({from:account}, function(error,result){
        if(error)
        {
            alert("投票尚未结束，请耐心等待！！")
            voteContract.methods.GetCandidateList().call({from:account},function(error,result){
                if(error)
                {
                    console.log(error);
                }
                else
                {
                    var nameList = ParseNames(result[1],result[2],web3);
                    nameList.forEach(name => {
                        var li = CreateCalculateLi(name);
                        ul.appendChild(li);
                    });
                }
            })
        }
        else
        {
            var nameList = ParseNames(result[0],result[1],web3);
            var reList = result[2];
            var max = -1;
            var sum = 0;
            for(var i=0; i<reList.length; i++) {
                if(reList[i] > max)
                    max = reList[i];
                sum += parseInt(reList[i]);
            }

            for(var i=0; i<reList.length; i++) 
            {
                var li = CreateResultLi(reList[i],max,sum,nameList[i]);
                ul.appendChild(li);
            }
        }
    })
    
}

function CreateResultLi(curr, max, sum, name)
{


    var li = document.createElement("li");
    var html = `<li class="result-li"><div class="result-div" style="width:${curr/max*100}%"><p class="result-p">${name} (${curr}票-${(curr/sum*100).toFixed(2)}%)</p></div></li>`
    li.innerHTML = html;
    return li;
}

function CreateCalculateLi(name)
{
    var li = document.createElement("li");
    var html = `<li class="result-li"><div class="result-div" style="width:0%"><p class="result-p">${name} (计票中...)</p></div></li>`
    li.innerHTML = html;
    return li;
}