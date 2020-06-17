function ParseNames(names,offset,web3)
{
    var nameList = [];
    var endIndex;
    var name;
    for(var i=0; i<offset.length; i++)
    {
        endIndex = offset.length == i ? names.length : offset[i+1];
        name = names.substring(offset[i],endIndex);
        nameList.push(web3.utils.hexToUtf8(name));
    }
    return nameList;
}

function ParseTimeFormat(millisecond, signal = "T")
{
    var d = new Date(millisecond);
    var dateStr  = d.getFullYear() + "-" +  ("0"+(d.getMonth()+1)).slice(-2)  + "-"  + ("0" + d.getDate()).slice(-2)  
                    + signal + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
    return dateStr;
}

function Local2Zero(millisecond)
{
    var offset = new Date().getTimezoneOffset() * 60;
    return millisecond + offset;
}

function Zero2Local(millisecond)
{
    var offset = new Date().getTimezoneOffset() * 60;
    return millisecond - offset;
}